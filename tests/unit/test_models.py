"""
Unit Tests for Models and CRUD Operations
Tests database models, relationships, and CRUD functionality
"""

import pytest
from datetime import date, datetime
from tests.config.test_config import db_session, test_db, create_test_user, create_test_topic, create_test_entry

class TestModels:
    """Test database models and relationships"""
    
    def test_user_model_creation(self, db_session):
        """Test User model creation and attributes"""
        user = create_test_user(db_session, username="modeltest", email="model@test.com")
        
        assert user.user_id is not None
        assert user.username == "modeltest"
        assert user.email == "model@test.com"
        assert user.password_hash is not None
        assert isinstance(user.created_at, datetime)
        assert isinstance(user.updated_at, datetime)
    
    def test_topic_model_creation(self, db_session):
        """Test Topic model creation and user relationship"""
        user = create_test_user(db_session)
        topic = create_test_topic(db_session, user.user_id, "Test Topic Model")
        
        assert topic.topic_id is not None
        assert topic.user_id == user.user_id
        assert topic.topic_name == "Test Topic Model"
        assert topic.description == "Test topic description"
        assert isinstance(topic.created_at, datetime)
        
        # Test relationship
        assert topic.user == user
        assert topic in user.topics
    
    def test_entry_model_creation(self, db_session):
        """Test Entry model creation and relationships"""
        user = create_test_user(db_session)
        topic = create_test_topic(db_session, user.user_id)
        entry = create_test_entry(db_session, user.user_id, topic.topic_id, "Test Entry Model")
        
        assert entry.entry_id is not None
        assert entry.user_id == user.user_id
        assert entry.topic_id == topic.topic_id
        assert entry.title == "Test Entry Model"
        assert entry.content == "Test entry content for testing purposes"
        assert isinstance(entry.entry_date, date)
        assert entry.mood == "happy"
        assert entry.weather == "sunny"
        assert entry.is_public == False
        
        # Test relationships
        assert entry.user == user
        assert entry.topic == topic
        assert entry in user.entries
        assert entry in topic.entries
    
    def test_entry_tags_relationship(self, db_session):
        """Test Many-to-Many relationship between Entry and Tag"""
        from app.models import Tag
        
        # Create test data
        user = create_test_user(db_session)
        topic = create_test_topic(db_session, user.user_id)
        entry = create_test_entry(db_session, user.user_id, topic.topic_id)
        
        # Create tags
        tag1 = Tag(tag_name="learning")
        tag2 = Tag(tag_name="python")
        db_session.add_all([tag1, tag2])
        db_session.commit()
        
        # Associate tags with entry
        entry.tags.append(tag1)
        entry.tags.append(tag2)
        db_session.commit()
        
        # Test relationships
        assert len(entry.tags) == 2
        assert tag1 in entry.tags
        assert tag2 in entry.tags
        assert entry in tag1.entries
        assert entry in tag2.entries
    
    def test_file_model_creation(self, db_session):
        """Test File model creation and entry relationship"""
        from app.models import File
        
        user = create_test_user(db_session)
        topic = create_test_topic(db_session, user.user_id)
        entry = create_test_entry(db_session, user.user_id, topic.topic_id)
        
        file_obj = File(
            entry_id=entry.entry_id,
            file_name="test.pdf",
            file_path="/uploads/test.pdf",
            file_type="application/pdf",
            file_size=1024
        )
        db_session.add(file_obj)
        db_session.commit()
        db_session.refresh(file_obj)
        
        assert file_obj.file_id is not None
        assert file_obj.entry_id == entry.entry_id
        assert file_obj.file_name == "test.pdf"
        assert file_obj.entry == entry
        assert file_obj in entry.files
    
    def test_link_model_creation(self, db_session):
        """Test Link model creation and entry relationship"""
        from app.models import Link
        
        user = create_test_user(db_session)
        topic = create_test_topic(db_session, user.user_id)
        entry = create_test_entry(db_session, user.user_id, topic.topic_id)
        
        link = Link(
            entry_id=entry.entry_id,
            url="https://example.com",
            title="Example Link",
            description="Test link description"
        )
        db_session.add(link)
        db_session.commit()
        db_session.refresh(link)
        
        assert link.link_id is not None
        assert link.entry_id == entry.entry_id
        assert link.url == "https://example.com"
        assert link.entry == entry
        assert link in entry.links

