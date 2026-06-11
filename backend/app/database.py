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
        # Incidents table: add status, admin_notes, reviewed_by_staff_id if missing
        if "incidents" in inspector.get_table_names():
            existing = [c["name"] for c in inspector.get_columns("incidents")]
            if "status" not in existing:
                conn.execute(text("ALTER TABLE incidents ADD COLUMN status VARCHAR DEFAULT 'pending_review'"))
            if "admin_notes" not in existing:
                conn.execute(text("ALTER TABLE incidents ADD COLUMN admin_notes TEXT DEFAULT ''"))
            if "reviewed_by_staff_id" not in existing:
                conn.execute(text("ALTER TABLE incidents ADD COLUMN reviewed_by_staff_id VARCHAR DEFAULT ''"))
        # Products table: add stock_quantity if missing
        if "products" in inspector.get_table_names():
            existing = [c["name"] for c in inspector.get_columns("products")]
            if "stock_quantity" not in existing:
                conn.execute(text("ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 100"))
        # Orders table: add payment_method, receipt_sent, receipt_email if missing
        if "orders" in inspector.get_table_names():
            existing = [c["name"] for c in inspector.get_columns("orders")]
            if "payment_method" not in existing:
                conn.execute(text("ALTER TABLE orders ADD COLUMN payment_method VARCHAR DEFAULT 'card_on_file'"))
            if "receipt_sent" not in existing:
                conn.execute(text("ALTER TABLE orders ADD COLUMN receipt_sent BOOLEAN DEFAULT 0"))
            if "receipt_email" not in existing:
                conn.execute(text("ALTER TABLE orders ADD COLUMN receipt_email VARCHAR DEFAULT NULL"))
        # Families table: add archived if missing
        if "families" in inspector.get_table_names():
            existing = [c["name"] for c in inspector.get_columns("families")]
            if "archived" not in existing:
                conn.execute(text("ALTER TABLE families ADD COLUMN archived BOOLEAN DEFAULT 0"))
        # Invoices table: add recurring fields if missing
        if "invoices" in inspector.get_table_names():
            existing = [c["name"] for c in inspector.get_columns("invoices")]
            if "is_recurring" not in existing:
                conn.execute(text("ALTER TABLE invoices ADD COLUMN is_recurring VARCHAR DEFAULT 'false'"))
            if "recurring_frequency" not in existing:
                conn.execute(text("ALTER TABLE invoices ADD COLUMN recurring_frequency VARCHAR DEFAULT NULL"))
            if "recurring_end_date" not in existing:
                conn.execute(text("ALTER TABLE invoices ADD COLUMN recurring_end_date DATE DEFAULT NULL"))
            if "recurring_parent_id" not in existing:
                conn.execute(text("ALTER TABLE invoices ADD COLUMN recurring_parent_id VARCHAR DEFAULT NULL"))
            if "next_invoice_date" not in existing:
                conn.execute(text("ALTER TABLE invoices ADD COLUMN next_invoice_date DATE DEFAULT NULL"))
        # Leads table: add family_id, enrollment_data, and tour_campus_id if missing
        if "leads" in inspector.get_table_names():
            existing = [c["name"] for c in inspector.get_columns("leads")]
            if "family_id" not in existing:
                conn.execute(text("ALTER TABLE leads ADD COLUMN family_id VARCHAR DEFAULT NULL"))
            if "enrollment_data" not in existing:
                conn.execute(text("ALTER TABLE leads ADD COLUMN enrollment_data TEXT DEFAULT NULL"))
            if "tour_campus_id" not in existing:
                conn.execute(text("ALTER TABLE leads ADD COLUMN tour_campus_id VARCHAR DEFAULT NULL"))
        conn.commit()
    finally:
        conn.close()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    _run_migrations()
