import os
import logging
from typing import Optional, List, Dict, Any
import httpx
import json
import re
from pydantic import BaseModel
from dotenv import load_dotenv
import asyncio

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


class ParsedAIResponse(BaseModel):
    """Structure for parsed AI response with think and answer sections"""
    think: Optional[str] = None
    answer: str
    raw_content: str


def parse_ai_response(content: str) -> ParsedAIResponse:
    """
    Parse AI response to separate think and answer sections
    
    Args:
        content: Raw AI response content
        
    Returns:
        ParsedAIResponse: Structured response with think and answer sections
    """
    # Pattern to match <think>...</think> sections
    think_pattern = r'<think>\s*(.*?)\s*</think>'
    
    # Find think section
    think_match = re.search(think_pattern, content, re.DOTALL | re.IGNORECASE)
    
    if think_match:
        think_content = think_match.group(1).strip()
        # Remove the think section from the content to get the answer
        answer_content = re.sub(think_pattern, '', content, flags=re.DOTALL | re.IGNORECASE).strip()
    else:
        think_content = None
        answer_content = content.strip()
    
    return ParsedAIResponse(
        think=think_content,
        answer=answer_content,
        raw_content=content
    )


async def query_lm_studio(request: AIRequest, max_retries: int = 3) -> AIResponse:
    """
    Query LM Studio with retry logic
    """
    retry_count = 0
    last_error = None
    
    while retry_count < max_retries:
        try:
            response = await _query_lm_studio_internal(request)
            return response
        except Exception as e:
            last_error = e
            if "Client disconnected" in str(e):
                logger.warning(f"LM Studio disconnected (attempt {retry_count + 1}/{max_retries}), retrying...")
                retry_count += 1
                await asyncio.sleep(1)  # Wait 1 second before retry
            else:
                raise e
    
    raise last_error


async def analyze_journal_entry(
    entry_title: str, 
    entry_content: str, 
    analysis_type: str = "general", 
    model: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyze a journal entry using the AI model.
    
    Args:
        entry_title: The title of the journal entry
        entry_content: The content of the journal entry
        analysis_type: Type of analysis to perform: general, mood, summary
        model: Optional model override
        
    Returns:
        Dict: Analysis result with think, answer, and raw content
    """
    # Define system prompts based on analysis type
    system_prompts = {
        "general": """Analyze this journal entry briefly. Focus on key themes and main points.
                     Keep your response under 200 words.""",
                      
        "mood": """Analyze the writer's mood and emotional state in 3-5 sentences.
                   Focus only on emotions and mood.""",
                   
        "summary": """Summarize the main points in 3-4 sentences.
                     Focus on key events and emotions only.""",
                      
        "insights": """Provide 2-3 key insights about the writer's thoughts or patterns.
                      Keep it brief and focused."""
    }
    
    # Define max tokens for each analysis type
    max_tokens_map = {
        "general": 800,
        "mood": 800,
        "summary": 600,
        "insights": 700
    }
    
    # Get appropriate prompt and max tokens
    system_prompt = system_prompts.get(analysis_type, system_prompts["general"])
    max_tokens = max_tokens_map.get(analysis_type, 800)
    
    # Prepare messages for the AI
    messages = [
        AIMessage(role="system", content=system_prompt),
        AIMessage(
            role="user", 
            content=f"Journal title: {entry_title}\n\nJournal content:\n{entry_content}"
        )
    ]
    
    # Create request
    request = AIRequest(
        messages=messages,
        model=model,
        temperature=0.7,
        max_tokens=max_tokens
    )
    
    try:
        # Query the AI with retry logic
        response = await query_lm_studio(request)
        
        # Parse the response to separate think and answer
        parsed_response = parse_ai_response(response.content)
        
        return {
            "think": parsed_response.think,
            "answer": parsed_response.answer,
            "raw_content": parsed_response.raw_content,
            "analysis_type": analysis_type
        }
    except Exception as e:
        logger.error(f"Error analyzing journal entry: {e}")
        error_msg = str(e)
        if "Client disconnected" in error_msg:
            error_msg = "Analysis took too long. Try a shorter entry or different analysis type."
        
        return {
            "think": None,
            "answer": error_msg,
            "raw_content": error_msg,
            "analysis_type": analysis_type
        }


async def improve_writing(
    text: str,
    improvement_type: str = "grammar",
    model: Optional[str] = None
) -> Dict[str, Any]:
    """
    Improve the writing quality of English text.
    
    Args:
        text: The English text to improve
        improvement_type: Type of improvement: grammar, style, vocabulary, complete
        model: Optional model override
        
    Returns:
        Dict: Improved text with think, answer, and raw content
    """
    # Define system prompts for different improvement types
    system_prompts = {
        "grammar": """You are an expert English grammar editor. Your task is to correct grammar mistakes, fix punctuation, and ensure proper sentence structure while preserving the original meaning and tone. Only make necessary corrections without changing the writing style.""",
        
        "style": """You are a professional writing coach. Improve the writing style to make it more engaging, clear, and natural. Enhance sentence flow, vary sentence length, and improve transitions while maintaining the author's voice and message.""",
        
        "vocabulary": """You are an English vocabulary specialist. Replace basic or repetitive words with more sophisticated, precise vocabulary. Improve word choice to make the writing more expressive and eloquent while keeping it natural and accessible.""",
        
        "complete": """You are a comprehensive writing editor. Improve this English text by:
1. Correcting grammar, spelling, and punctuation errors
2. Enhancing vocabulary with more precise and varied word choices
3. Improving sentence structure and flow
4. Making the writing more engaging and polished
5. Ensuring clarity and coherence

Maintain the original meaning, tone, and personal voice while making it significantly better."""
    }
    
    # Get appropriate prompt
    system_prompt = system_prompts.get(improvement_type, system_prompts["complete"])
    
    # Prepare messages
    messages = [
        AIMessage(role="system", content=system_prompt),
        AIMessage(role="user", content=f"Please improve this text:\n\n{text}")
    ]
    
    # Create request
    request = AIRequest(
        messages=messages,
        model=model,
        temperature=0.3,  # Lower temperature for more consistent improvements
        max_tokens=1500
    )
    
    try:
        # Query the AI
        response = await query_lm_studio(request)
        
        # Parse the response to separate think and answer
        parsed_response = parse_ai_response(response.content)
        
        return {
            "think": parsed_response.think,
            "answer": parsed_response.answer,
            "raw_content": parsed_response.raw_content,
            "improvement_type": improvement_type,
            "original_text": text
        }
    except Exception as e:
        logger.error(f"Error improving writing: {e}")
        return {
            "think": None,
            "answer": f"Error improving text: {str(e)}",
            "raw_content": f"Error improving text: {str(e)}",
            "improvement_type": improvement_type,
            "original_text": text
        }


