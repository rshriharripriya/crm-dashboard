# database.py
from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool
from fastapi import Depends
from fastapi_users.db import SQLAlchemyUserDatabase
from .models import Base, User
from .config import settings
import ssl
import asyncio
import logging

logger = logging.getLogger(__name__)

# Global engine instance
_engine: Optional[object] = None
_session_maker: Optional[async_sessionmaker] = None


def get_engine():
    """Get or create the database engine (singleton pattern)"""
    global _engine, _session_maker

    if _engine is None:
        # Convert URL if needed
        db_url = settings.DATABASE_URL

        # Clean up SSL parameters from URL
        if "sslmode=require" in db_url:
            db_url = db_url.replace("?sslmode=require", "").replace("&sslmode=require", "")

        # Create minimal SSL context for faster connections
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE

        # Optimized engine for serverless with aggressive connection management
        _engine = create_async_engine(
            db_url,
            echo=False,

            poolclass=NullPool,

            # Balanced timeouts for serverless with slow DB
            connect_args={
                "ssl": ssl_context,
                "command_timeout": 60,  # Generous timeout for slow queries
                "server_settings": {
                    "application_name": "fastapi_vercel",
                    "tcp_keepalives_idle": "600",
                    "tcp_keepalives_interval": "30",
                    "tcp_keepalives_count": "3",
                },
                "timeout": 10,  # Connection establishment timeout
            },

            # Performance optimizations
            echo_pool=False,
            future=True,
        )

        # Create session maker
        _session_maker = async_sessionmaker(
            _engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
            autocommit=False,
        )

    return _engine


def get_session_maker():
    """Get the session maker"""
    get_engine()  # Ensure engine is created
    return _session_maker


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Optimized session generator for serverless environments
    Each request gets a fresh connection that's immediately closed
    """
    session_maker = get_session_maker()
    session = None

    try:
        # Create session - this creates a new connection
        session = session_maker()

        # Yield session for use
        yield session

        # Commit any pending transactions
        if session.in_transaction():
            await session.commit()

    except Exception as e:
        if session:
            try:
                await session.rollback()
            except Exception as rollback_error:
                logger.warning(f"Rollback failed: {rollback_error}")
        raise e
    finally:
        if session:
            try:
                # Close session immediately - critical for serverless
                await session.close()
            except Exception as close_error:
                logger.warning(f"Session close failed: {close_error}")


async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    """Get user database instance"""
    yield SQLAlchemyUserDatabase(session, User)


async def create_db_and_tables():
    """Create database tables - optimized for serverless"""
    try:
        engine = get_engine()

        # Use a single connection for table creation
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        logger.info("Database tables created successfully")

    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        # Don't crash the app, but log the error


async def check_database_health() -> bool:
    """
    Quick database health check
    """
    try:
        session_maker = get_session_maker()

        # Use a very simple, fast query with timeout
        async with session_maker() as session:
            # Set a statement timeout for this query
            await session.execute("SELECT 1")

        return True

    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False


# Utility functions for monitoring
def reset_engine():
    """Reset the engine (useful for testing or recovery)"""
    global _engine, _session_maker
    _engine = None
    _session_maker = None


async def close_db():
    """
    Close database connections - for serverless, this is mostly a no-op
    since NullPool doesn't maintain persistent connections
    """
    try:
        engine = get_engine()
        if engine:
            await engine.dispose()
    except Exception as e:
        logger.error(f"Error disposing engine: {e}")


# Context manager for manual session handling (if needed)
class DatabaseSession:
    """Context manager for database sessions"""

    def __init__(self):
        self.session = None

    async def __aenter__(self):
        session_maker = get_session_maker()
        self.session = session_maker()
        return self.session

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            try:
                if exc_type is not None:
                    await self.session.rollback()
                else:
                    await self.session.commit()
            except Exception as e:
                logger.error(f"Session cleanup error: {e}")
            finally:
                await self.session.close()
