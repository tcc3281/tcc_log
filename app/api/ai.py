from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from .. import models, schemas
from ..api.dependencies import get_db
from ..api.auth import get_current_active_user
from ..ai import lm_studio

# Define response models for AI endpoints
class EntryAnalysisRequest(BaseModel):
    entry_id: int
    analysis_type: str = "general"  # general, mood, summary, insights
    model: Optional[str] = None  # Optional model selection

class EntryAnalysisResponse(BaseModel):
    entry_id: int
    title: str
    think: Optional[str] = None
    answer: str
    raw_content: str
    analysis_type: str
    model: Optional[str] = None  # Added to show which model was used

class PromptsRequest(BaseModel):
    topic: Optional[str] = ""
    theme: Optional[str] = ""
    count: int = 5

class PromptsResponse(BaseModel):
    prompts: List[str]

class AIStatusResponse(BaseModel):
    status: str
    message: str
    base_url: str
    model_count: Optional[int] = None
    sample_model: Optional[str] = None

class ModelListResponse(BaseModel):
    models: List[str]

class WritingImprovementRequest(BaseModel):
    text: str
    improvement_type: str = "complete"  # grammar, style, vocabulary, complete

class WritingImprovementResponse(BaseModel):
    original_text: str
    think: Optional[str] = None
    improved_text: str
    raw_content: str
    improvement_type: str

class WritingSuggestionsRequest(BaseModel):
    text: str

class WritingSuggestionsResponse(BaseModel):
    original_text: str
    think: Optional[str] = None
    suggestions: str
    raw_content: str

# Create router
router = APIRouter(tags=["ai"])

# Check AI service status
@router.get("/status", response_model=AIStatusResponse)
async def check_ai_status():
    """Check if the AI service is available"""
    try:
        status = await lm_studio.check_ai_service()
        return status
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error checking AI service: {str(e)}",
            "base_url": lm_studio.LM_STUDIO_BASE_URL
        }

# List available models
@router.get("/models", response_model=ModelListResponse)
async def list_models():
    """Get list of available AI models"""
    try:
        models = await lm_studio.get_available_models()
        return {"models": models}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching models: {str(e)}"
        )

# Analyze a journal entry
@router.post("/analyze-entry", response_model=EntryAnalysisResponse)
async def analyze_entry(
    request: EntryAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Analyze a journal entry using AI"""
    # Get entry from database
    entry = db.query(models.Entry).filter(
        models.Entry.entry_id == request.entry_id,
        models.Entry.user_id == current_user.user_id
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found or unauthorized"
        )
    
    # Validate analysis type
    valid_types = ["general", "mood", "summary", "insights"]
    if request.analysis_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid analysis type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Perform analysis
    try:
        analysis_result = await lm_studio.analyze_journal_entry(
            entry_title=entry.title,
            entry_content=entry.content or "",
            analysis_type=request.analysis_type,
            model=request.model
        )
        
        return {
            "entry_id": entry.entry_id,
            "title": entry.title,
            "think": analysis_result.get("think"),
            "answer": analysis_result.get("answer"),
            "raw_content": analysis_result.get("raw_content"),
            "analysis_type": request.analysis_type,
            "model": analysis_result.get("model")  # Return the model used
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing entry: {str(e)}"
        )

# Generate journaling prompts
@router.post("/generate-prompts", response_model=PromptsResponse)
async def generate_prompts(
    request: PromptsRequest,
    current_user: models.User = Depends(get_current_active_user)
):
    """Generate journaling prompts using AI"""
    try:
        # Validate count
        if request.count < 1 or request.count > 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Count must be between 1 and 10"
            )
        
        prompts = await lm_studio.generate_journaling_prompts(
            topic=request.topic,
            theme=request.theme,
            count=request.count
        )
        
        return {"prompts": prompts}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating prompts: {str(e)}"
        )

# Improve writing quality
@router.post("/improve-writing", response_model=WritingImprovementResponse)
async def improve_writing(
    request: WritingImprovementRequest,
    current_user: models.User = Depends(get_current_active_user)
):
    """Improve English writing quality with grammar, style, and vocabulary enhancements"""
    try:
        # Validate improvement type
        valid_types = ["grammar", "style", "vocabulary", "complete"]
        if request.improvement_type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid improvement type. Must be one of: {', '.join(valid_types)}"
            )
        
        # Validate text length
        if len(request.text.strip()) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text must be at least 10 characters long"
            )
        
        if len(request.text) > 5000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text must be less than 5000 characters"
            )
        
        improvement_result = await lm_studio.improve_writing(
            text=request.text,
            improvement_type=request.improvement_type
        )
        
        return {
            "original_text": request.text,
            "think": improvement_result.get("think"),
            "improved_text": improvement_result.get("answer"),
            "raw_content": improvement_result.get("raw_content"),
            "improvement_type": request.improvement_type
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error improving writing: {str(e)}"
        )

# Get writing suggestions
@router.post("/writing-suggestions", response_model=WritingSuggestionsResponse)
async def get_writing_suggestions(
    request: WritingSuggestionsRequest,
    current_user: models.User = Depends(get_current_active_user)
):
    """Get detailed writing improvement suggestions for English text"""
    try:
        # Validate text length
        if len(request.text.strip()) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text must be at least 10 characters long"
            )
        
        if len(request.text) > 5000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text must be less than 5000 characters"
            )
        
        suggestions_result = await lm_studio.suggest_writing_improvements(
            text=request.text
        )
        
        return {
            "original_text": request.text,
            "think": suggestions_result.get("think"),
            "suggestions": suggestions_result.get("answer"),
            "raw_content": suggestions_result.get("raw_content")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting writing suggestions: {str(e)}"
        )
