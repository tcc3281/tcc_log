from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import select

from .. import models, schemas
from ..database import get_db
from .auth import get_current_active_user

router = APIRouter(tags=["gallery"])

@router.get("/user/files", response_model=List[schemas.File])
def get_user_files(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Lấy tất cả các file thuộc về user hiện tại (thông qua entries của họ).
    """
    # Query để lấy tất cả các file của user
    query = (
        select(models.File)
        .join(models.Entry, models.File.entry_id == models.Entry.entry_id)
        .where(models.Entry.user_id == current_user.user_id)
    )
    result = db.execute(query).scalars().all()
    return result
