from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from backend.dependecies.postgres_depends import get_postgres
from backend.dependecies.user_depends import get_current_user
from backend.quizzes.service import QuizService
from backend.quizzes.dto import CreateQuiz, SubmitQuizAnswers

router = APIRouter(prefix='/quizzes', tags=['quizzes'])

@router.get("/", summary="Получение всех квизов пользователя")
async def get_quizzes(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                     user: Annotated[dict, Depends(get_current_user)]):
    return await QuizService(postgres).get_main_information_quizzes(user.get('id'))

@router.post("/", summary="Создание нового квиза", status_code=status.HTTP_201_CREATED)
async def create_quiz(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                     user: Annotated[dict, Depends(get_current_user)],
                     quiz: CreateQuiz):
    return await QuizService(postgres).add_quiz(user.get('id'), quiz)

@router.get("/by-code/{connection_code}", summary="Получение квиза по коду доступа")
async def get_quiz_by_code(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                          user: Annotated[dict, Depends(get_current_user)],
                          connection_code: int):
    return await QuizService(postgres).get_quiz_by_connection_code(connection_code)

@router.post("/{quiz_id}/submit", summary="Отправка результатов квиза")
async def submit_quiz_answers(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                             user: Annotated[dict, Depends(get_current_user)],
                             quiz_id: int,
                             answers: SubmitQuizAnswers):
    return await QuizService(postgres).submit_quiz_results(user.get('id'), quiz_id, answers)

@router.get("/{quiz_id}", summary="Получение конкретного квиза")
async def get_quiz(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                  user: Annotated[dict, Depends(get_current_user)],
                  quiz_id: int):
    return await QuizService(postgres).get_created_quiz_by_id(user.get('id'), quiz_id)

@router.put("/{quiz_id}", summary="Обновление квиза")
async def update_quiz(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                     user: Annotated[dict, Depends(get_current_user)],
                     quiz_id: int,
                     quiz: CreateQuiz):
    return await QuizService(postgres).update_quiz(user.get('id'), quiz_id, quiz)

@router.delete("/{quiz_id}", summary="Удаление квиза")
async def delete_quiz(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                     user: Annotated[dict, Depends(get_current_user)],
                     quiz_id: int):
    return await QuizService(postgres).delete_quiz(user.get('id'), quiz_id)

@router.patch("/{quiz_id}/status", summary="Изменение статуса квиза")
async def update_quiz_status(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                           user: Annotated[dict, Depends(get_current_user)],
                           quiz_id: int,
                           action: Annotated[str, Query(description="Action: 'open' or 'close'")]):
    if action == "open":
        return await QuizService(postgres).opening_quiz(user.get('id'), quiz_id)
    elif action == "close":
        return await QuizService(postgres).closing_quiz(user.get('id'), quiz_id)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid action. Use 'open' or 'close'"
        )

@router.get("/{quiz_id}/results", summary="Результаты квиза")
async def get_quiz_results(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                          user: Annotated[dict, Depends(get_current_user)],
                          quiz_id: int):
    quiz_data = await QuizService(postgres).get_created_quiz_by_id(user.get('id'), quiz_id)
    return {"results": quiz_data.get("participants", [])}

@router.get("/{quiz_id}/participants", summary="Участники квиза")
async def get_quiz_participants(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                               user: Annotated[dict, Depends(get_current_user)],
                               quiz_id: int):
    quiz_data = await QuizService(postgres).get_created_quiz_by_id(user.get('id'), quiz_id)
    return {"participants": quiz_data.get("participants", [])}

@router.get("/{quiz_id}/details", summary="Подробная информация о квизе для редактирования")
async def get_quiz_details(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                          user: Annotated[dict, Depends(get_current_user)],
                          quiz_id: int):
    """Получение подробной информации о квизе для страницы редактирования"""
    return await QuizService(postgres).get_all_created_quizzes_by_id(user.get('id'), quiz_id)

@router.get("/{quiz_id}/statistics", summary="Детальная статистика квиза")
async def get_quiz_statistics(postgres: Annotated[AsyncSession, Depends(get_postgres)],
                             user: Annotated[dict, Depends(get_current_user)],
                             quiz_id: int):
    """Получение детальной статистики квиза для страницы статистики"""
    return await QuizService(postgres).get_quiz_statistics(user.get('id'), quiz_id)
