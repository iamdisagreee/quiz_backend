import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

# Импортируйте вашу метадату моделей
from backend.database.base import Base

config = context.config
fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Получаем URL из alembic.ini
DATABASE_URL = config.get_main_option("sqlalchemy.url")

# Создаём асинхронный движок
async_engine = create_async_engine(DATABASE_URL, poolclass=pool.NullPool)


def run_migrations_offline():
    """Run migrations in 'offline' mode (без подключения к БД)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection):
    """Запуск миграций с переданным соединением."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online():
    """Run migrations in 'online' mode (с подключением к БД)."""
    async with async_engine.connect() as connection:
        await connection.run_sync(do_run_migrations)


def run_migrations_online_sync():
    """Обертка для запуска async миграций из синхронного контекста."""
    asyncio.run(run_migrations_online())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online_sync()
