from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
import json

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
    model: Optional[str] = None

class WritingSuggestionsResponse(BaseModel):
    original_text: str
    think: Optional[str] = None
    suggestions: str
    raw_content: str

# Chat-related models
class ChatMessage(BaseModel):
    role: str  # "user", "assistant", or "system"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = None
    model: Optional[str] = None
    system_prompt: Optional[str] = None
    stream: bool = False  # Enable streaming

class ChatResponse(BaseModel):
    content: str
    model: Optional[str] = None

class ChatStreamData(BaseModel):
    type: str  # "chunk", "thinking", "answer", "done", "error"
    content: str
    chunk_id: Optional[int] = None

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

# Chat with AI
@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: models.User = Depends(get_current_active_user)
):
    """Chat with the AI assistant"""
    try:
        # Validate message
        if not request.message or len(request.message.strip()) < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message cannot be empty"
            )
        
        # Convert history to the format expected by lm_studio
        history = None
        if request.history:
            history = [
                {"role": msg.role, "content": msg.content} 
                for msg in request.history
            ]
        
        # Process chat message
        async for response in lm_studio.chat_with_ai(
            message=request.message,
            history=history,
            model=request.model,
            system_prompt=request.system_prompt,
            streaming=False
        ):
            return response
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat: {str(e)}"
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
            text=request.text,
            model=request.model
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
        import traceback
        print(f"Error getting writing suggestions: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting writing suggestions: {str(e)}"
        )

