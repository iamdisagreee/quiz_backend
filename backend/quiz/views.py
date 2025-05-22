from typing import Annotated

from backend.auth.service import AuthService
from fastapi import APIRouter, Depends, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from redis.asyncio import Redis

from backend.dependecies.postgres_depends import get_postgres
from backend.dependecies.user_depends import get_current_user
from backend.quiz.dto import CreateQuiz
from backend.quiz.service import QuizService

router = APIRouter(prefix='/quiz', tags=['quiz'])

@router.post("/",
             status_code=status.HTTP_201_CREATED,
             summary="Добавление нового квиза")
async def add_quiz(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                   get_user: Annotated[dict, Depends(get_current_user)],
                   quiz: CreateQuiz):
    return await QuizService(postgres).add_quiz(get_user.get('id'), quiz)

@router.get("/",
            summary="Получение всех созданных квизов пользователя")
async def get_all_quizzes(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                   get_user: Annotated[dict, Depends(get_current_user)]):
    return await QuizService(postgres).get_all_quizzes(get_user.get('id'))


@router.get("/{quiz_slug}",
            summary="Получение информации о конкретном квизе пользователя")
async def get_quiz_by_slug(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                           get_user: Annotated[dict, Depends(get_current_user)],
                           quiz_slug: str):
    return await QuizService(postgres).get_quiz_by_slug(get_user.get('id'), quiz_slug)

@router.get("/by-code/{connection_code}",
            summary="Получение данных о квизе по коду подключения")
async def get_quiz_by_code(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                            get_user: Annotated[dict, Depends(get_current_user)],
                            connection_code: int):
    return await QuizService(postgres).get_quiz_by_code(get_user.get('id'), connection_code)

@router.put("/{quiz_slug}",
            summary="Обновление квиза пользователя")
async def update_quiz(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                           get_user: Annotated[dict, Depends(get_current_user)],
                           quiz_slug: str,
                           quiz: CreateQuiz):
    return await QuizService(postgres).update_quiz_by_slug(get_user.get('id'), quiz_slug, quiz)

@router.delete("/{quiz_slug}",
               summary="Удаление квиза пользователя")
async def delete_quiz(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                      get_user: Annotated[dict, Depends(get_current_user)],
                      quiz_slug: str):
    return await QuizService(postgres).delete_quiz(get_user.get('id'), quiz_slug)

@router.post("/",
             summary="Получение результатов квиза, который прошел участник")
async def get_user_quiz_result(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                               get_user: Annotated[dict, Depends(get_current_user)],
                               ):
    pass