from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from starlette import status
from fastapi import HTTPException
from backend.database.models.users import User
from backend.database.models.games import Game
from backend.database.models.results import Result


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
