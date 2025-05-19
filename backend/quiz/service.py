from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert, select, update, delete
from starlette import status
from fastapi import HTTPException
from backend.database.models import Quiz, Question
from backend.database.models.answer import Answer
from backend.quiz.dto import CreateAnswer, CreateQuiz, CreateQuestion
from slugify import slugify


class QuizService:
    def __init__(self,
                 postgres: AsyncSession = None):
        self._postgres = postgres

    async def add_quiz(self,
                       user_id: int,
                       quiz: CreateQuiz):
        """" Добавляем квиз в бд """
        quiz_id = await self._postgres.scalar(
            insert(Quiz)
            .values(
                name=quiz.name,
                slug=slugify(quiz.name),
                user_id=user_id,
                timer_enabled=quiz.settings.timer_enabled,
                timer_value=quiz.settings.timer_value
            )
            .returning(Quiz.id)
        )

        for question in quiz.questions:
            await self._add_question(quiz_id,
                                     question)

        await self._postgres.commit()

        return {
            'status_code': status.HTTP_201_CREATED,
            'detail': 'Quiz created successfully'
        }

    async def _add_question(self,
                            quiz_id: int,
                            question: CreateQuestion
                            ):
        """ Добавляем вопрос в бд"""
        question_id = await self._postgres.scalar(
            insert(Question)
            .values(
                quiz_id=quiz_id,
                text=question.text,
                type=question.type
            )
            .returning(Question.id)
        )

        for answer in question.answers:
            await self._add_answer(question_id,
                                   answer)

    async def _add_answer(self,
                          question_id: int,
                          answer: CreateAnswer):
        """ Добавляем ответа в бд """
        await self._postgres.execute(
            insert(Answer)
            .values(
                question_id=question_id,
                text=answer.text,
                is_correct=answer.is_correct
            )
        )

    async def get_all_quizzes(self,
                              user_id: int):
        """ Получение всех квизов пользователя """
        print(user_id)
        all_quizzes = (
            await self._postgres.scalars(
                select(Quiz)
                .where(
                    Quiz.user_id == user_id,
                )
                .order_by(Quiz.created_at)
            )
        ).all()
        if not all_quizzes:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Not found quizzes'
            )

        return all_quizzes

    async def get_quiz_by_slug(self,
                               user_id: int,
                               quiz_slug: str,
                               ):
        """ Получение конкретного квиза пользователя """
        selected_quiz = await self._postgres.scalar(
            select(Quiz)
            .where(
                Quiz.user_id == user_id,
                Quiz.slug == quiz_slug
            )
        )
        if selected_quiz is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Not found quiz'
            )
        return selected_quiz

    async def get_quiz_by_code(self,
                               user_id: int,
                               connection_code: int,
                               ):
        """ Получение квиза по коду подключения """
        selected_quiz = await self._postgres.scalar(
            select(Quiz)
            .where(
                Quiz.user_id == user_id,
                Quiz.connection_code == connection_code
            )
        )
        if selected_quiz is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Not found quiz'
            )
        return selected_quiz

    async def update_quiz_by_slug(self,
                                  user_id: int,
                                  quiz_slug: str,
                                  quiz: CreateQuiz,
                                  ):
        """ Обновление квиза """

        # Обновляем Quiz
        quiz_id = await self._postgres.scalar(
            update(Quiz)
            .where(
                Quiz.user_id == user_id,
                Quiz.slug == quiz_slug
            )
            .values(
                name=quiz.name,
                slug=slugify(quiz.name),
                connection_code=quiz.connection_code,
                timer_enabled=quiz.timer_enabled,
                timer_value=quiz.timer_value,
                updated_at=datetime.now()
            )
            .returning(Quiz.id)
        )

        # Удаляем все вопросы и ответы
        await self._postgres.execute(
            delete(Question)
            .where(
                Question.quiz_id == quiz_id
            )
        )

        for question in quiz.questions:
            await self._add_question(quiz_id,
                                     question)

        await self._postgres.commit()

        return {
            'status_code': status.HTTP_200_OK,
            'detail': 'Quiz updated successfully'
        }



    async def delete_quiz(self,
                          user_id: int,
                          quiz_slug: str):

        await self._postgres.execute(
            delete(Quiz)
            .where(
                Quiz.user_id == user_id,
                Quiz.slug == quiz_slug
            )
        )
        await self._postgres.commit()

        return {
            'status_code': status.HTTP_200_OK,
            'detail': 'Quiz deleted successfully'
        }



