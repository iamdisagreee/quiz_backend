import jwt

from datetime import datetime, timedelta, timezone
from http.client import HTTPException
from random import randint
from typing import Annotated
from urllib.parse import uses_relative
from zoneinfo import ZoneInfo

from backend.config import load_config
from fastapi import APIRouter, Depends,HTTPException, Request, Form
from fastapi.responses import RedirectResponse, HTMLResponse
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from redis.asyncio import Redis
from taskiq import ScheduledTask


from backend.database.auth_requests import get_user_by_username, add_user, get_user_by_email, add_email_confirmation, \
    change_status_confirmed
from backend.dependecies.postgres_depends import get_postgres
from backend.dependecies.redis_depends import get_redis
from backend.services.broker import scheduler_storage
from backend.services.mail import send_email

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

async def authenticate_user(postgres_session: Annotated[AsyncSession, Depends(get_postgres)],
                            username: str,
                            password: str):
    """ Проверяем регистрацию и пароль"""
    user = await get_user_by_username(postgres_session,
                                      username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='User is not registered',
            headers={'WWW-Authenticate': "Bearer"}
        )
    elif not bcrypt_context.verify(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid authentication credentials',
            headers={'WWW-Authenticate': "Bearer"}
        )
    return user

async def create_access_token(username: str,
                              expires_delta: timedelta):
    """ Создаем токен с полезной нагрузкой """
    payload = {
        'username': username,
        'expire': datetime.now(timezone.utc) + expires_delta
    }

    payload['expire'] = int(payload['expire'].timestamp())
    config = load_config()
    return jwt.encode(payload, config.jwt_auth.secret_key, algorithm=config.jwt_auth.algorithm)
