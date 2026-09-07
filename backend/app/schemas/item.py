from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ItemStatus(str, Enum):
    active = "active"
    inactive = "inactive"


class ItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    status: ItemStatus = ItemStatus.active


class ItemCreate(ItemBase):
    pass


class ItemUpdate(ItemBase):
    pass


class ItemRead(ItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class MessageResponse(BaseModel):
    message: str
