from sqlalchemy.orm import Session
from passlib.context import CryptContext
from . import models, schemas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str):
    """Hash a password for storing."""
    return pwd_context.hash(password)

# User CRUD
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.user_id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(username=user.username, email=user.email, password_hash=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Topic CRUD
def get_topics(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Topic).filter(models.Topic.user_id == user_id).offset(skip).limit(limit).all()

def create_topic(db: Session, topic: schemas.TopicCreate, user_id: int):
    db_topic = models.Topic(**topic.dict(), user_id=user_id)
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic

def get_topic(db: Session, topic_id: int, user_id: int):
    return db.query(models.Topic).filter(
        models.Topic.topic_id == topic_id,
        models.Topic.user_id == user_id
    ).first()

def update_topic(db: Session, topic_id: int, topic: schemas.TopicUpdate):
    # Lấy topic trực tiếp từ database mà không cần user_id
    # vì chúng ta đã kiểm tra quyền sở hữu trong API endpoint
    db_topic = db.query(models.Topic).filter(models.Topic.topic_id == topic_id).first()
    if db_topic:
        for key, value in topic.dict(exclude_unset=True).items():
            setattr(db_topic, key, value)
        db.commit()
        db.refresh(db_topic)
    return db_topic

def delete_topic(db: Session, topic_id: int):
    # Lấy topic trực tiếp từ database mà không cần user_id
    # vì chúng ta đã kiểm tra quyền sở hữu trong API endpoint
    db_topic = db.query(models.Topic).filter(models.Topic.topic_id == topic_id).first()
    if db_topic:
        db.delete(db_topic)
        db.commit()
    return db_topic

# Entry CRUD
def get_entries(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Entry).filter(models.Entry.user_id == user_id).offset(skip).limit(limit).all()

def get_entries_by_topic(db: Session, topic_id: int, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Entry).filter(
        models.Entry.topic_id == topic_id,
        models.Entry.user_id == user_id
    ).order_by(models.Entry.entry_date.desc()).offset(skip).limit(limit).all()

def create_entry(db: Session, entry: schemas.EntryCreate, user_id: int):
    db_entry = models.Entry(
        user_id=user_id,
        topic_id=entry.topic_id,
        title=entry.title,
        content=entry.content,
        entry_date=entry.entry_date,
        location=entry.location,
        mood=entry.mood,
        weather=entry.weather,
        is_public=entry.is_public,
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

def get_entry(db: Session, entry_id: int):
    return db.query(models.Entry).filter(models.Entry.entry_id == entry_id).first()

def update_entry(db: Session, entry_id: int, entry: schemas.EntryUpdate):
    db_entry = get_entry(db, entry_id)
    for key, value in entry.dict(exclude_unset=True).items():
        setattr(db_entry, key, value)
    db.commit()
    db.refresh(db_entry)
    return db_entry

def delete_entry(db: Session, entry_id: int):
    db_entry = get_entry(db, entry_id)
    db.delete(db_entry)
    db.commit()
    return db_entry

# File CRUD
def get_files(db: Session, entry_id: int):
    return db.query(models.File).filter(models.File.entry_id == entry_id).all()

def create_file(db: Session, file: schemas.FileCreate, entry_id: int):
    db_file = models.File(**file.dict(), entry_id=entry_id)
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file

# Link CRUD
def get_links(db: Session, entry_id: int):
    return db.query(models.Link).filter(models.Link.entry_id == entry_id).all()

def create_link(db: Session, link: schemas.LinkCreate, entry_id: int):
    db_link = models.Link(**link.dict(), entry_id=entry_id)
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return db_link

# Tag CRUD
def get_tags(db: Session):
    return db.query(models.Tag).all()

def create_tag(db: Session, tag: schemas.TagCreate):
    db_tag = models.Tag(**tag.dict())
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag

def add_tag_to_entry(db: Session, entry_id: int, tag_id: int):
    entry = db.query(models.Entry).filter(models.Entry.entry_id == entry_id).first()
    tag = db.query(models.Tag).filter(models.Tag.tag_id == tag_id).first()
    if tag not in entry.tags:
        entry.tags.append(tag)
        db.commit()
    return entry