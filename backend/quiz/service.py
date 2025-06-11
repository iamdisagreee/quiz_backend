from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert, select, update, delete
from sqlalchemy.orm import selectinload
from starlette import status
from fastapi import HTTPException
from backend.database.models import Quiz, Question, Game, Result, Reply, User
from backend.database.models.answer import Answer
from backend.quiz.dto import CreateAnswer, CreateQuiz, CreateQuestion, ResultQuiz
from slugify import slugify
from collections import Counter


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

    @staticmethod
    def _get_quiz_base_json(quiz: Quiz):
        """ Json с информацией о квизе """

        questions = [
            {
                'questionId': question.id,
                'text': question.text,
                'type': question.type,
                'answers': [
                    {
                        'answerId': answer.id,
                        'text': answer.text,
                    }
                    for answer in question.answers
                ]
            }
            for question in quiz.questions
        ]

        return {
            'quizId': quiz.id,
            'name': quiz.name,
            'questions': questions,
            'settings': {
                'timerEnabled': quiz.timer_enabled,
                'timerValue': quiz.timer_value
            }
        }

    async def get_all_created_quizzes(self,
                                      user_id: int):
        """ Получение всех квизов пользователя """
        all_quizzes = (
            await self._postgres.scalars(
                select(Quiz)
                .where(
                    Quiz.user_id == user_id,
                )
                .order_by(Quiz.created_at)
                .options(selectinload(Quiz.questions).selectinload(Question.answers))
            )
        )

        if not all_quizzes:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Not found quizzes'
            )

        return [self._get_quiz_base_json(quiz) for quiz in all_quizzes]

    async def get_created_quiz_by_id(self,
                                     user_id: int,
                                     quiz_id: int,
                                     ):
        """ Получение конкретного созданного квиза пользователем """

        quiz = await self._postgres.scalar(
            select(Quiz)
            .where(
                Quiz.user_id == user_id,
                Quiz.id == quiz_id
            )
            .options(selectinload(Quiz.games).selectinload(Game.results).selectinload(Result.replies))
            .options(selectinload(Quiz.games).selectinload(Game.user))
            .options(selectinload(Quiz.questions))
        )
        if quiz is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Not found quiz'
            )

        all_right_count = 0
        count_questions = len(quiz.questions)
        count_participants = len(set(game.user_id for game in quiz.games))
        participants = []
        for game in quiz.games:
            count_right = self._quiz_scoring(game)
            participants.append(
                {
                    'username': game.user.username,
                    'emil': game.user.email,
                    'finishedAt': game.finished_at,
                    'countRight': count_right,
                }
            )
            all_right_count += count_right

        percentage = round(all_right_count / (count_participants * count_questions) * 100) \
            if count_participants != 0 else 0

        return {
            'name': quiz.name,
            'createdAt': quiz.created_at,
            'countQuestions': count_questions,
            'connectionCode': quiz.connection_code,
            'countParticipants': count_participants,
            'percentage': percentage,
            'participants': participants
        }

    async def get_quiz_by_code(self,
                               user_id: int,
                               connection_code: int,
                               ):
        """ Получение квиза с вопросами и ответами по коду подключения """
        quiz = await self._postgres.scalar(
            select(Quiz)
            .where(
                Quiz.user_id == user_id,
                Quiz.connection_code == connection_code
            )
            .options(selectinload(Quiz.questions).selectinload(Question.answers))
        )
        if quiz is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Not found quiz'
            )

        if not quiz.is_opened and not quiz.is_closed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Quiz hasn't opened yet"
            )

        if quiz.is_closed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Quiz has already closed"
            )

        return self._get_quiz_base_json(quiz)

    async def update_quiz(self,
                          user_id: int,
                          quiz_id: int,
                          quiz: CreateQuiz,
                          ):
        """ Обновление квиза """

        # Обновляем Quiz
        quiz_id = await self._postgres.scalar(
            update(Quiz)
            .where(
                Quiz.user_id == user_id,
                Quiz.id == quiz_id
            )
            .values(
                name=quiz.name,
                slug=slugify(quiz.name),
                timer_enabled=quiz.settings.timer_enabled,
                timer_value=quiz.settings.timer_value,
                updated_at=datetime.now()
            )
            .returning(Quiz.id)
        )

        if not quiz_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Quiz not found'
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
                          quiz_id: int):

        result = await self._postgres.execute(
            delete(Quiz)
            .where(
                Quiz.user_id == user_id,
                Quiz.id == quiz_id
            )
        )
        await self._postgres.commit()

        if not result.rowcount:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Quiz not found'
            )

        return {
            'status_code': status.HTTP_200_OK,
            'detail': 'Quiz deleted successfully'
        }

    async def get_user_quiz_result(self, user_id: int, result_quiz: ResultQuiz):
        """ Обработка результатлв прохождения квиза пользователем """
        # Собираем все id вопросов
        question_ids = set(question.question_id for question in result_quiz.questions)

        # Достаем из бд правильные ответы на заданные вопросы
        find_answers = (
            await self._postgres.scalars(
                select(Answer)
                .where(
                    Answer.question_id.in_(question_ids),
                    Answer.is_correct == True
                )
                .options(selectinload(Answer.question))
            )
        ).all()

        if not find_answers:
            return {
                'status_code': status.HTTP_404_NOT_FOUND,
                'detail': 'Not found completed quizzes'
            }

        # Создаем словарь правильных ответов: {question_id: [str] | [int] | [int1, int2, ...]}
        right_answers = dict()
        for answer in find_answers:
            if answer.question.type == 'text':
                right_answers.setdefault(answer.question_id, []).append(answer.text)
            else:
                right_answers.setdefault(answer.question_id, []).append(answer.id)

        # Добавляем игрока в games
        game_id = await self._postgres.scalar(
            insert(Game)
            .values(
                quiz_id=result_quiz.quiz_id,
                user_id=user_id
            )
            .returning(Game.id)
        )

        results = []
        for question in result_quiz.questions:
            # Добавляем вопрос в results
            result_id = await self._postgres.scalar(
                insert(Result)
                .values(
                    game_id=game_id,
                    question_id=question.question_id
                )
                .returning(Result.id)
            )

            current_answer = right_answers.get(question.question_id)
            # Проверяем правильность ответа в зависимости от типа вопроса
            if question.type == 'text':
                # print(question.answers.lower(), current_answer[0])
                results.append(
                    Reply(
                        result_id=result_id,
                        answer_id=None,
                        answer_text=question.answers,
                        is_correct=question.answers.lower() == current_answer[0]
                    )
                )
            elif question.type == 'single_choice':
                results.append(
                    Reply(
                        result_id=result_id,
                        answer_id=question.answers,
                        answer_text=None,
                        is_correct=question.answers == current_answer[0]
                    )
                )
            else:
                for answer in question.answers:
                    results.append(
                        Reply(
                            result_id=result_id,
                            answer_id=answer,
                            answer_text=None,
                            is_correct=answer in current_answer
                        )
                    )

        self._postgres.add_all(results)
        await self._postgres.commit()

        return {
            'status_code': status.HTTP_201_CREATED,
            'detail': 'Result successfully loaded'
        }

    @staticmethod
    def _quiz_scoring(game: Game):
        """ Подсчет набранных очков """
        count_sum = 0
        for result in game.results:
            if result.question.type in ('text', 'single_choice'):
                count_sum += result.replies[0].is_correct
            else:
                count_sum += sum(cur.is_correct if cur.is_correct else -1 for cur in result.replies) / \
                             len(result.replies)
        return count_sum

    async def get_all_completed_quizzes(self, user_id: int):
        find_games = await self._postgres.scalars(
            select(Game)
            .where(Game.user_id == user_id)
            .options(selectinload(Game.quiz),
                     selectinload(Game.results).selectinload(Result.replies),
                     selectinload(Game.results).selectinload(Result.question))
        )

        result = {'games': []}
        for game in find_games:
            count_right = self._quiz_scoring(game)
            count_all = len(game.results)
            percentage = round((count_right / count_all) * 100)
            result['games'].append(
                {
                    'id': game.id,
                    'name': game.quiz.name,
                    'countRight': count_right,
                    'countAll': count_all,
                    'percentage': f"{percentage:.2f}",
                    'finishedAt': game.finished_at.astimezone(ZoneInfo("Europe/Moscow")).strftime("%d.%m.%y %H:%M")
                }
            )
        return result

    async def get_main_information_quizzes(self, user_id: int):

        created_quizzes = (
            await self._postgres.scalars(
                select(Quiz)
                .where(Quiz.user_id == user_id)
            )
        ).all()

        if not created_quizzes:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Not found created quizzes'
            )

        return {
            'quizzes':
                [
                    {
                        'id': quiz.id,
                        'name': quiz.name,
                        'createdAt': quiz.created_at.astimezone(ZoneInfo("Europe/Moscow")).strftime("%d.%m.%y %H:%M"),
                        'connectionCode': quiz.connection_code,
                        'isOpened': quiz.is_opened
                    }
                    for quiz in created_quizzes
                ]
        }

    async def opening_quiz(self, user_id: int, quiz_id: int):
        """ Открываем квиз для прохождения """
        result = await self._postgres.execute(
            update(Quiz)
            .where(Quiz.id == quiz_id,
                   Quiz.user_id == user_id)
            .values(is_opened=True,
                    is_closed=False)
        )
        await self._postgres.commit()

        if not result.rowcount:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Not found quiz'
            )

        return {
            'status_code': status.HTTP_200_OK,
            'detail': 'Quiz successfully opened'
        }

    async def closing_quiz(self, user_id: int, quiz_id: int):
        """ Закрываем квиз для ппохождения """
        result = await self._postgres.execute(
            update(Quiz)
            .where(Quiz.id == quiz_id,
                   Quiz.user_id == user_id)
            .values(is_opened=False,
                    is_closed=True)
        )
        await self._postgres.commit()

        if not result.rowcount:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Not found quiz'
            )

        return {
            'status_code': status.HTTP_200_OK,
            'detail': 'Quiz successfully closed'
        }

    async def get_personal(self, user_id: int):
        user = await self._postgres.scalar(
            select(User)
            .where(
                User.id == user_id
            )
            .options(selectinload(User.quizzes),
                     selectinload(User.games).selectinload(Game.results).selectinload(Result.replies),
                     selectinload(User.games).selectinload(Game.results).selectinload(Result.question))
        )

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not found user"
            )

        all_count_right, all_count = 0, 0
        for game in user.games:
            all_count_right += self._quiz_scoring(game)
            all_count +=  len(game.results)

        percentage = round(all_count_right / all_count * 100) if all_count != 0 else 0

        return {
            'username': user.username,
            'email': user.email,
            'countCreated': len(user.quizzes),
            'countCompleted': len(user.games),
            'percentage': percentage
        }