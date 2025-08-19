# database.py - Enhanced with event loop protection
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from fastapi import Depends
from fastapi_users.db import SQLAlchemyUserDatabase
from .models import Base, User
from .config import settings
import ssl
import asyncio
import weakref
from contextlib import asynccontextmanager

# Convert URL if needed
db_url = settings.DATABASE_URL

if "sslmode=require" in db_url:
    db_url = db_url.replace("?sslmode=require", "").replace("&sslmode=require", "")

# Create SSL context
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# CRITICAL: Keep reference to prevent premature cleanup
_engine_refs = weakref.WeakSet()

# Serverless-optimized engine
engine = create_async_engine(
    db_url,
    echo=False,
    connect_args={
        "ssl": ssl_context,
        "command_timeout": 20,  # Shorter timeout
        "server_settings": {
            "application_name": "fastapi_vercel",
        },
    },
    # Very conservative settings for serverless
    pool_size=1,  # Minimum possible
    max_overflow=2,  # Very small overflow
    pool_timeout=5,  # Quick timeout
    pool_recycle=60,  # Recycle after 1 minute
    pool_pre_ping=True,
    # pool_reset_on_return="commit",
    pool_reset_on_return=None,
)

# Keep reference to engine
_engine_refs.add(engine)

async_session_maker = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
    autoflush=False,
    autocommit=False,
)

# Global flag to track if we're shutting down
_shutting_down = False


@asynccontextmanager
async def get_session_with_timeout():
    """Get session with timeout and event loop protection"""
    session = None
    try:
        # Check if we're in shutdown
        if _shutting_down:
            raise RuntimeError("Application is shutting down")

        # Verify event loop is available and not closed
        try:
            loop = asyncio.get_running_loop()
            if loop.is_closed():
                raise RuntimeError("Event loop is closed")
        except RuntimeError as e:
            if "no running event loop" in str(e):
                raise RuntimeError("No event loop available")
            raise

        # Create session with timeout
        session = await asyncio.wait_for(
            async_session_maker(),
            timeout=5.0
        )

        yield session

    except asyncio.TimeoutError:
        if session:
            await session.rollback()
        raise RuntimeError("Database session creation timeout")
    except Exception as e:
        if session:
            try:
                await session.rollback()
            except:
                pass
        raise
    finally:
        if session:
            try:
                # Force close with timeout
                close_task = asyncio.create_task(session.close())
                await asyncio.wait_for(close_task, timeout=2.0)
            except asyncio.TimeoutError:
                # Force cleanup if close times out
                try:
                    await session.rollback()
                except:
                    pass
            except Exception:
                pass


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Session dependency with event loop protection"""
    async with get_session_with_timeout() as session:
        yield session


async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)


# Event loop protection utilities
def ensure_event_loop():
    """Ensure we have a running event loop"""
    try:
        loop = asyncio.get_running_loop()
        if loop.is_closed():
            raise RuntimeError("Event loop is closed")
        return loop
    except RuntimeError:
        # Create new event loop if none exists
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        return loop


async def safe_database_operation(operation, timeout=10.0):
    """Wrapper for database operations with event loop protection"""
    try:
        # Ensure event loop is available
        ensure_event_loop()

        # Run operation with timeout
        return await asyncio.wait_for(operation(), timeout=timeout)

    except asyncio.TimeoutError:
        raise RuntimeError(f"Database operation timeout after {timeout}s")
    except Exception as e:
        if "Event loop is closed" in str(e):
            raise RuntimeError("Database connection lost")
        raise


async def create_db_and_tables():
    """Create database tables with protection"""
    global _shutting_down

    if _shutting_down:
        return

    try:
        async def create_tables():
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

        await safe_database_operation(create_tables, timeout=15.0)

    except Exception as e:
        print(f"Error creating tables: {e}")


async def close_db():
    """Close database with proper cleanup"""
    global _shutting_down
    _shutting_down = True

    try:
        # Give pending operations time to complete
        await asyncio.sleep(0.1)

        # Dispose engine with timeout
        dispose_task = asyncio.create_task(engine.dispose())
        await asyncio.wait_for(dispose_task, timeout=3.0)

    except asyncio.TimeoutError:
        print("Database cleanup timeout - forcing shutdown")
    except Exception as e:
        print(f"Database cleanup error: {e}")
    finally:
        _shutting_down = False


# Periodic cleanup task to prevent connection buildup
async def periodic_cleanup():
    """Background task to clean up connections"""
    while not _shutting_down:
        try:
            await asyncio.sleep(30)  # Run every 30 seconds
            # Force garbage collection of unused connections
            import gc
            gc.collect()
        except Exception:
            break