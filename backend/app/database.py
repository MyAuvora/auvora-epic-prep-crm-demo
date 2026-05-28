"""
Database configuration for EPIC CRM
Uses SQLite with async support for data persistence
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Use /data/app.db for Fly.io persistent volume, fallback to local for development
DATABASE_PATH = os.getenv("DATABASE_PATH", "/data/app.db")

# Check if we're in production (Fly.io) or development
if os.path.exists("/data"):
    DATABASE_URL = f"sqlite:///{DATABASE_PATH}"
else:
    # Local development - use local file, respecting DATABASE_PATH env var
    local_path = os.getenv("DATABASE_PATH", "./app.db")
    DATABASE_URL = f"sqlite:///{local_path}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _run_migrations():
    """Run lightweight ALTER TABLE migrations for new columns on existing tables."""
    from sqlalchemy import text, inspect
    conn = engine.connect()
    inspector = inspect(engine)
    try:
        # Staff table: add pay_type and pay_rate if missing
        if "staff" in inspector.get_table_names():
            existing = [c["name"] for c in inspector.get_columns("staff")]
            if "pay_type" not in existing:
                conn.execute(text("ALTER TABLE staff ADD COLUMN pay_type VARCHAR DEFAULT 'hourly'"))
            if "pay_rate" not in existing:
                conn.execute(text("ALTER TABLE staff ADD COLUMN pay_rate FLOAT DEFAULT 0.0"))
            conn.commit()
    finally:
        conn.close()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    _run_migrations()
