import logging

import sqlalchemy as sa
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.schemas.health import (
    DatabaseHealthResponse,
    FullHealthResponse,
    HealthResponse,
    StorageHealthResponse,
)
from app.services.storage import StorageError, storage_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=HealthResponse)
def health() -> HealthResponse:
    """Verifies that the FastAPI process itself is up and reachable."""
    return HealthResponse(status="ok", service="backend")


@router.get("/db", response_model=DatabaseHealthResponse)
def health_db(db: Session = Depends(get_db)):
    """Verifies connectivity to PostgreSQL by actually running a query."""
    try:
        db.execute(sa.text("SELECT 1"))
        return DatabaseHealthResponse(status="ok", database="connected")
    except Exception as exc:  # noqa: BLE001 - report a controlled failure
        logger.error("Database health check failed: %s", exc)
        return DatabaseHealthResponse(status="error", database="disconnected", detail=str(exc))


@router.get("/s3", response_model=StorageHealthResponse)
def health_s3():
    """Verifies connectivity to the configured S3-compatible bucket."""
    try:
        storage_service.check_connection()
        return StorageHealthResponse(
            status="ok", storage="connected", bucket=settings.S3_BUCKET_NAME
        )
    except StorageError as exc:
        logger.error("Storage health check failed: %s", exc)
        return StorageHealthResponse(
            status="error", storage="disconnected", bucket=settings.S3_BUCKET_NAME, detail=str(exc)
        )


@router.get("/full", response_model=FullHealthResponse)
def health_full(db: Session = Depends(get_db)):
    """Exercises the entire backend dependency chain in one call."""
    db_status = "connected"
    try:
        db.execute(sa.text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001
        logger.error("Database health check failed: %s", exc)
        db_status = "disconnected"

    storage_status = "connected"
    try:
        storage_service.check_connection()
    except StorageError as exc:
        logger.error("Storage health check failed: %s", exc)
        storage_status = "disconnected"

    overall = "ok" if db_status == "connected" and storage_status == "connected" else "error"

    return FullHealthResponse(
        status=overall,
        backend="ok",
        database=db_status,
        storage=storage_status,
    )
