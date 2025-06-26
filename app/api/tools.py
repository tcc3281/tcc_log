from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
import json

from app.ai.lm_studio import chat_with_tools, get_openai_tool_definitions, fetch_wikipedia_content

router = APIRouter()
logger = logging.getLogger(__name__)

class ToolChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = None
    model: Optional[str] = None
    use_tools: bool = True
    streaming: bool = False

class ToolChatResponse(BaseModel):
    content: str
    model: str
    usage: Optional[Dict[str, Any]] = None
    tool_calls_made: int
    tools_used: List[str]
    error: bool = False

class WikipediaRequest(BaseModel):
    search_query: str

class WikipediaResponse(BaseModel):
    status: str
    title: Optional[str] = None
    content: Optional[str] = None
    message: Optional[str] = None

@router.post("/chat-with-tools", response_model=ToolChatResponse)
async def chat_with_tools_endpoint(request: ToolChatRequest):
    """
    Chat with AI using Wikipedia and calculator tools
    """
    try:
        result = await chat_with_tools(
            message=request.message,
            history=request.history,
            model=request.model,
            use_tools=request.use_tools,
            streaming=request.streaming
        )
        
        return ToolChatResponse(
            content=result["content"],
            model=result["model"],
            usage=result.get("usage"),
            tool_calls_made=result.get("tool_calls_made", 0),
            tools_used=result.get("tools_used", []),
            error=result.get("error", False)
        )
        
    except Exception as e:
        logger.error(f"Error in chat with tools: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Chat with tools failed: {str(e)}"
        )

@router.post("/wikipedia", response_model=WikipediaResponse)
async def wikipedia_search(request: WikipediaRequest):
    """
    Search Wikipedia directly
    """
    try:
        result = fetch_wikipedia_content(request.search_query)
        
        return WikipediaResponse(
            status=result["status"],
            title=result.get("title"),
            content=result.get("content"),
            message=result.get("message")
        )
        
    except Exception as e:
        logger.error(f"Error in Wikipedia search: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Wikipedia search failed: {str(e)}"
        )

@router.get("/available-tools")
async def get_available_tools():
    """
    Get list of available tools
    """
    try:
        tools = get_openai_tool_definitions()
        
        return {
            "tools": [
                {
                    "name": tool["function"]["name"],
                    "description": tool["function"]["description"],
                    "parameters": tool["function"]["parameters"]
                }
                for tool in tools
            ],
            "count": len(tools)
        }
        
    except Exception as e:
        logger.error(f"Error getting available tools: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get available tools: {str(e)}"
        )

@router.post("/chat-with-tools-stream")
async def chat_with_tools_stream_endpoint(request: ToolChatRequest):
    """
    Stream chat with AI using Wikipedia and calculator tools
    """
    try:
        async def generate_stream():
            try:
                chunk_id = 0
                
                # For tools, we'll simulate streaming by chunking the final response
                result = await chat_with_tools(
                    message=request.message,
                    history=request.history,
                    model=request.model,
                    use_tools=request.use_tools,
                    streaming=False  # Get complete response first
                )
                
                content = result["content"]
                
                # Stream the content in chunks
                chunk_size = 10
                for i in range(0, len(content), chunk_size):
                    chunk_id += 1
                    chunk_content = content[i:i+chunk_size]
                    
                    data = {
                        "type": "answer",
                        "content": chunk_content,
                        "chunk_id": chunk_id
                    }
                    yield f"data: {json.dumps(data)}\n\n"
                
                # Send completion signal
                data = {
                    "type": "done",
                    "content": "",
                    "chunk_id": chunk_id + 1,
                    "tool_calls_made": result.get("tool_calls_made", 0),
                    "tools_used": result.get("tools_used", [])
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
        
    except Exception as e:
        logger.error(f"Error in streaming chat with tools: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Streaming chat with tools failed: {str(e)}"
        )
