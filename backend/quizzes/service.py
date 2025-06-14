from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert, select, update, delete
from sqlalchemy.orm import selectinload
from starlette import status
from fastapi import HTTPException

from backend.database.models import Quiz, Question, Game, Result, Reply, User
from backend.database.models.answers import Answer
from backend.quizzes.dto import CreateAnswer, CreateQuiz, CreateQuestion, ResultQuiz, SubmitQuizAnswers, \
    RunQuizTextAnswer, RunQuizSingleChoiceAnswer, RunQuizMultipleChoiceAnswer
from slugify import slugify


class QuizService:
    def __init__(self, postgres: AsyncSession = None):
        self._postgres = postgres

    async def add_quiz(self, user_id: int, quiz: CreateQuiz):
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
            await self._add_question(quiz_id, question)

        await self._postgres.commit()

        return {
            'status_code': status.HTTP_201_CREATED,
            'detail': 'Quiz created successfully'
        }

    async def _add_question(self, quiz_id: int, question: CreateQuestion):
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
            await self._add_answer(question_id, answer)

    async def _add_answer(self, question_id: int, answer: CreateAnswer):
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

    async def get_all_created_quizzes(self, user_id: int):
        """ Получение всех квизов пользователя """
        all_quizzes = (
            await self._postgres.scalars(
                select(Quiz)
                .where(Quiz.user_id == user_id)
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

    async def get_created_quiz_by_id(self, user_id: int, quiz_id: int):
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
                detail='Not found quizzes'
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
                    'email': game.user.email,
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

    async def update_quiz(self, user_id: int, quiz_id: int, quiz: CreateQuiz):
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
            .where(Question.quiz_id == quiz_id)
        )

        for question in quiz.questions:
            await self._add_question(quiz_id, question)

        await self._postgres.commit()

        return {
            'status_code': status.HTTP_200_OK,
            'detail': 'Quiz updated successfully'
        }

    async def delete_quiz(self, user_id: int, quiz_id: int):
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

    async def get_main_information_quizzes(self, user_id: int):
        """Получение основной информации о квизах пользователя"""
        created_quizzes = (
            await self._postgres.scalars(
                select(Quiz)
                .where(Quiz.user_id == user_id)
                .options(selectinload(Quiz.questions))
                .options(selectinload(Quiz.games))
                .order_by(Quiz.created_at.desc())
            )
        ).all()

        if not created_quizzes:
            return {
                'quizzes': []
            }

        quiz_list = []
        for quiz in created_quizzes:
            # Подсчитываем количество участников
            participant_count = len(set(game.user_id for game in quiz.games)) if quiz.games else 0
            
            quiz_list.append({
                'id': quiz.id,
                'name': quiz.name,
                'createdAt': quiz.created_at.astimezone(ZoneInfo("Europe/Moscow")).strftime("%d.%m.%y %H:%M"),
                'connectionCode': quiz.connection_code,
                'isOpened': quiz.is_opened,
                'isClosed': quiz.is_closed,
                'questionCount': len(quiz.questions),
                'participantCount': participant_count
            })

        return {
            'quizzes': quiz_list
        }

    async def opening_quiz(self, user_id: int, quiz_id: int):
        """ Открываем квиз для прохождения """
        result = await self._postgres.execute(
            update(Quiz)
            .where(Quiz.id == quiz_id, Quiz.user_id == user_id)
            .values(is_opened=True, is_closed=False)
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
        """ Закрываем квиз для прохождения """
        result = await self._postgres.execute(
            update(Quiz)
            .where(Quiz.id == quiz_id, Quiz.user_id == user_id)
            .values(is_opened=False, is_closed=True)
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

    async def get_all_created_quizzes_by_id(self, user_id: int, quiz_id: int):
        """ Получение детальной информации о квизе для редактирования """
        quiz = await self._postgres.scalar(
            select(Quiz)
            .where(
                Quiz.user_id == user_id,
                Quiz.id == quiz_id
            )
            .options(selectinload(Quiz.questions).selectinload(Question.answers))
        )

        if quiz is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Quiz not found'
            )

        return self._get_quiz_base_json(quiz)

    async def get_quiz_statistics(self, user_id: int, quiz_id: int):
        """Получение детальной статистики квиза для страницы статистики"""
        try:
            print(f"Запрос статистики квиза {quiz_id} для пользователя {user_id}")

            # Добавляем загрузку user relationship
            quiz = await self._postgres.scalar(
                select(Quiz)
                .where(
                    Quiz.user_id == user_id,
                    Quiz.id == quiz_id
                )
                .options(
                    selectinload(Quiz.user),  # Добавляем загрузку пользователя
                    selectinload(Quiz.games).selectinload(Game.results).selectinload(Result.replies),
                    selectinload(Quiz.games).selectinload(Game.user),
                    selectinload(Quiz.questions).selectinload(Question.answers)
                )
            )

            if quiz is None:
                print(f"Квиз {quiz_id} не найден для пользователя {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail='Quiz not found'
                )

            print(f"Найден квиз: {quiz.name}, игр: {len(quiz.games)}, вопросов: {len(quiz.questions)}")

            # Подсчитываем статистику
            count_questions = len(quiz.questions)
            unique_participants = {}

            # Группируем игры по пользователям (берем последнюю попытку каждого)
            for game in quiz.games:
                user_id_key = game.user_id
                if user_id_key not in unique_participants or game.finished_at > unique_participants[user_id_key][
                    'finished_at']:
                    count_right = self._quiz_scoring(game)
                    unique_participants[user_id_key] = {
                        'id': str(game.user.id),
                        'name': game.user.username,
                        'email': game.user.email,
                        'completionDate': game.finished_at.strftime('%Y-%m-%d'),
                        'timeSpent': 0,
                        'score': int(count_right),
                        'total': count_questions,
                        'finished_at': game.finished_at,
                        'details': self._get_game_details(game, quiz.questions)
                    }

            participants_list = list(unique_participants.values())
            total_participants = len(participants_list)

            # Подсчитываем средний результат
            if total_participants > 0:
                total_score = sum(p['score'] for p in participants_list)
                average_score = round((total_score / (total_participants * count_questions)) * 100, 1)
                average_time = 0
            else:
                average_score = 0
                average_time = 0

            print(f"Статистика: участников {total_participants}, средний результат {average_score}%")

            return {
                'id': str(quiz.id),
                'code': str(quiz.connection_code),
                'title': quiz.name,
                'createdAt': quiz.created_at.strftime('%Y-%m-%d'),
                'author': {
                    'id': str(quiz.user_id),
                    'name': quiz.user.username if quiz.user else 'Admin'  # Теперь user загружен
                },
                'settings': {
                    'timerEnabled': bool(quiz.timer_enabled),
                    'timerValue': quiz.timer_value
                },
                'stats': {
                    'participantsCount': total_participants,
                    'averageTime': average_time,
                    'averageScore': average_score,
                    'questionsCount': count_questions
                },
                'participants': participants_list
            }

        except HTTPException:
            raise
        except Exception as e:
            print(f"Ошибка при получении статистики квиза {quiz_id}: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f'Internal server error: {str(e)}'
            )

    def _get_game_details(self, game: Game, questions):
        """Получение детальных ответов игрока"""
        details = []

        for result in game.results:
            question = next((q for q in questions if q.id == result.question_id), None)
            if not question:
                continue

            # Получаем ответы пользователя
            user_answers = []
            correct_answers = []

            for reply in result.replies:
                if reply.answer_text:
                    user_answers.append(reply.answer_text)

            # Получаем правильные ответы
            for answer in question.answers:
                if answer.is_correct:
                    correct_answers.append(answer.text)

            details.append({
                'question': question.text,
                'userAnswer': ', '.join(user_answers) if user_answers else 'Не отвечено',
                'correctAnswer': ', '.join(correct_answers),
                'isCorrect': len(result.replies) > 0 and result.replies[0].is_correct if result.replies else False
            })

        return details


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

    async def get_quiz_by_connection_code(self, connection_code: int):
        """Получение квиза по коду доступа"""
        quiz = await self._postgres.scalar(
            select(Quiz)
            .where(
                Quiz.connection_code == connection_code,
                Quiz.is_opened == True  # Только открытые квизы
            )
            .options(
                selectinload(Quiz.questions).selectinload(Question.answers),
                selectinload(Quiz.user)
            )
        )

        if quiz is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Quiz not found or not available'
            )

        # Формируем ответ в формате, ожидаемом фронтендом
        questions = []
        for question in quiz.questions:
            question_data = {
                'id': question.id,
                'text': question.text,
                'type': question.type,
            }
            
            if question.type in ['single_choice', 'multiple_choice']:
                question_data['options'] = [answer.text for answer in question.answers]
            
            questions.append(question_data)

        return {
            'id': quiz.id,
            'title': quiz.name,
            'description': f'Квиз от пользователя {quiz.user.username}',
            'code': str(connection_code),
            'questions': questions,
            'settings': {
                'timerEnabled': quiz.timer_enabled,
                'timerValue': quiz.timer_value
            }
        }

    async def submit_quiz_results(self, user_id: int, quiz_id: int, answers_data: SubmitQuizAnswers):
        """Сохранение результатов прохождения квиза"""
        
        # Проверяем существование квиза
        quiz = await self._postgres.scalar(
            select(Quiz)
            .where(Quiz.id == quiz_id)
            .options(selectinload(Quiz.questions).selectinload(Question.answers))
        )

        if quiz is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Quiz not found'
            )

        # Создаем запись игры
        game_id = await self._postgres.scalar(
            insert(Game)
            .values(
                quiz_id=quiz_id,
                user_id=user_id,
                finished_at=datetime.now()
            )
            .returning(Game.id)
        )

        # Обрабатываем каждый ответ
        for answer_data in answers_data.answers:
            question = next((q for q in quiz.questions if q.id == answer_data.question_id), None)
            if not question:
                continue

            # Создаем запись результата
            result_id = await self._postgres.scalar(
                insert(Result)
                .values(
                    game_id=game_id,
                    question_id=question.id
                )
                .returning(Result.id)
            )

            # Обрабатываем ответ в зависимости от типа
            if isinstance(answer_data, RunQuizTextAnswer):
                # Для текстовых вопросов
                correct_answer = next((a for a in question.answers if a.is_correct), None)
                is_correct = False
                if correct_answer and answer_data.answer_text:
                    is_correct = answer_data.answer_text.strip().lower() == correct_answer.text.strip().lower()

                await self._postgres.execute(
                    insert(Reply)
                    .values(
                        result_id=result_id,
                        answer_text=answer_data.answer_text,
                        is_correct=is_correct
                    )
                )

            elif isinstance(answer_data, RunQuizSingleChoiceAnswer):
                # Для одиночного выбора
                answer_index = answer_data.answer_id
                if 0 <= answer_index < len(question.answers):
                    selected_answer = question.answers[answer_index]
                    is_correct = selected_answer.is_correct

                    await self._postgres.execute(
                        insert(Reply)
                        .values(
                            result_id=result_id,
                            answer_id=selected_answer.id,
                            answer_text=selected_answer.text,
                            is_correct=is_correct
                        )
                    )

            elif isinstance(answer_data, RunQuizMultipleChoiceAnswer):
                # Для множественного выбора
                for answer_index in answer_data.answer_ids:
                    if 0 <= answer_index < len(question.answers):
                        selected_answer = question.answers[answer_index]
                        is_correct = selected_answer.is_correct
                        
                        await self._postgres.execute(
                            insert(Reply)
                            .values(
                                result_id=result_id,
                                answer_id=selected_answer.id,
                                answer_text=selected_answer.text,
                                is_correct=is_correct
                            )
                        )

        await self._postgres.commit()

        return {
            'status_code': status.HTTP_201_CREATED,
            'detail': 'Quiz results submitted successfully',
            'game_id': game_id
        }
