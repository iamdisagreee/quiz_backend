from sqlalchemy import select, insert, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.models.email_confirmation import EmailConfirmation
from backend.database.models.user import User


async def get_user_by_username(session: AsyncSession,
                               username: str):
    return await session.scalar(
        select(User)
        .where(User.username == username,
               User.is_confirmed == True)
    )

async def get_user_by_email(session: AsyncSession,
                               email: str):
    return await session.scalar(
        select(User)
        .where(User.email == email)
    )

async def add_user(session: AsyncSession,
                   username: str,
                   slug: str,
                   email: str,
                   password_hash: str):
    await session.execute(
        insert(User)
        .values(
            username=username,
            slug=slug,
            email=email,
            password_hash=password_hash
        )
    )
    await session.commit()

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
    await session.commit()

async def change_status_confirmed(session: AsyncSession,
                                  email: str):
    await session.execute(
        update(User)
        .where(User.email == email)
        .values(is_confirmed=True)
    )
    await session.commit()

async def delete_user(session: AsyncSession,
                      email: str):
    await session.execute(
        delete(User)
        .where(User.email == email)
    )

    await session.commit()