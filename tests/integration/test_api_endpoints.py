"""
Integration Tests for API Endpoints
Tests all main API endpoints with proper authentication
"""

import pytest
from tests.config.test_config import (
    test_client, db_session, test_db, 
    create_test_user, create_test_topic, create_test_entry,
    get_auth_headers
)

class TestTopicsAPI:
    """Test Topics API endpoints"""
    
    def test_create_topic_success(self, test_client, db_session):
        """Test successful topic creation"""
        user = create_test_user(db_session)
        headers = get_auth_headers(test_client)
        
        topic_data = {
            "topic_name": "API Test Topic",
            "description": "Topic created via API test"
        }
        
        response = test_client.post("/topics/", json=topic_data, headers=headers)
        
        assert response.status_code == 201
        data = response.json()
        assert data["topic_name"] == topic_data["topic_name"]
        assert data["description"] == topic_data["description"]
        assert "topic_id" in data
    
    def test_create_topic_unauthorized(self, test_client):
        """Test topic creation without authentication"""
        topic_data = {
            "topic_name": "Unauthorized Topic",
            "description": "This should fail"
        }
        
        response = test_client.post("/topics/", json=topic_data)
        
        assert response.status_code == 401
    
    def test_get_user_topics(self, test_client, db_session):
        """Test getting user's topics"""
        user = create_test_user(db_session)
        topic1 = create_test_topic(db_session, user.user_id, "Topic 1")
        topic2 = create_test_topic(db_session, user.user_id, "Topic 2")
        headers = get_auth_headers(test_client)
        
        response = test_client.get("/topics/", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2
        topic_names = [t["topic_name"] for t in data]
        assert "Topic 1" in topic_names
        assert "Topic 2" in topic_names
    
    def test_get_topic_by_id(self, test_client, db_session):
        """Test getting specific topic by ID"""
        user = create_test_user(db_session)
        topic = create_test_topic(db_session, user.user_id, "Specific Topic")
        headers = get_auth_headers(test_client)
        
        response = test_client.get(f"/topics/{topic.topic_id}", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["topic_id"] == topic.topic_id
        assert data["topic_name"] == "Specific Topic"
    
    def test_update_topic(self, test_client, db_session):
        """Test updating topic"""
        user = create_test_user(db_session)
        topic = create_test_topic(db_session, user.user_id, "Original Topic")
        headers = get_auth_headers(test_client)
        
        update_data = {
            "topic_name": "Updated Topic",
            "description": "Updated description"
        }
        
        response = test_client.put(f"/topics/{topic.topic_id}", json=update_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["topic_name"] == "Updated Topic"
        assert data["description"] == "Updated description"
    
    def test_delete_topic(self, test_client, db_session):
        """Test deleting topic"""
        user = create_test_user(db_session)
        topic = create_test_topic(db_session, user.user_id, "Topic to Delete")
        headers = get_auth_headers(test_client)
        
        response = test_client.delete(f"/topics/{topic.topic_id}", headers=headers)
        
        assert response.status_code == 204
        
        # Verify topic is deleted
        get_response = test_client.get(f"/topics/{topic.topic_id}", headers=headers)
        assert get_response.status_code == 404

class TestEntriesAPI:
    """Test Entries API endpoints"""
    
    def test_create_entry_success(self, test_client, db_session):
        """Test successful entry creation"""
        user = create_test_user(db_session)
        topic = create_test_topic(db_session, user.user_id)
        headers = get_auth_headers(test_client)
        
        entry_data = {
            "topic_id": topic.topic_id,
            "title": "API Test Entry",
            "content": "Entry content created via API test",
            "entry_date": "2024-01-15",
            "mood": "productive",
            "weather": "sunny",
            "location": "Home"
        }
        
        response = test_client.post("/entries/", json=entry_data, headers=headers)
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == entry_data["title"]
        assert data["content"] == entry_data["content"]
        assert data["topic_id"] == topic.topic_id
        assert "entry_id" in data
    
    def test_create_entry_invalid_topic(self, test_client, db_session):
        """Test entry creation with invalid topic_id"""
        user = create_test_user(db_session)
        headers = get_auth_headers(test_client)
        
        entry_data = {
            "topic_id": 99999,  # Non-existent topic
            "title": "Invalid Entry",
            "content": "This should fail",
            "entry_date": "2024-01-15"
        }
        
        response = test_client.post("/entries/", json=entry_data, headers=headers)
        
        assert response.status_code == 404
    
    def test_get_user_entries(self, test_client, db_session):
        """Test getting user's entries"""
        user = create_test_user(db_session)
        topic = create_test_topic(db_session, user.user_id)
        entry1 = create_test_entry(db_session, user.user_id, topic.topic_id, "Entry 1")
        entry2 = create_test_entry(db_session, user.user_id, topic.topic_id, "Entry 2")
        headers = get_auth_headers(test_client)
        
        response = test_client.get("/entries/", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2
        entry_titles = [e["title"] for e in data]
        assert "Entry 1" in entry_titles
        assert "Entry 2" in entry_titles
    
    def test_get_entry_by_id(self, test_client, db_session):
        """Test getting specific entry by ID"""
        user = create_test_user(db_session)
        topic = create_test_topic(db_session, user.user_id)
        entry = create_test_entry(db_session, user.user_id, topic.topic_id, "Specific Entry")
        headers = get_auth_headers(test_client)
        
        response = test_client.get(f"/entries/{entry.entry_id}", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["entry_id"] == entry.entry_id
        assert data["title"] == "Specific Entry"
    
    def test_update_entry(self, test_client, db_session):
        """Test updating entry"""
        user = create_test_user(db_session)
        topic = create_test_topic(db_session, user.user_id)
        entry = create_test_entry(db_session, user.user_id, topic.topic_id, "Original Entry")
        headers = get_auth_headers(test_client)
        
        update_data = {
            "title": "Updated Entry",
            "content": "Updated content",
            "mood": "excited"
        }
        
        response = test_client.put(f"/entries/{entry.entry_id}", json=update_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Entry"
        assert data["content"] == "Updated content"
        assert data["mood"] == "excited"
    
    def test_delete_entry(self, test_client, db_session):
        """Test deleting entry"""
        user = create_test_user(db_session)
        topic = create_test_topic(db_session, user.user_id)
        entry = create_test_entry(db_session, user.user_id, topic.topic_id, "Entry to Delete")
        headers = get_auth_headers(test_client)
        
        response = test_client.delete(f"/entries/{entry.entry_id}", headers=headers)
        
        assert response.status_code == 204
        
        # Verify entry is deleted
        get_response = test_client.get(f"/entries/{entry.entry_id}", headers=headers)
        assert get_response.status_code == 404
    
    def test_get_entries_by_topic(self, test_client, db_session):
        """Test getting entries filtered by topic"""
        user = create_test_user(db_session)
        topic1 = create_test_topic(db_session, user.user_id, "Topic 1")
        topic2 = create_test_topic(db_session, user.user_id, "Topic 2")
        
        entry1 = create_test_entry(db_session, user.user_id, topic1.topic_id, "Entry in Topic 1")
        entry2 = create_test_entry(db_session, user.user_id, topic2.topic_id, "Entry in Topic 2")
        
        headers = get_auth_headers(test_client)
        
        response = test_client.get(f"/entries/?topic_id={topic1.topic_id}", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        # All entries should belong to topic1
        for entry in data:
            assert entry["topic_id"] == topic1.topic_id

class TestTagsAPI:
    """Test Tags API endpoints"""
    
    def test_create_tag(self, test_client, db_session):
        """Test tag creation"""
        user = create_test_user(db_session)
        headers = get_auth_headers(test_client)
        
        tag_data = {"tag_name": "learning"}
        
        response = test_client.post("/tags/", json=tag_data, headers=headers)
        
        assert response.status_code == 201
        data = response.json()
        assert data["tag_name"] == "learning"
        assert "tag_id" in data
    
    def test_get_all_tags(self, test_client, db_session):
        """Test getting all tags"""
        from app.models import Tag
        
        user = create_test_user(db_session)
        headers = get_auth_headers(test_client)
        
        # Create some tags
        tag1 = Tag(tag_name="python")
        tag2 = Tag(tag_name="javascript")
        db_session.add_all([tag1, tag2])
        db_session.commit()
        
        response = test_client.get("/tags/", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        tag_names = [t["tag_name"] for t in data]
        assert "python" in tag_names
        assert "javascript" in tag_names
    
    def test_tag_entry_association(self, test_client, db_session):
        """Test associating tags with entries"""
        from app.models import Tag
        
        user = create_test_user(db_session)
        topic = create_test_topic(db_session, user.user_id)
        entry = create_test_entry(db_session, user.user_id, topic.topic_id)
        
        # Create tags
        tag1 = Tag(tag_name="study")
        tag2 = Tag(tag_name="notes")
        db_session.add_all([tag1, tag2])
        db_session.commit()
        
        headers = get_auth_headers(test_client)
        
        # Associate tags with entry
        tag_data = {"tag_ids": [tag1.tag_id, tag2.tag_id]}
        
        response = test_client.post(f"/entries/{entry.entry_id}/tags", json=tag_data, headers=headers)
        
        assert response.status_code == 200
        
        # Verify tags are associated
        entry_response = test_client.get(f"/entries/{entry.entry_id}", headers=headers)
        entry_data = entry_response.json()
        entry_tag_names = [t["tag_name"] for t in entry_data.get("tags", [])]
        assert "study" in entry_tag_names
        assert "notes" in entry_tag_names
