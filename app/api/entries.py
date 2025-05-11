from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/entries", tags=["entries"])

@router.post("/", response_model=schemas.Entry)
def create_entry(entry: schemas.EntryCreate, user_id: int, topic_id: int, db: Session = Depends(get_db)):
    return crud.create_entry(db, entry, user_id, topic_id)

@router.get("/", response_model=List[schemas.Entry])
def read_entries(user_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_entries(db, user_id, skip, limit) 