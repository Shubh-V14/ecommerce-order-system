"""
Database Configuration and Session Management
SQLAlchemy 2.0 with async support and proper session handling
"""

from typing import AsyncGenerator, Optional
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Database metadata with naming convention
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

metadata = MetaData(naming_convention=convention)


class Base(DeclarativeBase):
    """Base class for all database models"""
    metadata = metadata


# Database engines
if settings.database_url.startswith("sqlite"):
    # SQLite configuration for sync operations (migrations)
    sync_url = settings.database_url.replace("sqlite+aiosqlite://", "sqlite:///")
    engine = create_engine(
        sync_url,
        echo=settings.debug,
        connect_args={"check_same_thread": False}
    )
    
    # For development, we'll use sync SQLite for simplicity
    # In production, switch to PostgreSQL with async support
    async_engine = None  # Will be set conditionally
    
else:
    # For PostgreSQL and other async databases
    sync_url = settings.database_url.replace("+asyncpg", "").replace("+aiopg", "")
    engine = create_engine(
        sync_url,
        echo=settings.debug,
        pool_pre_ping=True,
        pool_recycle=300
    )
    
    async_engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
        pool_pre_ping=True,
        pool_recycle=300
    )

# Session factories
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Only create async session if async_engine exists
if async_engine:
    AsyncSessionLocal = async_sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
else:
    AsyncSessionLocal = None


def get_db() -> Session:
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get async database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def create_tables():
    """Create all database tables"""
    logger.info("Creating database tables")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")


async def create_tables_async():
    """Create all database tables asynchronously"""
    logger.info("Creating database tables (async)")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created successfully (async)")


class DatabaseManager:
    """Database manager for handling connections and operations"""
    
    def __init__(self):
        self.engine = engine
        self.async_engine = async_engine
        self.session_factory = SessionLocal
        self.async_session_factory = AsyncSessionLocal
    
    def get_session(self) -> Session:
        """Get a new database session"""
        return self.session_factory()
    
    async def get_async_session(self) -> AsyncSession:
        """Get a new async database session"""
        return self.async_session_factory()
    
    def close(self):
        """Close all database connections"""
        self.engine.dispose()
    
    async def close_async(self):
        """Close all async database connections"""
        await self.async_engine.dispose()


# Global database manager instance
db_manager = DatabaseManager()
