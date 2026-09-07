"""
Database access, powered by Alchemical (a thin, modern layer on top of
SQLAlchemy). The rest of the application never talks to psycopg2 or raw SQL
directly - everything goes through this module.
"""
import logging

from alchemical import Alchemical

from app.config import settings

logger = logging.getLogger(__name__)

# A single Alchemical instance is shared across the whole application.
# `db.Model` is the declarative base every model inherits from, and
# `db.Session` gives out SQLAlchemy sessions bound to the configured engine.
db = Alchemical(settings.DATABASE_URL)


def get_db():
    """FastAPI dependency that yields a database session per request."""
    with db.Session() as session:
        yield session


def init_db() -> None:
    """Create all tables that don't exist yet.

    For this assessment application a migration framework (e.g. Alembic) is
    intentionally not used - the schema is simple and stable, so creating
    tables on startup is sufficient and deterministic.
    """
    # Import models so they are registered on db.Model.metadata before
    # create_all() is called.
    from app.models import file, item  # noqa: F401

    logger.info("Initializing database schema")
    db.create_all()
    logger.info("Database schema ready")
