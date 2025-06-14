from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from starlette import status
from fastapi import HTTPException
from backend.database.models.users import User
from backend.database.models.games import Game
from backend.database.models.results import Result
from backend.database.models.quizzes import Quiz
from backend.database.models.questions import Question
from zoneinfo import ZoneInfo


class UserService:
    def __init__(self, postgres: AsyncSession = None):
        self._postgres = postgres

    async def get_personal(self, user_id: int):
        user = await self._postgres.scalar(
            select(User)
            .where(User.id == user_id)
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
            all_count += len(game.results)

        percentage = round(all_count_right / all_count * 100) if all_count != 0 else 0

        return {
            'username': user.username,
            'email': user.email,
            'countCreated': len(user.quizzes),
            'countCompleted': len(user.games),
            'percentage': percentage
        }

    async def get_user_results(self, user_id: int):
        """Получение всех результатов пользователя"""
        user = await self._postgres.scalar(
            select(User)
            .where(User.id == user_id)
            .options(
                selectinload(User.games)
                .selectinload(Game.quiz)
                .selectinload(Quiz.questions)
                .selectinload(Question.answers),
                selectinload(User.games)
                .selectinload(Game.results)
                .selectinload(Result.question)
                .selectinload(Question.answers),
                selectinload(User.games)
                .selectinload(Game.results)
                .selectinload(Result.replies)
            )
        )

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        results = []
        for game in user.games:
            # Подсчитываем результат
            total_questions = len(game.quiz.questions)
            correct_answers = self._quiz_scoring(game)
            percentage = round((correct_answers / total_questions) * 100) if total_questions > 0 else 0
            
            # Собираем детали по каждому вопросу
            details = []
            for result in game.results:
                question = result.question
                replies = result.replies
                
                if question.type == 'text':
                    # Для текстовых вопросов получаем правильный ответ из таблицы Answer
                    user_answer = replies[0].answer_text if replies else ""
                    is_correct = replies[0].is_correct if replies else False
                    
                    # Получаем правильный ответ из базы данных
                    correct_answer = ""
                    for answer in question.answers:
                        if answer.is_correct:
                            correct_answer = answer.text
                            break
                    
                    details.append({
                        "question": question.text,
                        "userAnswer": user_answer,
                        "correctAnswer": correct_answer,
                        "isCorrect": is_correct
                    })
                
                elif question.type in ['single_choice', 'multiple_choice']:
                    # Для вопросов с вариантами
                    user_answers = []
                    correct_answers_list = []
                    is_correct = True
                    
                    # Собираем ответы пользователя
                    for reply in replies:
                        if reply.answer_text:
                            user_answers.append(reply.answer_text)
                            if not reply.is_correct:
                                is_correct = False
                    
                    # Получаем правильные ответы из вопроса
                    for answer in question.answers:
                        if answer.is_correct:
                            correct_answers_list.append(answer.text)
                    
                    details.append({
                        "question": question.text,
                        "userAnswer": ", ".join(user_answers) if user_answers else "Не отвечено",
                        "correctAnswer": ", ".join(correct_answers_list),
                        "isCorrect": is_correct
                    })

            results.append({
                "id": game.id,
                "title": game.quiz.name,
                "date": game.finished_at.astimezone(ZoneInfo("Europe/Moscow")).strftime("%Y-%m-%d"),
                "score": int(correct_answers),  # Теперь это точно число
                "total": total_questions,
                "details": details
            })

        return {"results": results}

    @staticmethod
    def _quiz_scoring(game: Game):
        """ Подсчет набранных очков """
        count_sum = 0.0  # Явно делаем float
        
        for result in game.results:
            if not result.replies:  # Если нет ответов
                continue
                
            if result.question.type in ('text', 'single_choice'):
                # Для текстовых и одиночных вопросов
                count_sum += 1.0 if result.replies[0].is_correct else 0.0
            else:
                # Для multiple_choice
                if result.replies:
                    correct_replies = sum(1 for reply in result.replies if reply.is_correct)
                    total_replies = len(result.replies)
                    if total_replies > 0:
                        count_sum += correct_replies / total_replies
                        
        return float(count_sum)  # Возвращаем именно число
