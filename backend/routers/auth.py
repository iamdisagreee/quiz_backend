from http.client import HTTPException
from random import randint
from typing import Annotated

from fastapi import APIRouter, Depends,HTTPException
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from backend.database.auth_requests import get_user_by_username, add_user, get_user_by_email, add_email_confirmation
from backend.database.redis_db import redis_client
from backend.dependecies.postgres_depends import get_postgres
from backend.main import config
from backend.schemas import CreateUser
from backend.services.mail import send_email

router_v1 = APIRouter(prefix='/auth', tags=['auth'])
bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

@router_v1.post("/register",
                status_code=status.HTTP_201_CREATED,
                summary="Регистрация нового пользователя")
async def create_user(session: Annotated[AsyncSession, Depends(get_postgres)],
                      create_user: CreateUser):
    user = await get_user_by_username(session, create_user.username)
    if user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='User already exists'
        )

    user = await get_user_by_email(session, create_user.email)
    if user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='Email already exists'
        )

    # Добавляем в таблицу users
    await add_user(session,
                   create_user.username,
                   create_user.email,
                   bcrypt_context.hash(create_user.password))

    # Отправляем письмо
    text_header = 'Код подтверждения'
    code_send = randint(100000, 999999)
    text_body = f'Ваш код: <b>{code_send}</b>'
    await send_email(config.mail.mail_user,
                     config.mail.mail_password,
                     config.mail.to_email,
                     text_header,
                     text_body)

    # Добавляем в таблицу email_confirmations
    await add_email_confirmation(session,
                                 create_user.username,
                                 code_send)

    await session.commit()

    return {
        'status_code': status.HTTP_201_CREATED,
        "message": 'Confirmation code sent'
    }

@router_v1.on_event("shutdown")
async def shutdown_redis():
    await redis_client.close()