async def suggest_writing_improvements(
    text: str,
    model: Optional[str] = None
) -> Dict[str, Any]:
    """
    Provide detailed writing improvement suggestions for English text.
    
    Args:
        text: The English text to analyze
        model: Optional model override
        
    Returns:
        Dict containing different types of suggestions with think and answer sections
    """
    system_prompt = """You are an expert English writing tutor. Analyze the provided text and give specific, actionable feedback in these categories:

1. Grammar & Mechanics: Point out specific grammar errors, punctuation issues, or spelling mistakes
2. Vocabulary & Word Choice: Suggest better word choices or identify repetitive/weak words
3. Style & Flow: Comment on sentence structure, transitions, and overall readability
4. Content & Clarity: Identify unclear parts or suggest ways to express ideas more effectively

Format your response as:
**Grammar & Mechanics:**
[Your feedback here]

**Vocabulary & Word Choice:**
[Your feedback here]

**Style & Flow:**
[Your feedback here]

**Content & Clarity:**
[Your feedback here]

Be specific and constructive in your feedback."""
    
    messages = [
        AIMessage(role="system", content=system_prompt),
        AIMessage(role="user", content=f"Please analyze and provide improvement suggestions for this text:\n\n{text}")
    ]
    
    request = AIRequest(
        messages=messages,
        model=model,
        temperature=0.4,
        max_tokens=1000
    )
    
    try:
        response = await query_lm_studio(request)
        
        # Parse the response to separate think and answer
        parsed_response = parse_ai_response(response.content)
        
        return {
            "think": parsed_response.think,
            "answer": parsed_response.answer,
            "raw_content": parsed_response.raw_content,
            "original_text": text
        }
    except Exception as e:
        logger.error(f"Error getting writing suggestions: {e}")
        return {
            "think": None,
            "answer": f"Error analyzing text: {str(e)}",
            "raw_content": f"Error analyzing text: {str(e)}",
            "original_text": text
        }


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
    base_content = f"Generate {count} journaling prompts"
    if topic:
        base_content += f" about {topic}"
    if theme:
        base_content += f" with theme {theme}"
    
    # Prepare system message
    system_message = """You are a creative assistant specialized in journaling. 
                       Create engaging, thoughtful and inspiring journaling prompts.
                       Respond with a list of prompts, each prompt on a new line, starting with a bullet point (-)."""
    
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
        return [f"Error generating journaling prompts: {str(e)}"]


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


