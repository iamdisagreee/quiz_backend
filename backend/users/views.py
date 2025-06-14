from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.dependecies.postgres_depends import get_postgres
from backend.dependecies.user_depends import get_current_user
from backend.users.service import UserService

router = APIRouter(prefix='/users', tags=['users'])

@router.get("/me", summary="Профиль пользователя")
async def get_user_profile(user: Annotated[dict, Depends(get_current_user)]):
    return {"User": user}

@router.get("/me/stats", summary="Статистика пользователя")
async def get_user_stats(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                        user: Annotated[dict, Depends(get_current_user)]):
    return await UserService(postgres).get_personal(user.get('id'))

@router.get("/me/results", summary="Результаты пользователя")
async def get_user_results(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                          user: Annotated[dict, Depends(get_current_user)]):
    return await UserService(postgres).get_user_results(user.get('id'))
