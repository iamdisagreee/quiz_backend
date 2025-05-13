from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.db import session_maker


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with session_maker() as session:
        return session

