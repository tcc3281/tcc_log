"""
Tests for AI Features
Tests AI chat, analysis, and writing enhancement with mocked responses
"""

import pytest
from unittest.mock import patch, MagicMock
from tests.config.test_config import (
    test_client, db_session, test_db,
    create_test_user, create_test_topic, create_test_entry,
    get_auth_headers, MockAIResponse
)

class TestAIChat:
    """Test AI Chat functionality"""
    
    @patch('app.ai.lm_studio.chat_with_ai')
    def test_ai_chat_success(self, mock_chat, test_client, db_session):
        """Test successful AI chat interaction"""
        user = create_test_user(db_session)
        headers = get_auth_headers(test_client)
        
        # Mock AI response
        mock_response = MockAIResponse.mock_chat_response()
        mock_chat.return_value = mock_response
        
        chat_data = {
            "message": "Hello, can you help me with my studies?",
            "streaming": False
        }
        
        response = test_client.post("/ai/chat", json=chat_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "think" in data
        assert "answer" in data
        assert "model" in data
        assert data["answer"] == mock_response["answer"]
    
    @patch('app.ai.lm_studio.chat_with_ai')
    def test_ai_chat_with_streaming(self, mock_chat, test_client, db_session):
        """Test AI chat with streaming response"""
        user = create_test_user(db_session)
        headers = get_auth_headers(test_client)
        
        # Mock streaming response
        async def mock_streaming_response():
            yield "chunk1"
            yield "chunk2"
            yield "chunk3"
        
        mock_chat.return_value = mock_streaming_response()
        
        chat_data = {
            "message": "Explain machine learning",
            "streaming": True
        }
        
        response = test_client.post("/ai/chat-stream", json=chat_data, headers=headers)
        
        assert response.status_code == 200
        # For streaming, we expect a streaming response
        assert response.headers.get("content-type") == "text/plain; charset=utf-8"
    
    def test_ai_chat_unauthorized(self, test_client):
        """Test AI chat without authentication"""
        chat_data = {
            "message": "Hello",
            "streaming": False
        }
        
        response = test_client.post("/ai/chat", json=chat_data)
        
        assert response.status_code == 401
    
    @patch('app.ai.lm_studio.chat_with_ai')
    def test_ai_chat_empty_message(self, mock_chat, test_client, db_session):
        """Test AI chat with empty message"""
        user = create_test_user(db_session)
        headers = get_auth_headers(test_client)
        
        chat_data = {
            "message": "",
            "streaming": False
        }
        
        response = test_client.post("/ai/chat", json=chat_data, headers=headers)
        
        assert response.status_code == 422  # Validation error
    
    @patch('app.ai.lm_studio.get_available_models')
    def test_get_available_models(self, mock_models, test_client, db_session):
        """Test getting available AI models"""
        user = create_test_user(db_session)
        headers = get_auth_headers(test_client)
        
        mock_models.return_value = [
            {"id": "model1", "name": "Test Model 1"},
            {"id": "model2", "name": "Test Model 2"}
        ]
        
        response = test_client.get("/ai/models", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["id"] == "model1"
    
    @patch('app.ai.lm_studio.check_lm_studio_status')
    def test_ai_status_check(self, mock_status, test_client, db_session):
        """Test AI service status check"""
        user = create_test_user(db_session)
        headers = get_auth_headers(test_client)
        
        mock_status.return_value = {
            "status": "healthy",
            "model_loaded": True,
            "base_url": "http://127.0.0.1:1234/v1"
        }
        
        response = test_client.get("/ai/status", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["model_loaded"] == True

class TestAIAnalysis:
    """Test AI Analysis features"""
    
    @patch('app.ai.lm_studio.analyze_entry_content')
    def test_analyze_entry_general(self, mock_analyze, test_client, db_session):
        """Test general entry analysis"""
        user = create_test_user(db_session)
        topic = create_test_topic(db_session, user.user_id)
        entry = create_test_entry(db_session, user.user_id, topic.topic_id, "Entry to Analyze")
        headers = get_auth_headers(test_client)
        
        # Mock analysis response
        mock_response = MockAIResponse.mock_analysis_response()
        mock_analyze.return_value = mock_response
        
        analysis_data = {
            "entry_id": entry.entry_id,
            "analysis_type": "general"
        }
        
        response = test_client.post("/ai/analyze-entry", json=analysis_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["entry_id"] == entry.entry_id
        assert data["analysis_type"] == "general"
        assert "think" in data
        assert "answer" in data
        assert data["answer"] == mock_response["answer"]
    
    @patch('app.ai.lm_studio.analyze_entry_content')
    def test_analyze_entry_mood(self, mock_analyze, test_client, db_session):
        """Test mood analysis of entry"""
        user = create_test_user(db_session)
        topic = create_test_topic(db_session, user.user_id)
        entry = create_test_entry(db_session, user.user_id, topic.topic_id)
        headers = get_auth_headers(test_client)
        
        mock_response = {
            "think": "Analyzing mood from the content...",
            "answer": "The entry shows a positive mood with enthusiasm for learning.",
            "analysis_type": "mood",
            "mood_score": 0.8
        }
        mock_analyze.return_value = mock_response
        
        analysis_data = {
            "entry_id": entry.entry_id,
            "analysis_type": "mood"
        }
        
        response = test_client.post("/ai/analyze-entry", json=analysis_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["analysis_type"] == "mood"
        assert "mood_score" in data
    
    @patch('app.ai.lm_studio.analyze_entry_content')
    def test_analyze_entry_summary(self, mock_analyze, test_client, db_session):
        """Test entry content summary"""
        user = create_test_user(db_session)
        topic = create_test_topic(db_session, user.user_id)
        entry = create_test_entry(db_session, user.user_id, topic.topic_id)
        headers = get_auth_headers(test_client)
        
        mock_response = {
            "think": "Summarizing the key points...",
            "answer": "Key points: 1) Learning progress, 2) Challenges faced, 3) Next steps",
            "analysis_type": "summary",
            "key_points": ["Learning progress", "Challenges faced", "Next steps"]
        }
        mock_analyze.return_value = mock_response
        
        analysis_data = {
            "entry_id": entry.entry_id,
            "analysis_type": "summary"
        }
        
        response = test_client.post("/ai/analyze-entry", json=analysis_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["analysis_type"] == "summary"
        assert "key_points" in data
    
    def test_analyze_nonexistent_entry(self, test_client, db_session):
        """Test analyzing non-existent entry"""
        user = create_test_user(db_session)
        headers = get_auth_headers(test_client)
        
        analysis_data = {
            "entry_id": 99999,  # Non-existent entry
            "analysis_type": "general"
        }
        
        response = test_client.post("/ai/analyze-entry", json=analysis_data, headers=headers)
        
        assert response.status_code == 404

class TestAIWritingEnhancement:
    """Test AI Writing Enhancement features"""
    
    @patch('app.ai.lm_studio.improve_writing')
    def test_improve_writing_grammar(self, mock_improve, test_client, db_session):
        """Test grammar improvement"""
        user = create_test_user(db_session)
        headers = get_auth_headers(test_client)
        
        mock_response = {
            "original_text": "This are a test sentence with error.",
            "improved_text": "This is a test sentence without errors.",
            "improvement_type": "grammar",
            "changes_made": ["are -> is", "error -> errors"]
        }
        mock_improve.return_value = mock_response
        
        writing_data = {
            "text": "This are a test sentence with error.",
            "improvement_type": "grammar"
        }
        
        response = test_client.post("/ai/improve-writing", json=writing_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["improvement_type"] == "grammar"
        assert data["improved_text"] == mock_response["improved_text"]
        assert "changes_made" in data
    
    @patch('app.ai.lm_studio.improve_writing')
    def test_improve_writing_style(self, mock_improve, test_client, db_session):
        """Test style improvement"""
        user = create_test_user(db_session)
        headers = get_auth_headers(test_client)
        
        mock_response = {
            "original_text": "I learned stuff today.",
            "improved_text": "Today, I gained valuable insights and expanded my knowledge significantly.",
            "improvement_type": "style",
            "style_improvements": ["More descriptive language", "Better flow"]
        }
        mock_improve.return_value = mock_response
        
        writing_data = {
            "text": "I learned stuff today.",
            "improvement_type": "style"
        }
        
        response = test_client.post("/ai/improve-writing", json=writing_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["improvement_type"] == "style"
        assert "style_improvements" in data
    
    @patch('app.ai.lm_studio.generate_writing_suggestions')
    def test_generate_writing_suggestions(self, mock_suggestions, test_client, db_session):
        """Test generating writing suggestions"""
        user = create_test_user(db_session)
        headers = get_auth_headers(test_client)
        
        mock_response = {
            "suggestions": [
                "Add more specific examples",
                "Include personal reflections",
                "Consider the learning outcomes"
            ],
            "focus_areas": ["clarity", "depth", "personal connection"]
        }
        mock_suggestions.return_value = mock_response
        
        suggestion_data = {
            "text": "Today I studied programming."
        }
        
        response = test_client.post("/ai/writing-suggestions", json=suggestion_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data
        assert "focus_areas" in data
        assert len(data["suggestions"]) >= 1
    
    @patch('app.ai.lm_studio.generate_prompts')
    def test_generate_journaling_prompts(self, mock_prompts, test_client, db_session):
        """Test generating journaling prompts"""
        user = create_test_user(db_session)
        topic = create_test_topic(db_session, user.user_id, "Learning")
        headers = get_auth_headers(test_client)
        
        mock_response = {
            "prompts": [
                "What was the most challenging concept you learned today?",
                "How did today's learning connect to your previous knowledge?",
                "What questions do you still have about today's topic?"
            ],
            "topic": "Learning",
            "prompt_type": "reflection"
        }
        mock_prompts.return_value = mock_response
        
        prompt_data = {
            "topic_id": topic.topic_id,
            "prompt_type": "reflection",
            "count": 3
        }
        
        response = test_client.post("/ai/generate-prompts", json=prompt_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "prompts" in data
        assert len(data["prompts"]) == 3
        assert data["topic"] == "Learning"
