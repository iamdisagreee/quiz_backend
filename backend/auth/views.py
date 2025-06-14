from typing import Annotated

from fastapi import APIRouter, Depends, Form, status
from fastapi.security import OAuth2PasswordRequestForm
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from backend.auth.service import AuthService
from backend.dependencies.postgres_depends import get_postgres
from backend.dependencies.redis_depends import get_redis
from backend.dependencies.user_depends import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


@router.post(
    "/login",
    summary="Авторизация - Получение токена с полезной нагрузкой"
)
async def login(
    postgres: Annotated[AsyncSession, Depends(get_postgres)],
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
):
    return await AuthService(postgres).login(
        username=form_data.username,
        password=form_data.password
    )


@router.get(
    "/me",
    summary="Информация об авторизованном пользователе"
)
async def get_current_user_info(
    user: dict = Depends(get_current_user)
):
    return {"user": user}


@router.post(
    "/register",
    summary="Регистрация нового пользователя",
    status_code=status.HTTP_201_CREATED
)
async def register(
    postgres: Annotated[AsyncSession, Depends(get_postgres)],
    redis: Annotated[Redis, Depends(get_redis)],
    username: Annotated[str, Form(...)],
    email: Annotated[str, Form(...)],
    password: Annotated[str, Form(...)]
):
    return await AuthService(postgres, redis).register_user(
        username=username,
        email=email,
        password=password
    )


@router.post(
    "/send-confirmation",
    summary="Отправка кода подтверждения"
)
async def send_confirmation_code(
    postgres: Annotated[AsyncSession, Depends(get_postgres)],
    redis: Annotated[Redis, Depends(get_redis)],
    email: str
):
    return await AuthService(postgres, redis).create_send_email(
        email=email
    )


@router.post(
    "/confirm-email",
    summary="Подтверждение email адреса"
)
async def confirm_email(
    postgres: Annotated[AsyncSession, Depends(get_postgres)],
    redis: Annotated[Redis, Depends(get_redis)],
    entered_code: Annotated[int, Form(...)],
    email: Annotated[str, Form(...)]
):
    return await AuthService(postgres, redis).confirm_register(
        entered_code=entered_code,
        email=email
    )


@router.delete(
    "/cancel-registration",
    summary="Отмена регистрации"
)
async def cancel_registration(
    postgres: Annotated[AsyncSession, Depends(get_postgres)],
    redis: Annotated[Redis, Depends(get_redis)],
    email: str
):
    return await AuthService(postgres, redis).close_code_confirmation_box(
        email=email
    )