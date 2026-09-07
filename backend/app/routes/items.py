import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemRead, ItemUpdate, MessageResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/items", tags=["Items"])


@router.get("", response_model=list[ItemRead])
def list_items(db: Session = Depends(get_db)):
    items = db.execute(select(Item).order_by(Item.id)).scalars().all()
    return items


@router.get("/{item_id}", response_model=ItemRead)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(Item, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("", response_model=ItemRead, status_code=201)
def create_item(payload: ItemCreate, db: Session = Depends(get_db)):
    item = Item(
        name=payload.name,
        description=payload.description,
        status=payload.status.value,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    logger.info("Created item id=%s", item.id)
    return item


@router.put("/{item_id}", response_model=ItemRead)
def update_item(item_id: int, payload: ItemUpdate, db: Session = Depends(get_db)):
    item = db.get(Item, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    item.name = payload.name
    item.description = payload.description
    item.status = payload.status.value
    db.commit()
    db.refresh(item)
    logger.info("Updated item id=%s", item.id)
    return item


@router.delete("/{item_id}", response_model=MessageResponse)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(Item, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(item)
    db.commit()
    logger.info("Deleted item id=%s", item_id)
    return MessageResponse(message="Item deleted successfully")
