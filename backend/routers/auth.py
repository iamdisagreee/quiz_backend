from datetime import datetime, timedelta
from http.client import HTTPException
from random import randint
from typing import Annotated
from zoneinfo import ZoneInfo

from backend.config import load_config
from fastapi import APIRouter, Depends,HTTPException, Request
from fastapi.responses import RedirectResponse
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

@router.post("/register",
             status_code=status.HTTP_200_OK,
             summary="Регистрация нового пользователя")
async def create_user(postgres_session: Annotated[AsyncSession, Depends(get_postgres)],
                      redis_session: Annotated[Redis, Depends(get_redis)],
                      create_user: CreateUser,
                      request: Request):
    user = await get_user_by_username(postgres_session, create_user.username)
    if user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='User already exists'
        )

    user = await get_user_by_email(postgres_session, create_user.email)
    if user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='Email already exists'
        )

    # Добавляем в таблицу users
    await add_user(postgres_session,
                   create_user.username,
                   create_user.email,
                   bcrypt_context.hash(create_user.password))

    # Отправляем письмо
    text_header = 'Код подтверждения'
    auth_code = randint(100000, 999999)
    text_body = f'Ваш код: <b>{auth_code}</b>'
    config = load_config()
    await send_email(config.mail.mail_user,
                     config.mail.mail_password,
                     config.mail.to_email,
                     text_header,
                     text_body)
    await postgres_session.commit()

    # Добавляем в redis-хранилище email:code_send
    await redis_session.set(create_user.email, auth_code)

    # Создаем задачу на удаление кода через минуту из redis-хранилища
    await scheduler_storage.add_schedule(
        ScheduledTask(
            task_name='schedule_remove_auth_code',
            labels={},
            args=[],
            kwargs={"email": create_user.email},
            schedule_id=f'auth_{create_user.username}',
            time=datetime.now(ZoneInfo('Europe/Moscow')) + timedelta(minutes=1)
        )
    )

    request.session['email'] = create_user.email

    return RedirectResponse("/confirm_register")

@router.post("/confirm_register",
             status_code=status.HTTP_201_CREATED,
             summary="Подтверждение одноразового кода")
async def confirm_add_user(postgres_session: Annotated[AsyncSession, Depends(get_postgres)],
                           redis_session: Annotated[Redis, Depends(get_redis)],
                           auth_code: AuthCode,
                           request: Request):

    email = request.session.get('email')
    correct_code = redis_session.get(email)
    entered_code = auth_code.code

    if entered_code == correct_code:
        await change_status_confirmed(postgres_session,
                                             email)
        await redis_session.delete(email)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail='Incorrect code entered')

    return {
        'status_code': status.HTTP_201_CREATED,
        'detail': 'Registration completed successfully',
    }

# @router.on_event("shutdown")
# async def shutdown_redis():
#     await redis_client.close()

