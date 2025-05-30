from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from typing import List
import logging

from .. import crud, schemas, models
from ..database import get_db
from .auth import get_current_active_user

# Set up logger
logger = logging.getLogger(__name__)

# Router without prefix - prefix is added in main.py
router = APIRouter(tags=["topics"])

# Add OPTIONS handlers to handle CORS preflight requests
@router.options("/", include_in_schema=False)
@router.options("/{topic_id}", include_in_schema=False)
async def options_handler(request: Request):
    logger.debug(f"OPTIONS request to topics API: {request.url}")
    response = Response()
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Max-Age"] = "86400"
    return response

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
    logger.debug(f"Fetching topics for user: {current_user.username}")
    return crud.get_topics(db, current_user.user_id, skip, limit)

@router.get("/public", response_model=List[schemas.Topic])
def read_public_topics(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Get a list of public topics (no authentication required)"""
    logger.debug("Fetching public topics")
    # This is for testing only - in a real app, you'd have a concept of public topics
    # For now we just return all topics from a test user (user_id=1)
    return crud.get_topics(db, user_id=1, skip=skip, limit=limit)

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

@router.get("/{topic_id}/entries", response_model=List[schemas.Entry])
def read_topic_entries(
    topic_id: int,
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    topic = crud.get_topic(db, topic_id, current_user.user_id)
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return crud.get_entries_by_topic(db, topic_id, current_user.user_id, skip, limit)