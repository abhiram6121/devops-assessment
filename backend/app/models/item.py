from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.database import db


class Item(db.Model):
    """A simple business record used to exercise non-file backend/DB APIs."""

    __tablename__ = "items"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(sa.String(1000), nullable=True)
    status: Mapped[str] = mapped_column(sa.String(20), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging helper only
        return f"<Item id={self.id} name={self.name!r} status={self.status!r}>"
