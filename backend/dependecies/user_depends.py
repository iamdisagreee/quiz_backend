import jwt

from datetime import datetime, timezone
from http.client import HTTPException
from typing import Annotated

from backend.config import load_config
from fastapi import Depends,HTTPException
from fastapi.security import OAuth2PasswordBearer
from starlette import status

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    """ Получаем json с данными текущего пользователя из токена"""
    config = load_config()
    try:
        payload = jwt.decode(token, config.jwt_auth.secret_key, algorithms=[config.jwt_auth.algorithm])
        username = payload.get('username')
        user_id = payload.get('id')
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
            'username': username,
            'id': user_id
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired!"
        )