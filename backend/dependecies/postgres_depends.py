from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.postgres_db import session_maker


async def get_postgres() -> AsyncGenerator[AsyncSession, None]:
    async with session_maker() as session:
        return session

