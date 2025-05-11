from sqlalchemy.orm import Session
from fastapi import Depends
from ..database import get_db as get_db_func


def get_db(db: Session = Depends(get_db_func)):
    """Dependency that provides a database session"""
    return db 