from typing import Optional

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str


class DatabaseHealthResponse(BaseModel):
    status: str
    database: str
    detail: Optional[str] = None


class StorageHealthResponse(BaseModel):
    status: str
    storage: str
    bucket: str
    detail: Optional[str] = None


class FullHealthResponse(BaseModel):
    status: str
    backend: str
    database: str
    storage: str
