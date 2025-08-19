# database.py
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool
from fastapi import Depends
from fastapi_users.db import SQLAlchemyUserDatabase
from .models import Base, User
from .config import settings
import ssl
import asyncio
import asyncpg
from contextlib import asynccontextmanager

# Optimized connection string
db_url = settings.DATABASE_URL
if "sslmode=require" in db_url:
    db_url = db_url.replace("?sslmode=require", "").replace("&sslmode=require", "")

# Minimal SSL for speed
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE


engine = create_async_engine(
    db_url,
    echo=False,
    # CRITICAL: Use NullPool for serverless - no connection pooling overhead
    poolclass=NullPool,

    # Aggressive connection settings for speed
    connect_args={
        "ssl": ssl_context,
        "command_timeout": 10,  # Reduced from 30
        "server_settings": {
            "application_name": "fastapi_vercel",
        },
        # PostgreSQL performance settings
        "statement_cache_size": 0,  # Disable prepared statements for speed
        "prepared_statement_cache_size": 0,
    },

    # No pooling = faster startup
    pool_timeout=5,  # Reduced timeout
    pool_recycle=-1,
    pool_pre_ping=False,  # Skip ping for speed
)


async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,  # Manual flush for speed
    autocommit=False,
)


# FASTEST SESSION MANAGER
@asynccontextmanager
async def get_db_session():
    """Ultra-fast session context manager"""
    session = async_session_maker()
    try:
        # Set fast session options
        await session.execute("SET statement_timeout = '8s'")
        await session.execute("SET lock_timeout = '5s'")
        yield session
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency - optimized for speed"""
    async with get_db_session() as session:
        yield session


async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    """User database dependency"""
    yield SQLAlchemyUserDatabase(session, User)


# ALTERNATIVE: Direct asyncpg for ultra-speed (bypass SQLAlchemy)
class DirectDB:
    """Direct PostgreSQL connection for maximum speed"""

    @staticmethod
    async def get_connection():
        """Get direct asyncpg connection"""
        conn_str = db_url.replace("postgresql+asyncpg://", "postgresql://")

        return await asyncpg.connect(
            conn_str,
            ssl=ssl_context,
            command_timeout=8,
            # Speed optimizations
            statement_cache_size=0,
            prepared_statement_cache_size=0,
        )

    @staticmethod
    async def authenticate_user(email: str, password_hash: str):
        """Direct user authentication - bypasses SQLAlchemy"""
        conn = await DirectDB.get_connection()
        try:
            user = await conn.fetchrow(
                "SELECT id, email, hashed_password, is_active FROM user WHERE email = $1",
                email
            )
            return user
        finally:
            await conn.close()

    @staticmethod
    async def get_user_by_id(user_id: str):
        """Get user by ID - ultra fast"""
        conn = await DirectDB.get_connection()
        try:
            user = await conn.fetchrow(
                "SELECT * FROM user WHERE id = $1",
                user_id
            )
            return user
        finally:
            await conn.close()


# HEALTH CHECK - Super fast
async def check_database_health():
    """Lightning-fast health check"""
    try:
        conn = await DirectDB.get_connection()
        result = await conn.fetchval("SELECT 1")
        await conn.close()
        return result == 1
    except Exception:
        return False


# TABLE CREATION - Only when needed
async def create_db_and_tables():
    """Create tables if they don't exist"""
    try:
        async with engine.begin() as conn:
            # Check if tables exist first
            result = await conn.execute(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user')"
            )
            if not result.scalar():
                await conn.run_sync(Base.metadata.create_all)
                print("Tables created")
            else:
                print("Tables already exist")
    except Exception as e:
        print(f"Table creation error: {e}")


async def close_db():
    """Fast cleanup"""
    try:
        await engine.dispose()
    except Exception:
        pass


# BONUS: In-memory user cache for repeated requests
from functools import lru_cache
import time

_user_cache = {}
_cache_ttl = 60  # 1 minute cache


async def get_cached_user(email: str):
    """Get user with in-memory caching"""
    now = time.time()
    cache_key = f"user:{email}"

    # Check cache first
    if cache_key in _user_cache:
        user_data, cached_time = _user_cache[cache_key]
        if now - cached_time < _cache_ttl:
            return user_data

    # Cache miss - fetch from DB
    user = await DirectDB.authenticate_user(email, "")  # We'll verify password separately
    if user:
        _user_cache[cache_key] = (dict(user), now)

    return user


# Clean expired cache entries
def clean_cache():
    """Remove expired cache entries"""
    now = time.time()
    expired_keys = [
        key for key, (_, cached_time) in _user_cache.items()
        if now - cached_time > _cache_ttl
    ]
    for key in expired_keys:
        _user_cache.pop(key, None)