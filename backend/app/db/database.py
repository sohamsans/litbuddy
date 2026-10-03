import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./autolit.db")

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

from sqlalchemy import text

async def init_db():
    """Create all database tables on application startup and auto-migrate missing columns."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        def migrate_sqlite_columns(sync_conn):
            try:
                # Check users table
                res = sync_conn.execute(text("PRAGMA table_info(users)"))
                user_cols = [row[1] for row in res.fetchall()]
                if user_cols:
                    if "save_chat_history" not in user_cols:
                        sync_conn.execute(text("ALTER TABLE users ADD COLUMN save_chat_history BOOLEAN DEFAULT 1"))
                    if "contribute_public_cache" not in user_cols:
                        sync_conn.execute(text("ALTER TABLE users ADD COLUMN contribute_public_cache BOOLEAN DEFAULT 1"))
            except Exception as e:
                print(f"[DB Auto-Migration Warning] {e}")

        await conn.run_sync(migrate_sqlite_columns)

async def get_db():
    """Dependency for yielding an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
