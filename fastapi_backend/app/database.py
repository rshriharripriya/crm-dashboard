from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from fastapi import Depends
from fastapi_users.db import SQLAlchemyUserDatabase
from .models import Base, User
from .config import settings
import ssl

# Convert URL if needed
db_url = settings.DATABASE_URL

# For Supabase/hosted PostgreSQL with SSL, we need to handle SSL properly
# Remove sslmode from URL and handle SSL in connect_args
if "sslmode=require" in db_url:
    db_url = db_url.replace("?sslmode=require", "").replace("&sslmode=require", "")

# Create SSL context for asyncpg
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False  # For hosted services like Supabase
ssl_context.verify_mode = ssl.CERT_NONE  # For development; use CERT_REQUIRED for production

# Create async engine with proper SSL handling
engine = create_async_engine(
    db_url,
    poolclass=None,  # Disable SQLAlchemy pooling to use asyncpg's pool
    connect_args={
        "ssl": ssl_context,  # Use SSL context instead of sslmode
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