from sqlalchemy import select, insert, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.models.email_confirmation import EmailConfirmation
from backend.database.models.user import User


async def get_user_by_username(session: AsyncSession,
                               username: str):
    return await session.scalar(
        select(User)
        .where(User.username == username)
    )

async def get_user_by_email(session: AsyncSession,
                               email: str):
    return await session.scalar(
        select(User)
        .where(User.email == email)
    )

async def add_user(session: AsyncSession,
                   username: str,
                   email: str,
                   password_hash: str):
    await session.execute(
        insert(User)
        .values(
            username=username,
            email=email,
            password_hash=password_hash
        )
    )

async def add_email_confirmation(session: AsyncSession,
                                 user_id: str,
                                 confirmation_code: int):
    await session.execute(
        insert(EmailConfirmation)
        .values(
            user_id=user_id,
            confirmation_code=confirmation_code
        )
    )

async def change_status_confirmed(session: AsyncSession,
                                  email: str):
    await session.execute(
        update(User)
        .where(User.email == email)
        .values(is_confirmed=True)
    )
    await session.commit()