from datetime import datetime, date
from pydantic import BaseModel, HttpUrl
from typing import Optional, List

# User schemas
class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class User(UserBase):
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# Topic schemas
class TopicBase(BaseModel):
    topic_name: str
    description: Optional[str] = None

class TopicCreate(TopicBase):
    pass

class TopicUpdate(TopicBase):
    pass

class Topic(TopicBase):
    topic_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# Entry schemas
class EntryBase(BaseModel):
    title: str
    content: Optional[str] = None
    entry_date: date
    location: Optional[str] = None
    mood: Optional[str] = None
    weather: Optional[str] = None
    is_public: bool = False

class EntryCreate(BaseModel):
    topic_id: int
    title: str
    content: Optional[str] = None
    entry_date: str
    location: Optional[str] = None
    mood: Optional[str] = None
    weather: Optional[str] = None
    is_public: bool

class EntryUpdate(EntryBase):
    pass

class Entry(EntryBase):
    entry_id: int
    user_id: int
    topic_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# File schemas
class FileBase(BaseModel):
    file_name: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None

class FileCreate(FileBase):
    pass

class File(FileBase):
    file_id: int
    entry_id: int
    uploaded_at: datetime

    class Config:
        orm_mode = True

# Link schemas
class LinkBase(BaseModel):
    url: HttpUrl
    title: Optional[str] = None
    description: Optional[str] = None

class LinkCreate(LinkBase):
    pass

class Link(LinkBase):
    link_id: int
    entry_id: int
    created_at: datetime

    class Config:
        orm_mode = True

# Tag schemas
class TagBase(BaseModel):
    tag_name: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    tag_id: int
    created_at: datetime

    class Config:
        orm_mode = True

# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None