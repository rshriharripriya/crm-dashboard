# database.py
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from fastapi import Depends
from fastapi_users.db import SQLAlchemyUserDatabase
from .models import Base, User
from .config import settings
import ssl
import asyncio

# Convert URL if needed
db_url = settings.DATABASE_URL

# For Supabase/hosted PostgreSQL with SSL, we need to handle SSL properly
if "sslmode=require" in db_url:
    db_url = db_url.replace("?sslmode=require", "").replace("&sslmode=require", "")

# Create SSL context for asyncpg
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# VERCEL FIX: Smaller pool sizes for serverless environment
engine = create_async_engine(
    db_url,
    echo=False,  # Disable SQL logging in production
    connect_args={
        "ssl": ssl_context,
        "command_timeout": 30,  # Reduced timeout for serverless
        "server_settings": {
            "application_name": "fastapi_app",
        },
    },
    # CRITICAL: Smaller pool settings for Vercel/serverless
    pool_size=5,            # Reduced from 20
    max_overflow=5,         # Reduced from 10
    pool_timeout=10,        # Reduced timeout
    pool_recycle=300,       # 5 minutes instead of 30
    pool_pre_ping=True,
    # IMPORTANT: Add pool reset on return
    pool_reset_on_return="commit",
)

async_session_maker = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
    autoflush=False
)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    session = None
    try:
        session = async_session_maker()
        yield session
    except Exception as e:
        if session:
            await session.rollback()
        raise
    finally:
        if session:
            try:
                await session.close()
            except Exception:
                # If session close fails, don't let it crash the app
                pass


async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)


async def create_db_and_tables():
    """Create database tables - use carefully in production"""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        print(f"Error creating tables: {e}")
        # Don't let table creation errors crash the app startup


# VERCEL FIX: Add cleanup function for graceful shutdown
async def close_db():
    """Close the database engine properly"""
    try:
        await engine.dispose()
    except Exception:
        pass  # Ignore cleanup errors