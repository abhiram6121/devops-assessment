import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.file import File
from app.schemas.file import FileDownload, FileRead, MessageResponse
from app.services.storage import StorageError, storage_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/files", tags=["Files"])


@router.get("", response_model=list[FileRead])
def list_files(db: Session = Depends(get_db)):
    files = db.execute(select(File).order_by(File.id)).scalars().all()
    return files


@router.post("", response_model=FileRead, status_code=201)
async def upload_file(file: UploadFile, db: Session = Depends(get_db)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="A file with a filename is required")

    contents = await file.read()
    size = len(contents)
    if size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    content_type = file.content_type or "application/octet-stream"
    object_key = storage_service.build_object_key(file.filename)

    import io

    try:
        storage_service.upload_file(io.BytesIO(contents), object_key, content_type)
    except StorageError as exc:
        logger.error("Upload failed for '%s': %s", file.filename, exc)
        raise HTTPException(status_code=500, detail="Failed to upload file to storage") from exc

    record = File(
        filename=file.filename,
        object_key=object_key,
        content_type=content_type,
        size=size,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info("Uploaded file id=%s filename=%s key=%s", record.id, record.filename, object_key)
    return record


@router.get("/{file_id}", response_model=FileDownload)
def get_file(file_id: int, db: Session = Depends(get_db)):
    record = db.get(File, file_id)
    if record is None:
        raise HTTPException(status_code=404, detail="File not found")

    try:
        url = storage_service.generate_download_url(record.object_key, record.filename)
    except StorageError as exc:
        logger.error("Could not generate download URL for file id=%s: %s", file_id, exc)
        raise HTTPException(status_code=500, detail="Failed to retrieve file") from exc

    return FileDownload(id=record.id, filename=record.filename, url=url)


@router.delete("/{file_id}", response_model=MessageResponse)
def delete_file(file_id: int, db: Session = Depends(get_db)):
    record = db.get(File, file_id)
    if record is None:
        raise HTTPException(status_code=404, detail="File not found")

    try:
        storage_service.delete_file(record.object_key)
    except StorageError as exc:
        logger.error("Could not delete object for file id=%s: %s", file_id, exc)
        raise HTTPException(status_code=500, detail="Failed to delete file from storage") from exc

    db.delete(record)
    db.commit()
    logger.info("Deleted file id=%s", file_id)
    return MessageResponse(message="File deleted successfully")
