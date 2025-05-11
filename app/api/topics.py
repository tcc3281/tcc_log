from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/topics", tags=["topics"])

@router.post("/", response_model=schemas.Topic)
def create_topic(topic: schemas.TopicCreate, user_id: int, db: Session = Depends(get_db)):
    return crud.create_topic(db, topic, user_id)

@router.get("/", response_model=List[schemas.Topic])
def read_topics(user_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_topics(db, user_id, skip, limit) 