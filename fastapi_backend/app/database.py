# database.py
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

# --- CRITICAL FIX: DO NOT DISABLE THE POOL ---
# Create async engine with proper SSL handling
# Let SQLAlchemy handle connection pooling, which is necessary for async
engine = create_async_engine(
    db_url,
    # REMOVED: poolclass=None,  # <-- THIS WAS THE MAIN PROBLEM
    # Let SQLAlchemy use its default async pool which works with asyncpg
    echo=True,  # Optional: helps with debugging SQL queries
    connect_args={
        "ssl": ssl_context,  # Use SSL context instead of sslmode
        # REMOVED: Disabling caches can cause more problems than it solves
        # "statement_cache_size": 0,  # Let asyncpg handle caching
        # "prepared_statement_cache_size": 0, # Let asyncpg handle caching
        "command_timeout": 60,  # Add timeout for commands
    },
    # Optional: Configure pool settings for better performance/stability
    pool_size=20,           # Maximum number of connections in pool
    max_overflow=10,        # Maximum number of connections beyond pool_size
    pool_timeout=30,        # Seconds to wait for a connection from pool
    pool_recycle=1800,      # Recycle connections after 30 minutes (1800 sec)
    pool_pre_ping=True,     # Test connections for health before using them
)

async_session_maker = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
    autoflush=False  # Added for better session control
)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            # Explicitly close the session to ensure cleanup
            await session.close()  # <-- CRITICAL: This ensures the connection is returned to the pool


async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)


async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)