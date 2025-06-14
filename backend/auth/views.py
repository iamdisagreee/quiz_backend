from typing import Annotated

from fastapi import APIRouter, Depends, Form, status
from fastapi.security import OAuth2PasswordRequestForm
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from taskiq_nats import NATSKeyValueScheduleSource

from backend.auth.service import AuthService
from backend.dependecies import (
    get_postgres,
    get_redis,
    get_scheduler_storage,
    get_current_user
)

router = APIRouter(prefix='/auth', tags=['auth'])

PostgresDep = Annotated[AsyncSession, Depends(get_postgres)]
RedisDep = Annotated[Redis, Depends(get_redis)]
SchedulerDep = Annotated[NATSKeyValueScheduleSource, Depends(get_scheduler_storage)]


@router.post(
    "/login",
    summary="Авторизация - Получение токена с полезной нагрузкой"
)
async def login(
    postgres: PostgresDep,
    form_data: OAuth2PasswordRequestForm = Depends()
):
    return await AuthService(postgres).login(
        form_data.username,
        form_data.password
    )


@router.get(
    "/me",
    summary="Информация об авторизованном пользователе"
)
async def get_current_user_info(
    user: dict = Depends(get_current_user)
):
    return {"User": user}


@router.post(
    "/register",
    summary="Регистрация нового пользователя",
    status_code=status.HTTP_201_CREATED
)
async def register(
    postgres: PostgresDep,
    redis: RedisDep,
    scheduler_storage: SchedulerDep,
    username: Annotated[str, Form()],
    email: Annotated[str, Form()],
    password: Annotated[str, Form()]
):
    return await AuthService(
        postgres,
        redis,
        scheduler_storage
    ).register_user(username, email, password)


@router.post(
    "/send-confirmation",
    summary="Отправка кода подтверждения"
)
async def send_confirmation_code(
    postgres: PostgresDep,
    redis: RedisDep,
    email: Annotated[str, Form()]
):
    return await AuthService(postgres, redis).create_send_email(email)


@router.post(
    "/confirm-email",
    summary="Подтверждение email адреса"
)
async def confirm_email(
    postgres: PostgresDep,
    redis: RedisDep,
    entered_code: Annotated[int, Form()],
    email: Annotated[str, Form()]
):
    return await AuthService(postgres, redis).confirm_register(
        entered_code,
        email
    )


@router.delete(
    "/cancel-registration",
    summary="Отмена регистрации"
)
async def cancel_registration(
    postgres: PostgresDep,
    redis: RedisDep,
    email: Annotated[str, Form()]
):
    return await AuthService(postgres, redis).close_code_confirmation_box(email)