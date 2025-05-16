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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    """ Получаем json с данными текущего пользователя из токена"""
    config = load_config()
    try:
        payload = jwt.decode(token, config.jwt_auth.secret_key, algorithms=[config.jwt_auth.algorithm])
        username = payload.get('username')
        expire = payload.get('expire')

        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Could not validate user'
            )

        elif expire is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No access token supplied"
            )

        elif expire < datetime.now(timezone.utc).timestamp():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Token expired'
            )

        return {
            'username': username
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired!"
        )