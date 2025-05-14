from datetime import datetime, timedelta
from http.client import HTTPException
from random import randint
from typing import Annotated
from zoneinfo import ZoneInfo

from backend.config import load_config
from fastapi import APIRouter, Depends,HTTPException, Request, Form
from fastapi.responses import RedirectResponse, HTMLResponse
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from redis.asyncio import Redis
from taskiq import ScheduledTask


from backend.database.auth_requests import get_user_by_username, add_user, get_user_by_email, add_email_confirmation, \
    change_status_confirmed
from backend.dependecies.postgres_depends import get_postgres
from backend.dependecies.redis_depends import get_redis
from backend.schemas import CreateUser, AuthCode
from backend.services.broker import scheduler_storage
from backend.services.mail import send_email

router = APIRouter(prefix='/auth', tags=['auth'])
bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

@router.get("/register_form",
            response_class=HTMLResponse,
            summary="Форма для регистрации пользователя",
            )
async def create_register_form():
    return f"""
    <html>
        <body>
            <h3>Введите данные для регистрации</h3>
            <form action="/v1/auth/register" method="post">
                <input type="text" name="username" placeholder="Введите никнейм" required/>
                <input type="text" name="email" placeholder="Введите email" required/>
                <input type="text" name="password" placeholder="Введите пароль" required/>
                <button type="submit">Подтвердить</button>
            </form>
        </body>
    </html>
    """


@router.post("/register",
             summary="Регистрация нового пользователя",
             status_code=status.HTTP_201_CREATED)
async def create_user(postgres_session: Annotated[AsyncSession, Depends(get_postgres)],
                      redis_session: Annotated[Redis, Depends(get_redis)],
                      username: Annotated[str, Form(...)],
                      email: Annotated[str, Form(...)],
                      password: Annotated[str, Form(...)]):
    user = await get_user_by_username(postgres_session, username)
    if user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='User already exists'
        )

    user = await get_user_by_email(postgres_session, email)
    if user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='Email already exists'
        )

    # Добавляем в таблицу users
    await add_user(postgres_session,
                   username,
                   email,
                   bcrypt_context.hash(password))

    # Отправляем письмо
    text_header = 'Код подтверждения'
    auth_code = randint(100000, 999999)
    text_body = f'Ваш код: {auth_code}'
    config = load_config()
    await send_email(config.mail.mail_user,
                     config.mail.mail_password,
                     email,
                     text_header,
                     text_body)
    await postgres_session.commit()

    # Добавляем в redis-хранилище email:code_send
    await redis_session.set(email, auth_code)

    # Создаем задачу на удаление кода через минуту из redis-хранилища
    await scheduler_storage.startup()
    await scheduler_storage.add_schedule(
        ScheduledTask(
            task_name='schedule_remove_auth_code',
            labels={},
            args=[],
            kwargs={"email": email},
            schedule_id=f'auth_{username}',
            time=datetime.now(ZoneInfo('Europe/Moscow')) + timedelta(minutes=5)
        )
    )
    return RedirectResponse(url=f"/v1/auth/confirm_code?email={email}",
                            status_code=status.HTTP_302_FOUND)

@router.get("/confirm_code",
            response_class=HTMLResponse,
            summary="Форма ввода одноразового кода")
async def confirm_register_form(email: str):
    return f"""
    <html>
        <body>
            <h3>Введите код подтверждения, отправленный на {email}</h3>
            <form action="/v1/auth/confirm_register" method="post">
                <input type="hidden" name="email" value="{email}" />
                <input type="number" name="entered_code" placeholder="Введите код" required/>
                <button type="submit">Подтвердить</button>
            </form>
        </body>
    </html>
    """


@router.post("/confirm_register",
            summary="Подтверждение одноразового кода")
async def confirm_add_user(postgres_session: Annotated[AsyncSession, Depends(get_postgres)],
                           redis_session: Annotated[Redis, Depends(get_redis)],
                           entered_code: Annotated[int, Form(...)],
                           email: Annotated[str, Form(...)]):
    # Корректный код из redis
    correct_code = await redis_session.get(email)

    if entered_code == int(correct_code):
        # Меняем статус confirmed
        await change_status_confirmed(postgres_session,
                                             email)
        # Удаляем из redis-хранилища данные 
        await redis_session.delete(email)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail='Incorrect code entered')

    return {
        'status_code': status.HTTP_200_OK,
        'detail': 'Registration completed successfully',
    }


