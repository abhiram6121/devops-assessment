from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FileRead(BaseModel):
    """Metadata returned for a file. Never includes AWS credentials or the
    raw S3 endpoint/bucket configuration."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    content_type: str
    size: int
    created_at: datetime


class FileDownload(BaseModel):
    id: int
    filename: str
    url: str


class MessageResponse(BaseModel):
    message: str
