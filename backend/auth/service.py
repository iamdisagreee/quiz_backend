from optparse import Option
from random import randint
from zoneinfo import ZoneInfo

import jwt

from slugify import slugify
from datetime import timedelta, datetime, timezone
from typing import Annotated, Optional
from taskiq_nats import NATSKeyValueScheduleSource
from redis.asyncio import Redis
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from fastapi import APIRouter, Depends,HTTPException, Request, Form
from starlette import status
from passlib.context import CryptContext
from taskiq import ScheduledTask

from backend.auth.requests import change_status_confirmed, delete_user, add_user, get_user_by_email, \
    get_user_by_username
from backend.config import load_config
from backend.database.models import User


class AuthService:
    def __init__(self,
                 postgres: AsyncSession = None,
                 redis: Redis = None,
                 scheduler_storage: NATSKeyValueScheduleSource = None):

        self._postgres = postgres
        self._redis = redis
        self._scheduler_storage = scheduler_storage

    async def _create_bcrypt_context(self):
        """ Создаем атрибут с методом шифрования """
        self._bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

    async def _authenticate_user(self,
                                username: str,
                                password: str):
        """ Проверяем регистрацию, пароль"""
        user = await get_user_by_username(self._postgres,
                                          username)

        await self._create_bcrypt_context()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='User is not registered',
                headers={'WWW-Authenticate': "Bearer"}
            )
        elif not self._bcrypt_context.verify(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Invalid authentication credentials',
                headers={'WWW-Authenticate': "Bearer"}
            )

        return user

    @staticmethod
    async def _create_access_token(username: str,
                                   user_id: int,
                                   expires_delta: timedelta):
        """ Создаем токен с полезной нагрузкой """
        payload = {
            'username': username,
            'id': user_id,
            'expire': datetime.now(timezone.utc) + expires_delta
        }

        payload['expire'] = int(payload['expire'].timestamp())
        config = load_config()
        return jwt.encode(payload, config.jwt_auth.secret_key, algorithm=config.jwt_auth.algorithm)

    async def login(self,
                    username: str,
                    password: str):
                    
        """ Возвращаем токен с полезной нагрузкой """
        user = await self._authenticate_user(username,
                                       password)

        token = await self._create_access_token(user.username,
                                                user.id,
                                                expires_delta=timedelta(hours=1))
        return {
            'access_token': token,
            'token_type': 'Bearer'
        }

    async def _task_to_delete_in_minute(self,
                                        username: str,
                                        email: str):
        """ Создаем задачу на удаление кода через минуту из redis-хранилища """
        await self._scheduler_storage.add_schedule(
            ScheduledTask(
                task_name='schedule_remove_auth_code',
                labels={},
                args=[],
                kwargs={"email": email},
                schedule_id=f'auth_{username}',
                time=datetime.now(ZoneInfo('Europe/Moscow')) + timedelta(minutes=5)
            )
        )

    @staticmethod
    async def _send_email(mail_user, mail_password, to_email, header, body):
        """
        Отправка письма по электронной почте с использованием SMTP-сервера Яндекса
        :param mail_user: почта адресанта
        :param mail_password: специальный пароль адресанта
        :param to_email: почта адресата
        :param header: заголовок письма
        :param body: текст письма
        :return:
        """
        # header = 'Код подтверждения'
        # auth_code = randint(100000, 999999)
        # body = f'Ваш код: {auth_code}'
        # config = load_config()
        # mail_user=config.mail.mail_user
        # mail_password=config.mail.mail_password

        SMTP_SERVER = "smtp.yandex.com"
        SMTP_PORT = 587

        msg = MIMEMultipart()
        msg["From"] = mail_user
        msg["To"] = to_email
        msg["Subject"] = header
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(mail_user, mail_password)  # Авторизация
            server.sendmail(mail_user, to_email, msg.as_string())  # Отправляем письмо


        print(f"Письмо отправлено на {to_email}")

    async def create_send_email(self,
                                email: str):
        # Отправляем письмо
        text_header = 'Код подтверждения'
        auth_code = randint(100000, 999999)
        text_body = f'Ваш код: {auth_code}'
        config = load_config()
        await self._send_email(config.mail.mail_user,
                               config.mail.mail_password,
                               email,
                               text_header,
                               text_body)

        # Добавляем в redis-хранилище email:code_send
        await self._redis.set(email, auth_code)

        return {"message": "Confirmation code sent",
                'status_code': status.HTTP_200_OK}

    async def register_user(self,
                       username: str,
                       email: str,
                       password: str):

        user = await get_user_by_username(self._postgres, username)
        if user is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='User already exists'
            )

        user = await get_user_by_email(self._postgres, email)
        if user is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='Email already exists'
            )

        await self._create_bcrypt_context()
        # Добавляем в таблицу users
        await add_user(self._postgres,
                       username,
                       slugify(username),
                       email,
                       self._bcrypt_context.hash(password))

        await self.create_send_email(email)

        return {
            'status_code': status.HTTP_201_CREATED,
            'detail': 'Not confirmed user created'
        }

    async def confirm_register(self,
                               entered_code: int,
                               email: str):

        correct_code = await self._redis.get(email)
        if correct_code is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail='Wrong email sent')
        if entered_code == int(correct_code):
            # Меняем статус is_confirmed
            await change_status_confirmed(self._postgres,
                                          email)
            # Удаляем из redis-хранилища данные
            await self._redis.delete(email)
        else:
            # Удалить пользователя, если неправильный код
            # await delete_user(self._postgres, email)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail='Incorrect code entered')

        return {
            'status_code': status.HTTP_200_OK,
            'detail': 'User confirmed successfully',
        }

    async def close_code_confirmation_box(self,
                                          email: str):
        await self._postgres.execute(
            delete(User)
            .where(User.email == email)
        )
        await self._postgres.commit()

        # Удаляем из redis-хранилища данные
        await self._redis.delete(email)

        return {
            'status_code': status.HTTP_200_OK,
            'detail': 'User deleted successfully'
        }
