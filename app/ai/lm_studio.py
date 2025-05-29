import os
import logging
from typing import Optional, List, Dict, Any
import httpx
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Default configuration
DEFAULT_LM_STUDIO_BASE_URL = "http://127.0.0.1:1234/v1"
DEFAULT_AI_MODEL = "your-model-identifier"  # Placeholder, will be replaced from env or user input
DEFAULT_MAX_TOKENS = 1000
DEFAULT_TEMPERATURE = 0.7

# Load from environment variables or use defaults
LM_STUDIO_BASE_URL = os.getenv("LM_STUDIO_BASE_URL", DEFAULT_LM_STUDIO_BASE_URL)
AI_MODEL = os.getenv("LM_STUDIO_MODEL", DEFAULT_AI_MODEL)


class AIMessage(BaseModel):
    """Structure for AI message content"""
    role: str  # "system", "user", or "assistant"
    content: str


class AIRequest(BaseModel):
    """Structure for AI request with messages and parameters"""
    messages: List[AIMessage]
    model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    tools: Optional[List[Dict[str, Any]]] = None


class AIResponse(BaseModel):
    """Structure for AI response"""
    content: str
    model: str
    usage: Optional[Dict[str, int]] = None
    tokens_per_second: Optional[float] = None
    time_to_first_token: Optional[float] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None


