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

if "sslmode=require" in db_url:
    db_url = db_url.replace("?sslmode=require", "").replace("&sslmode=require", "")

# Create SSL context
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Simple, reliable engine configuration for Vercel
engine = create_async_engine(
    db_url,
    echo=False,  # Set to True for debugging SQL queries
    connect_args={
        "ssl": ssl_context,
        "command_timeout": 30,
        "server_settings": {
            "application_name": "fastapi_vercel",
        },
    },
    # Minimal pool settings for serverless
    pool_size=1,
    max_overflow=0,  # No overflow connections
    pool_timeout=10,
    pool_recycle=300,  # 5 minutes
    pool_pre_ping=True,
)

# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# Track active sessions to prevent premature closure
_active_sessions = set()


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Get database session with proper error handling"""
    session = None
    session_id = None

    try:
        # Check if event loop is available
        try:
            loop = asyncio.get_running_loop()
            if loop.is_closed():
                raise RuntimeError("Event loop is closed")
        except RuntimeError:
            raise RuntimeError("No event loop available")

        # Create session (this is NOT awaitable)
        session = async_session_maker()
        session_id = id(session)
        _active_sessions.add(session_id)

        # Yield the session
        yield session

    except Exception as e:
        # Handle any errors during session creation or usage
        if session:
            try:
                await session.rollback()
            except Exception:
                pass  # Ignore rollback errors
        raise
    finally:
        # Always clean up the session
        if session:
            try:
                await session.close()
            except Exception:
                pass  # Ignore close errors

        if session_id:
            _active_sessions.discard(session_id)


async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)


async def create_db_and_tables():
    """Create database tables"""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        print(f"Error creating tables: {e}")
        # Don't crash the app if table creation fails


async def close_db():
    """Close database connections"""
    try:
        await engine.dispose()
    except Exception as e:
        print(f"Error closing database: {e}")


# Health check function
async def check_database_health():
    """Check if database is accessible"""
    try:
        async with async_session_maker() as session:
            # Simple query to test connection
            await session.execute("SELECT 1")
            return True
    except Exception:
        return False


# Get session count for monitoring
def get_active_session_count():
    """Get number of active sessions"""
    return len(_active_sessions)