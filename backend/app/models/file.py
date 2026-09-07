from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.database import db


class File(db.Model):
    """Metadata for a file whose bytes live in S3-compatible object storage.

    Only metadata is persisted here - the actual file content lives in the
    configured S3 bucket under `object_key`.
    """

    __tablename__ = "files"

    id: Mapped[int] = mapped_column(primary_key=True)
    filename: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    object_key: Mapped[str] = mapped_column(sa.String(1024), nullable=False, unique=True)
    content_type: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    size: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime, nullable=False, default=datetime.utcnow
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging helper only
        return f"<File id={self.id} filename={self.filename!r}>"