# Streaming chat endpoint
@router.post("/chat-stream")
async def chat_with_ai_stream(
    request: ChatRequest,
    current_user: models.User = Depends(get_current_active_user)
):
    """Stream chat response with AI, supporting think/answer separation"""
    try:
        # Validate message
        if not request.message.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message cannot be empty"
            )
        
        if len(request.message) > 2000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message must be less than 2000 characters"
            )
            
        # Prepare message history
        history = []
        if request.history:
            history = [
                {"role": msg.role, "content": msg.content} 
                for msg in request.history
            ]
        
        async def generate_stream():
            try:
                chunk_id = 0
                thinking_content = ""
                answer_content = ""
                current_section = "answer"  # "thinking" or "answer"
                in_think_tags = False
                sent_data = []  # Track data sent to client for later reference
                content_buffer = ""  # Buffer to detect and remove stats from content
                
                async for chunk in lm_studio.chat_with_ai(
                    message=request.message,
                    history=history,
                    model=request.model,
                    system_prompt=request.system_prompt,
                    streaming=True
                ):
                    chunk_id += 1
                    
                    # Check if the chunk is a stats message (JSON string)
                    if isinstance(chunk, str) and chunk.startswith('{"type":'):
                        try:
                            # Parse the JSON stats and forward them to the client
                            stats_data = json.loads(chunk)
                            # Add the chunk_id for consistency
                            stats_data["chunk_id"] = chunk_id
                            sent_data.append(stats_data)  # Store for later reference
                            yield f"data: {json.dumps(stats_data)}\n\n"
                            continue  # Skip the rest of the processing for this chunk
                        except json.JSONDecodeError:
                            # If it's not valid JSON, treat it as regular content
                            pass
                    
                    # Process regular content
                    content = chunk  # chunk is already a string from chat_with_ai
                    
                    # Check if the content contains a stats JSON object at the end
                    stats_index = content.find('{"type":"stats"')
                    if stats_index != -1:
                        # Extract the stats portion
                        stats_part = content[stats_index:]
                        # Keep only the content portion
                        content = content[:stats_index]
                        
                        try:
                            # Parse the stats JSON
                            stats_data = json.loads(stats_part)
                            # Add the chunk_id for consistency
                            stats_data["chunk_id"] = chunk_id
                            sent_data.append(stats_data)  # Store for later reference
                            # Send the stats separately
                            yield f"data: {json.dumps(stats_data)}\n\n"
                        except json.JSONDecodeError:
                            # If it's not valid JSON, just ignore
                            pass
                    
                    # Add to buffer to check for stats that might be split across chunks
                    content_buffer += content
                    # Check if the buffer now contains stats
                    stats_index = content_buffer.find('{"type":"stats"')
                    if stats_index != -1:
                        # Use regex to find the complete JSON object
                        import re
                        stats_match = re.search(r'(\{"type":"stats".*?\})', content_buffer[stats_index:])
                        if stats_match:
                            stats_str = stats_match.group(1)
                            try:
                                # Parse the stats JSON
                                stats_data = json.loads(stats_str)
                                # Add the chunk_id for consistency
                                stats_data["chunk_id"] = chunk_id
                                sent_data.append(stats_data)  # Store for later reference
                                
                                # Remove the stats from the buffer
                                content_buffer = content_buffer[:stats_index] + content_buffer[stats_index + len(stats_str):]
                                
                                # Send the stats separately
                                yield f"data: {json.dumps(stats_data)}\n\n"
                                
                                # Update content to be the cleaned buffer
                                content = content_buffer
                                # Clear buffer after processing
                                content_buffer = ""
                            except json.JSONDecodeError:
                                # If it's not valid JSON, keep processing
                                pass
                    
                    # Parse thinking tags
                    if "<think>" in content and not in_think_tags:
                        in_think_tags = True
                        current_section = "thinking"
                        # Send any content before <think> as answer
                        before_think = content.split("<think>")[0]
                        if before_think.strip():
                            answer_content += before_think
                            data = {
                                "type": "answer",
                                "content": before_think,
                                "chunk_id": chunk_id
                            }
                            sent_data.append(data)
                            yield f"data: {json.dumps(data)}\n\n"
                        
                        # Start thinking section
                        thinking_part = content.split("<think>", 1)[1] if "<think>" in content else ""
                        if "</think>" in thinking_part:
                            # Complete thinking in one chunk
                            think_content = thinking_part.split("</think>")[0]
                            thinking_content += think_content
                            data = {
                                "type": "thinking",
                                "content": think_content,
                                "chunk_id": chunk_id
                            }
                            sent_data.append(data)
                            yield f"data: {json.dumps(data)}\n\n"
                            
                            # Continue with answer after </think>
                            after_think = thinking_part.split("</think>", 1)[1] if "</think>" in thinking_part else ""
                            if after_think.strip():
                                answer_content += after_think
                                data = {
                                    "type": "answer", 
                                    "content": after_think,
                                    "chunk_id": chunk_id
                                }
                                sent_data.append(data)
                                yield f"data: {json.dumps(data)}\n\n"
                            in_think_tags = False
                            current_section = "answer"
                        else:
                            # Partial thinking content
                            thinking_content += thinking_part
                            data = {
                                "type": "thinking",
                                "content": thinking_part,
                                "chunk_id": chunk_id
                            }
                            sent_data.append(data)
                            yield f"data: {json.dumps(data)}\n\n"
                    elif "</think>" in content and in_think_tags:
                        # End of thinking section
                        think_part = content.split("</think>")[0]
                        thinking_content += think_part
                        data = {
                            "type": "thinking",
                            "content": think_part,
                            "chunk_id": chunk_id
                        }
                        sent_data.append(data)
                        yield f"data: {json.dumps(data)}\n\n"
                        
                        # Continue with answer
                        after_think = content.split("</think>", 1)[1] if "</think>" in content else ""
                        if after_think.strip():
                            answer_content += after_think
                            data = {
                                "type": "answer",
                                "content": after_think,
                                "chunk_id": chunk_id
                            }
                            sent_data.append(data)
                            yield f"data: {json.dumps(data)}\n\n"
                        in_think_tags = False
                        current_section = "answer"
                    elif in_think_tags:
                        # Inside thinking section
                        thinking_content += content
                        data = {
                            "type": "thinking",
                            "content": content,
                            "chunk_id": chunk_id
                        }
                        sent_data.append(data)
                        yield f"data: {json.dumps(data)}\n\n"
                    else:
                        # Regular answer content
                        answer_content += content
                        data = {
                            "type": "answer",
                            "content": content,
                            "chunk_id": chunk_id
                        }
                        sent_data.append(data)
                        yield f"data: {json.dumps(data)}\n\n"
                
                # Send completion signal with any stats collected
                inference_time = None
                tokens_per_second = None
                
                # Check if we have any stats data to include with the "done" event
                for chunk_data in reversed(sent_data):
                    if chunk_data.get("type") == "stats":
                        inference_time = chunk_data.get("inference_time")
                        tokens_per_second = chunk_data.get("tokens_per_second")
                        break
                
                data = {
                    "type": "done",
                    "content": "",
                    "chunk_id": chunk_id + 1,
                    "inference_time": inference_time,
                    "tokens_per_second": tokens_per_second
                }
                yield f"data: {json.dumps(data)}\n\n"
                
            except Exception as e:
                error_data = {
                    "type": "error",
                    "content": str(e),
                    "chunk_id": -1
                }
                yield f"data: {json.dumps(error_data)}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in streaming chat: {str(e)}"
        )
