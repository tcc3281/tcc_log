from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
import os
from uuid import uuid4

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/files", tags=["files"])

@router.post("/{entry_id}", response_model=schemas.File)
async def upload_file(entry_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Save file to disk
    uploads_dir = "uploads"
    os.makedirs(uploads_dir, exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1]
    unique_name = f"{uuid4().hex}{file_ext}"
    file_path = os.path.join(uploads_dir, unique_name)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    file_size = os.path.getsize(file_path)
    file_schema = schemas.FileCreate(file_name=file.filename, file_path=file_path, file_type=file.content_type, file_size=file_size)
    return crud.create_file(db, file_schema, entry_id)

@router.get("/{entry_id}", response_model=List[schemas.File])
def read_files(entry_id: int, db: Session = Depends(get_db)):
    return crud.get_files(db, entry_id) 