from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from fastapi import Depends
from fastapi_users.db import SQLAlchemyUserDatabase
from .models import Base, User
from .config import settings

# Convert URL if needed
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)

# Create async engine with disabled prepared statements
engine = create_async_engine(
    db_url,
    poolclass=None,  # Disable SQLAlchemy pooling to use asyncpg's pool
    connect_args={
        "statement_cache_size": 0,  # Disable statement cache
        "prepared_statement_cache_size": 0,  # Disable prepared statement cache
        "command_timeout": 60,  # Add timeout for commands
        "server_settings": {
            "statement_timeout": "60000",  # 60 seconds in milliseconds
            "client_encoding": "utf8",
        },
    },
)

async_session_maker = async_sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)


async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
