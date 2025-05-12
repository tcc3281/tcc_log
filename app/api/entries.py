from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, models
from ..database import get_db
from .auth import get_current_active_user

router = APIRouter(tags=["entries"])

@router.post("/", response_model=schemas.Entry)
def create_entry(
    entry: schemas.EntryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    # Ensure get_topic is called with topic_id and user_id
    if not crud.get_topic(db, topic_id=entry.topic_id, user_id=current_user.user_id):
        raise HTTPException(status_code=404, detail="Topic not found")
    return crud.create_entry(db=db, entry=entry, user_id=current_user.user_id)

@router.get("/", response_model=List[schemas.Entry])
def read_entries(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.get_entries(db, current_user.user_id, skip, limit)

@router.get("/{entry_id}", response_model=schemas.Entry)
def read_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    entry = crud.get_entry(db, entry_id)
    if entry is None or entry.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry

@router.put("/{entry_id}", response_model=schemas.Entry)
def update_entry(
    entry_id: int,
    entry_update: schemas.EntryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    entry = crud.get_entry(db, entry_id)
    if entry is None or entry.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Entry not found")
    return crud.update_entry(db, entry_id, entry_update)

@router.delete("/{entry_id}", response_model=schemas.Entry)
def delete_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    entry = crud.get_entry(db, entry_id)
    if entry is None or entry.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Entry not found")
    return crud.delete_entry(db, entry_id)