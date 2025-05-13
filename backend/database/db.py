from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from backend.config import load_config

config = load_config()
engine = create_async_engine(config.site.postgres, echo=True)
session_maker = async_sessionmaker(engine)