async def query_lm_studio(request: AIRequest) -> AIResponse:
    """
    Send a request to LM Studio API and return the response.
    
    Args:
        request: The AI request containing messages and parameters
        
    Returns:
        AIResponse: The processed response from the AI model
    """
    model = request.model or AI_MODEL
    temperature = request.temperature or DEFAULT_TEMPERATURE
    max_tokens = request.max_tokens or DEFAULT_MAX_TOKENS
    
    # Log request details
    logger.info(f"Querying LM Studio with model: {model}")
    logger.debug(f"Request parameters: temp={temperature}, max_tokens={max_tokens}")
    logger.debug(f"Message count: {len(request.messages)}")
    
    # Prepare request payload
    payload = {
        "model": model,
        "messages": [{"role": msg.role, "content": msg.content} for msg in request.messages],
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    
    # Add tools if provided
    if request.tools:
        payload["tools"] = request.tools
    
    try:
        # Use httpx for async HTTP requests
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Call the chat completions endpoint
            response = await client.post(
                f"{LM_STUDIO_BASE_URL}/chat/completions",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            # Log response code
            logger.info(f"LM Studio API response status: {response.status_code}")
            
            # Raise exception for error status codes
            response.raise_for_status()
            
            # Parse response
            response_data = response.json()
            
            # Extract required information
            if "choices" in response_data and len(response_data["choices"]) > 0:
                content = response_data["choices"][0]["message"]["content"]
                
                # Extract tool calls if present
                tool_calls = None
                if "tool_calls" in response_data["choices"][0]["message"]:
                    tool_calls = response_data["choices"][0]["message"]["tool_calls"]
                
                # Create response object
                ai_response = AIResponse(
                    content=content,
                    model=response_data.get("model", model),
                    usage=response_data.get("usage"),
                    tokens_per_second=response_data.get("tokens_per_second"),
                    time_to_first_token=response_data.get("time_to_first_token"),
                    tool_calls=tool_calls
                )
                
                return ai_response
            else:
                logger.error(f"Unexpected response format: {response_data}")
                raise ValueError("Unexpected response format from LM Studio API")
                
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error when querying LM Studio API: {e}")
        raise
    except httpx.RequestError as e:
        logger.error(f"Network error when querying LM Studio API: {e}")
        raise
    except Exception as e:
        logger.error(f"Error querying LM Studio API: {e}")
        raise


async def analyze_journal_entry(
    entry_title: str, 
    entry_content: str, 
    analysis_type: str = "general", 
    model: Optional[str] = None
) -> str:
    """
    Analyze a journal entry using the AI model.
    
    Args:
        entry_title: The title of the journal entry
        entry_content: The content of the journal entry
        analysis_type: Type of analysis to perform: general, mood, summary
        model: Optional model override
        
    Returns:
        str: Analysis result
    """
    # Define system prompts based on analysis type
    system_prompts = {
        "general": """Bạn là một trợ lý AI phân tích nhật ký. Hãy phân tích nội dung nhật ký được cung cấp và 
                      đưa ra những nhận xét về tâm trạng, chủ đề chính, và những điểm đáng chú ý trong bài viết.
                      Hãy trả lời bằng tiếng Việt một cách tự nhiên và thấu cảm.""",
                      
        "mood": """Dựa trên nội dung nhật ký được cung cấp, hãy phân tích tâm trạng của người viết.
                   Chỉ tập trung vào cảm xúc và tâm trạng, không đi sâu vào nội dung. 
                   Hãy trả lời bằng tiếng Việt, ngắn gọn khoảng 3-5 câu.""",
                   
        "summary": """Hãy tóm tắt những điểm chính trong bài nhật ký này. Tập trung vào sự kiện, 
                      suy nghĩ và cảm xúc chính. Hãy trả lời bằng tiếng Việt, tối đa khoảng 5-7 câu.""",
                      
        "insights": """Phân tích nhật ký và đưa ra những hiểu biết sâu sắc về người viết, 
                       những mẫu hành vi hoặc suy nghĩ tiềm ẩn, và đề xuất điều người viết có thể 
                       học hỏi từ trải nghiệm này. Hãy trả lời bằng tiếng Việt."""
    }
    
    # Get appropriate prompt or use default
    system_prompt = system_prompts.get(analysis_type, system_prompts["general"])
    
    # Prepare messages for the AI
    messages = [
        AIMessage(role="system", content=system_prompt),
        AIMessage(
            role="user", 
            content=f"Tiêu đề nhật ký: {entry_title}\n\nNội dung nhật ký:\n{entry_content}"
        )
    ]
    
    # Create request
    request = AIRequest(
        messages=messages,
        model=model,
        temperature=0.7,
        max_tokens=1000
    )
    
    try:
        # Query the AI
        response = await query_lm_studio(request)
        return response.content
    except Exception as e:
        logger.error(f"Error analyzing journal entry: {e}")
        return f"Lỗi khi phân tích nhật ký: {str(e)}"


async def generate_journaling_prompts(
    topic: str = "",
    theme: str = "",
    count: int = 5,
    model: Optional[str] = None
) -> List[str]:
    """
    Generate journaling prompts using the AI model.
    
    Args:
        topic: Optional topic for the prompts
        theme: Optional theme for the prompts
        count: Number of prompts to generate (default: 5)
        model: Optional model override
        
    Returns:
        List[str]: List of generated prompts
    """
    # Construct base prompt
    base_content = f"Tạo {count} gợi ý chủ đề viết nhật ký"
    if topic:
        base_content += f" về {topic}"
    if theme:
        base_content += f" với chủ đề {theme}"
    
    # Prepare system message
    system_message = """Bạn là một trợ lý sáng tạo chuyên về viết nhật ký. 
                       Hãy tạo các gợi ý viết nhật ký hấp dẫn, sâu sắc và đầy cảm hứng.
                       Trả lời bằng một danh sách các gợi ý, mỗi gợi ý trên một dòng, bắt đầu bằng dấu gạch đầu dòng (-)."""
    
    # Prepare messages for the AI
    messages = [
        AIMessage(role="system", content=system_message),
        AIMessage(role="user", content=f"{base_content}.")
    ]
    
    # Create request
    request = AIRequest(
        messages=messages,
        model=model,
        temperature=0.8,  # Higher temperature for creativity
        max_tokens=500
    )
    
    try:
        # Query the AI
        response = await query_lm_studio(request)
        
        # Process response - extract bullet points
        content = response.content
        
        # Split by newlines and extract bullet points
        lines = content.split('\n')
        prompts = [line.strip()[2:].strip() if line.strip().startswith('-') else line.strip() 
                   for line in lines if line.strip()]
        
        # Filter out any non-prompt text
        prompts = [p for p in prompts if len(p) >= 10]  # Only keep substantive prompts
        
        # Limit to requested count
        return prompts[:count]
    except Exception as e:
        logger.error(f"Error generating journaling prompts: {e}")
        return [f"Lỗi khi tạo gợi ý viết nhật ký: {str(e)}"]


async def get_available_models() -> List[str]:
    """
    Get list of available models from LM Studio
    
    Returns:
        List[str]: List of model IDs
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{LM_STUDIO_BASE_URL}/models")
            response.raise_for_status()
            
            models_data = response.json()
            model_ids = [model["id"] for model in models_data.get("data", [])]
            
            return model_ids
    except Exception as e:
        logger.error(f"Error fetching available models: {e}")
        return []


async def check_ai_service() -> Dict[str, Any]:
    """
    Check if LM Studio API is available and return status details
    
    Returns:
        Dict containing service status information
    """
    try:
        # Check models endpoint as a basic health check
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{LM_STUDIO_BASE_URL}/models")
            
            if response.status_code == 200:
                models_data = response.json()
                model_count = len(models_data.get("data", []))
                
                # Get a sample model if available
                sample_model = models_data.get("data", [{}])[0].get("id", "unknown") if model_count > 0 else "none"
                
                return {
                    "status": "available",
                    "message": "LM Studio API is available",
                    "base_url": LM_STUDIO_BASE_URL,
                    "model_count": model_count,
                    "sample_model": sample_model
                }
            else:
                return {
                    "status": "error",
                    "message": f"LM Studio API returned status code {response.status_code}",
                    "base_url": LM_STUDIO_BASE_URL
                }
    except Exception as e:
        return {
            "status": "unavailable",
            "message": f"Could not connect to LM Studio API: {str(e)}",
            "base_url": LM_STUDIO_BASE_URL
        }
