from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, models
from ..database import get_db
from .auth import get_current_active_user

router = APIRouter(tags=["topics"])

@router.post("/", response_model=schemas.Topic)
def create_topic(
    topic: schemas.TopicCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.create_topic(db, topic, current_user.user_id)

@router.get("/", response_model=List[schemas.Topic])
def read_topics(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.get_topics(db, current_user.user_id, skip, limit)

@router.get("/{topic_id}", response_model=schemas.Topic)
def read_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    topic = crud.get_topic(db, topic_id, current_user.user_id)
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic

@router.put("/{topic_id}", response_model=schemas.Topic)
def update_topic(
    topic_id: int,
    topic_update: schemas.TopicUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    topic = crud.get_topic(db, topic_id, current_user.user_id)
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return crud.update_topic(db, topic_id, topic_update)

@router.delete("/{topic_id}", response_model=schemas.Topic)
def delete_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    topic = crud.get_topic(db, topic_id, current_user.user_id)
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return crud.delete_topic(db, topic_id)