class TestCRUDOperations:
    """Test CRUD operations"""
    
    def test_crud_user_operations(self, db_session):
        """Test user CRUD operations"""
        from app import crud, schemas
        
        # Create
        user_data = schemas.UserCreate(
            username="crudtest",
            email="crud@test.com",
            password="password123"
        )
        
        user = crud.create_user(db_session, user_data)
        assert user.username == "crudtest"
        
        # Read
        retrieved_user = crud.get_user(db_session, user.user_id)
        assert retrieved_user.user_id == user.user_id
        
        user_by_username = crud.get_user_by_username(db_session, "crudtest")
        assert user_by_username.user_id == user.user_id
        
        user_by_email = crud.get_user_by_email(db_session, "crud@test.com")
        assert user_by_email.user_id == user.user_id
        
        # Update
        update_data = schemas.UserUpdate(email="updated@test.com")
        updated_user = crud.update_user(db_session, user.user_id, update_data)
        assert updated_user.email == "updated@test.com"
        
        # List
        users = crud.get_users(db_session, skip=0, limit=10)
        assert len(users) >= 1
        assert any(u.user_id == user.user_id for u in users)
    
    def test_crud_topic_operations(self, db_session):
        """Test topic CRUD operations"""
        from app import crud, schemas
        
        user = create_test_user(db_session)
        
        # Create
        topic_data = schemas.TopicCreate(
            topic_name="CRUD Topic",
            description="Topic for CRUD testing"
        )
        
        topic = crud.create_topic(db_session, topic_data, user.user_id)
        assert topic.topic_name == "CRUD Topic"
        assert topic.user_id == user.user_id
        
        # Read
        retrieved_topic = crud.get_topic(db_session, topic.topic_id)
        assert retrieved_topic.topic_id == topic.topic_id
        
        # Update
        update_data = schemas.TopicUpdate(
            topic_name="Updated Topic",
            description="Updated description"
        )
        updated_topic = crud.update_topic(db_session, topic.topic_id, update_data)
        assert updated_topic.topic_name == "Updated Topic"
        
        # List user topics
        user_topics = crud.get_topics_by_user(db_session, user.user_id)
        assert len(user_topics) >= 1
        assert any(t.topic_id == topic.topic_id for t in user_topics)
    
    def test_crud_entry_operations(self, db_session):
        """Test entry CRUD operations"""
        from app import crud, schemas
        
        user = create_test_user(db_session)
        topic = create_test_topic(db_session, user.user_id)
        
        # Create
        entry_data = schemas.EntryCreate(
            topic_id=topic.topic_id,
            title="CRUD Entry",
            content="Entry content for CRUD testing",
            entry_date=date.today(),
            mood="excited",
            weather="cloudy"
        )
        
        entry = crud.create_entry(db_session, entry_data, user.user_id)
        assert entry.title == "CRUD Entry"
        assert entry.user_id == user.user_id
        assert entry.topic_id == topic.topic_id
        
        # Read
        retrieved_entry = crud.get_entry(db_session, entry.entry_id)
        assert retrieved_entry.entry_id == entry.entry_id
        
        # Update
        update_data = schemas.EntryUpdate(
            title="Updated Entry",
            content="Updated content",
            mood="happy"
        )
        updated_entry = crud.update_entry(db_session, entry.entry_id, update_data)
        assert updated_entry.title == "Updated Entry"
        assert updated_entry.mood == "happy"
        
        # List user entries
        user_entries = crud.get_entries_by_user(db_session, user.user_id)
        assert len(user_entries) >= 1
        assert any(e.entry_id == entry.entry_id for e in user_entries)
        
        # List topic entries
        topic_entries = crud.get_entries_by_topic(db_session, topic.topic_id)
        assert len(topic_entries) >= 1
        assert any(e.entry_id == entry.entry_id for e in topic_entries)