async def _query_lm_studio_internal(request: AIRequest) -> AIResponse:
    """
    Internal function to send a request to LM Studio API with streaming support
    """
    model = request.model or AI_MODEL
    temperature = request.temperature or DEFAULT_TEMPERATURE
    max_tokens = request.max_tokens or DEFAULT_MAX_TOKENS
    
    # If model is placeholder or invalid, get the first available model
    if model == "your-model-identifier" or not model or model == DEFAULT_AI_MODEL:
        try:
            available_models = await get_available_models()
            if available_models:
                # Use the first available model that's not an embedding model
                for available_model in available_models:
                    if "embedding" not in available_model.lower():
                        model = available_model
                        break
                if not model or model == "your-model-identifier":
                    model = available_models[0]  # Fallback to first model
                logger.info(f"Auto-selected model: {model}")
            else:
                logger.warning("No models available in LM Studio")
        except Exception as e:
            logger.warning(f"Could not get available models: {e}, using configured model: {model}")
    
    # Log request details
    logger.info(f"Querying LM Studio with model: {model}")
    logger.debug(f"Request parameters: temp={temperature}, max_tokens={max_tokens}")
    logger.debug(f"Message count: {len(request.messages)}")
    
    # Prepare request payload
    payload = {
        "model": model,
        "messages": [{"role": msg.role, "content": msg.content} for msg in request.messages],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": True  # Enable streaming for longer responses
    }
    
    # Add tools if provided
    if request.tools:
        payload["tools"] = request.tools
    
    try:
        # Use httpx for async HTTP requests with increased timeout
        async with httpx.AsyncClient(timeout=300.0) as client:  # 5 minutes timeout
            # Call the chat completions endpoint with streaming
            async with client.stream(
                "POST",
                f"{LM_STUDIO_BASE_URL}/chat/completions",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                # Raise exception for error status codes
                response.raise_for_status()
                
                # Initialize variables for collecting streamed response
                full_content = ""
                model_name = model
                usage_info = None
                
                # Process the stream
                async for line in response.aiter_lines():
                    if line.strip():
                        try:
                            # Remove "data: " prefix if present
                            if line.startswith("data: "):
                                line = line[6:]
                            
                            # Skip [DONE] message
                            if line.strip() == "[DONE]":
                                continue
                                
                            # Parse the JSON data
                            try:
                                chunk_data = json.loads(line)
                                
                                # Extract content from the chunk
                                if "choices" in chunk_data and chunk_data["choices"]:
                                    choice = chunk_data["choices"][0]
                                    if "delta" in choice and "content" in choice["delta"]:
                                        content = choice["delta"]["content"]
                                        full_content += content
                                        logger.debug(f"Received content chunk: {content}")
                                    
                                    # Update model name if available
                                    if "model" in chunk_data:
                                        model_name = chunk_data["model"]
                                    
                                    # Update usage information if available
                                    if "usage" in chunk_data:
                                        usage_info = chunk_data["usage"]
                                        
                            except json.JSONDecodeError as je:
                                logger.warning(f"Invalid JSON in chunk: {line}")
                                continue
                                
                        except Exception as e:
                            logger.warning(f"Error processing chunk: {e}")
                            continue
                
                logger.info(f"Completed streaming. Total content length: {len(full_content)}")
                
                if not full_content:
                    raise ValueError("No content received from the stream")
                
                # Create response object with collected data
                ai_response = AIResponse(
                    content=full_content,
                    model=model_name,
                    usage=usage_info,
                    tokens_per_second=None,  # Not available in streaming mode
                    time_to_first_token=None,  # Not available in streaming mode
                    tool_calls=None  # Tool calls not supported in streaming mode
                )
                
                return ai_response
                
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error when querying LM Studio API: {e}")
        raise
    except httpx.RequestError as e:
        logger.error(f"Network error when querying LM Studio API: {e}")
        raise
    except Exception as e:
        logger.error(f"Error querying LM Studio API: {e}")
        raise
