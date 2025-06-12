from typing import Annotated

from backend.auth.service import AuthService
from fastapi import APIRouter, Depends, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from redis.asyncio import Redis

from backend.dependecies.postgres_depends import get_postgres
from backend.dependecies.redis_depends import get_redis
from backend.dependecies.taskiq_depends import get_scheduler_storage
from backend.dependecies.user_depends import get_current_user
from taskiq_nats import NATSKeyValueScheduleSource


router = APIRouter(prefix='/auth', tags=['auth'])

@router.post("/login",
             summary="Авторизация - Получение токена с полезной нагрузкой")
async def login(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    return await AuthService(postgres).login(form_data.username,
                                       form_data.password)

@router.get("/read-current-user",
            summary='Информация об авторизованном пользователе')
async def read_current_user(user: dict = Depends(get_current_user)):
    return {'User': user}


@router.post("/register",
             summary="Регистрация нового пользователя",
             status_code=status.HTTP_201_CREATED)
async def create_user(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                      redis: Annotated[Redis, Depends(get_redis)],
                      scheduler_storage: Annotated[NATSKeyValueScheduleSource, Depends(get_scheduler_storage)],
                      username: Annotated[str, Form(...)],
                      email: Annotated[str, Form(...)],
                      password: Annotated[str, Form(...)]):

    return await AuthService(postgres, redis, scheduler_storage).register_user(username, email, password)

@router.post("/sending-code",
             summary="Отправка кода подтверждения")
async def sending_code(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                      redis: Annotated[Redis, Depends(get_redis)],
                      email: str):
    return await AuthService(postgres, redis).create_send_email(email)

@router.patch("/confirm-register",
            summary="Подтверждение отправленного кода")
async def confirm_add_user(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                           redis: Annotated[Redis, Depends(get_redis)],
                           entered_code: Annotated[int, Form(...)],
                           email: Annotated[str, Form(...)]):
    return await AuthService(postgres, redis).confirm_register(entered_code, email)

@router.delete("/close-code-confirm-box",
               summary="Закрытие окна с подтверждением кода")
async def close_code_confirmation_box(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                                    redis: Annotated[Redis, Depends(get_redis)],
                                    email: str):
    return await AuthService(postgres, redis).close_code_confirmation_box(email)



