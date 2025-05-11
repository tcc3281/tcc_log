import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from typing import List
import time

from .. import crud, schemas
from ..database import get_db

# Set up logger
logger = logging.getLogger(__name__)

# Important: Ensure the router is correctly set up with NO prefix
router = APIRouter(tags=["users"])

# Make sure to handle all HTTP methods correctly
@router.options("/", include_in_schema=False)
@router.options("/{user_id}", include_in_schema=False)
async def options_handler(request: Request):
    logger.debug(f"OPTIONS request to users API: {request.url}")
    response = Response()
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Max-Age"] = "86400"
    return response

# FIX: Make sure the POST method is correctly defined with the path "/"
@router.post("/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
async def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    logger.info(f"POST request received to create user: {user.username}")
    start_time = time.time()
    
    try:
        # Check if username already exists
        username_check_start = time.time()
        db_user = crud.get_user_by_username(db, user.username)
        username_check_time = time.time() - username_check_start
        logger.debug(f"Username check took {username_check_time:.4f}s")
        
        if db_user:
            logger.warning(f"Username already registered: {user.username}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Check if email already exists
        email_check_start = time.time()
        db_email = crud.get_user_by_email(db, user.email)
        email_check_time = time.time() - email_check_start
        logger.debug(f"Email check took {email_check_time:.4f}s")
        
        if db_email:
            logger.warning(f"Email already registered: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create the user
        creation_start = time.time()
        created_user = crud.create_user(db, user)
        creation_time = time.time() - creation_start
        logger.debug(f"User creation took {creation_time:.4f}s")
        
        total_time = time.time() - start_time
        logger.info(f"User {user.username} created successfully in {total_time:.4f}s")
        return created_user
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise

@router.get("/", response_model=List[schemas.User])
async def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get a list of users"""
    logger.debug(f"Fetching users with skip={skip}, limit={limit}")
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@router.get("/{user_id}", response_model=schemas.User)
async def read_user(user_id: int, db: Session = Depends(get_db)):
    """Get a specific user by ID"""
    logger.debug(f"Fetching user with ID: {user_id}")
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        logger.warning(f"User not found: {user_id}")
        raise HTTPException(status_code=404, detail="User not found")
    return db_user