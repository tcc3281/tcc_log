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

class EntryAnalysisResponse(BaseModel):
    entry_id: int
    title: str
    analysis: str
    analysis_type: str

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
        analysis = await lm_studio.analyze_journal_entry(
            entry_title=entry.title,
            entry_content=entry.content or "",
            analysis_type=request.analysis_type
        )
        
        return {
            "entry_id": entry.entry_id,
            "title": entry.title,
            "analysis": analysis,
            "analysis_type": request.analysis_type
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
