from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/links", tags=["links"])

@router.post("/{entry_id}", response_model=schemas.Link)
def create_link(entry_id: int, link: schemas.LinkCreate, db: Session = Depends(get_db)):
    return crud.create_link(db, link, entry_id)

@router.get("/{entry_id}", response_model=List[schemas.Link])
def read_links(entry_id: int, db: Session = Depends(get_db)):
    return crud.get_links(db, entry_id) 