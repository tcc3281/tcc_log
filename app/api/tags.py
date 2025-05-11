from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/tags", tags=["tags"])

@router.post("/", response_model=schemas.Tag)
def create_tag(tag: schemas.TagCreate, db: Session = Depends(get_db)):
    return crud.create_tag(db, tag)

@router.get("/", response_model=List[schemas.Tag])
def read_tags(db: Session = Depends(get_db)):
    return crud.get_tags(db)

@router.post("/{entry_id}/{tag_id}", response_model=schemas.Entry)
def add_tag(entry_id: int, tag_id: int, db: Session = Depends(get_db)):
    return crud.add_tag_to_entry(db, entry_id, tag_id) 