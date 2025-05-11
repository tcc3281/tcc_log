from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

entry_tags = Table(
    "entry_tags",
    Base.metadata,
    Column("entry_id", ForeignKey("entries.entry_id"), primary_key=True),
    Column("tag_id", ForeignKey("tags.tag_id"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    topics = relationship("Topic", back_populates="user")
    entries = relationship("Entry", back_populates="user")

class Topic(Base):
    __tablename__ = "topics"

    topic_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    topic_name = Column(String, index=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="topics")
    entries = relationship("Entry", back_populates="topic")

class Entry(Base):
    __tablename__ = "entries"

    entry_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.topic_id"), nullable=False)
    title = Column(String, index=True, nullable=False)
    content = Column(Text)
    entry_date = Column(Date, nullable=False)
    location = Column(String)
    mood = Column(String)
    weather = Column(String)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="entries")
    topic = relationship("Topic", back_populates="entries")
    files = relationship("File", back_populates="entry")
    links = relationship("Link", back_populates="entry")
    tags = relationship("Tag", secondary=entry_tags, back_populates="entries")

class File(Base):
    __tablename__ = "files"

    file_id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("entries.entry_id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String)
    file_size = Column(Integer)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    entry = relationship("Entry", back_populates="files")

class Link(Base):
    __tablename__ = "links"

    link_id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("entries.entry_id"), nullable=False)
    url = Column(String, nullable=False)
    title = Column(String)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    entry = relationship("Entry", back_populates="links")

class Tag(Base):
    __tablename__ = "tags"

    tag_id = Column(Integer, primary_key=True, index=True)
    tag_name = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    entries = relationship("Entry", secondary=entry_tags, back_populates="tags") 