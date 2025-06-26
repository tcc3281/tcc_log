import os
import logging
from typing import Optional, List, Dict, Any, Union
import httpx
import re
from pydantic import BaseModel
from dotenv import load_dotenv
import asyncio


# LangChain imports
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage as LCMessage
from langchain_core.tools import Tool
# Import prompt manager
from .prompt_manager import get_prompt_manager, get_system_prompt

# ANSI color codes for terminal output
COLORS = {
    "RED": "\033[91m",
    "GREEN": "\033[92m",
    "YELLOW": "\033[93m",
    "BLUE": "\033[94m",
    "MAGENTA": "\033[95m",
    "CYAN": "\033[96m",
    "WHITE": "\033[97m",
    "BOLD": "\033[1m",
    "UNDERLINE": "\033[4m",
    "RESET": "\033[0m"
}

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Default configuration
DEFAULT_LM_STUDIO_BASE_URL = "http://127.0.0.1:1234/v1"
DEFAULT_AI_MODEL = "qwen/qwen3-1.7b"
DEFAULT_MAX_TOKENS = 2000
DEFAULT_TEMPERATURE = 0.7
DEFAULT_MAX_INFERENCE_TIME = 60000  # Default 60 seconds in milliseconds

# Load from environment variables or use defaults
LM_STUDIO_BASE_URL = os.getenv("LM_STUDIO_BASE_URL", DEFAULT_LM_STUDIO_BASE_URL)
LM_KEY = os.getenv("LM_STUDIO_API_KEY", "not-needed")  # Not used in LM Studio
AI_MODEL = os.getenv("LM_STUDIO_MODEL", DEFAULT_AI_MODEL)
MAX_INFERENCE_TIME = int(os.getenv("LM_MAX_INFERENCE_TIME", DEFAULT_MAX_INFERENCE_TIME))

# Global ChatOpenAI instance for reuse
_chatopen_ai_instance = None
_available_models_cache = None
_cache_timestamp = 0

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
    usage: Optional[Dict[str, Optional[int]]] = None
    tokens_per_second: Optional[float] = None
    time_to_first_token: Optional[float] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None

class ParsedAIResponse(BaseModel):
    """Structure for parsed AI response with think and answer sections"""
    think: Optional[str] = None
    answer: str
    raw_content: str

# Token limits for different analysis types (moved from SYSTEM_PROMPTS)
ANALYSIS_MAX_TOKENS = {
    "general": 800,
    "mood": 800,
    "summary": 600,
    "insights": 700
}

# Helper function to get system prompts
def get_system_prompts():
    """Get system prompts from prompt manager"""
    return get_prompt_manager().prompts.get("system_prompts", {})

def get_chatopen_ai_instance(model: str = None, temperature: float = None, max_tokens: int = None) -> ChatOpenAI:
    """Get a reusable ChatOpenAI instance"""
    global _chatopen_ai_instance
    
    # Use defaults if not provided
    model = model or AI_MODEL
    temperature = temperature if temperature is not None else DEFAULT_TEMPERATURE
    max_tokens = max_tokens or DEFAULT_MAX_TOKENS
    timeout = MAX_INFERENCE_TIME / 1000
    
    # Create new instance if none exists or parameters changed
    if (_chatopen_ai_instance is None or 
        _chatopen_ai_instance.model_name != model or 
        _chatopen_ai_instance.temperature != temperature or
        _chatopen_ai_instance.max_tokens != max_tokens):
        
        _chatopen_ai_instance = ChatOpenAI(
            base_url=LM_STUDIO_BASE_URL,
            api_key="not-needed",
            model_name=model,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=timeout
        )
    
    return _chatopen_ai_instance

def parse_ai_response(content: str) -> ParsedAIResponse:
    """Parse AI response to separate think and answer sections"""
    logger.debug(f"Parsing AI response - raw content sample: {content[:200]}...")
    
    # Pattern to match <think>...</think> sections
    think_pattern = r'<think>\s*(.*?)\s*</think>'
    
    # Find think section
    think_match = re.search(think_pattern, content, re.DOTALL | re.IGNORECASE)
    
    if think_match:
        think_content = think_match.group(1).strip()
        logger.debug(f"Found think section: {think_content[:50]}...")
        # Remove the think section from the content to get the answer
        answer_content = re.sub(think_pattern, '', content, flags=re.DOTALL | re.IGNORECASE).strip()
    else:
        logger.debug("No think section found in response")
        think_content = None
        answer_content = content.strip()
    
    # Create response object
    parsed_response = ParsedAIResponse(
        think=think_content,
        answer=answer_content,
        raw_content=content
    )
    
    logger.debug(f"Parsed AI response - has think: {think_content is not None}, answer length: {len(answer_content)}")
    
    return parsed_response

async def get_available_models() -> List[str]:
    """Get list of available models from LM Studio with caching"""
    global _available_models_cache, _cache_timestamp
    import time
    
    # Cache for 5 minutes
    current_time = time.time()
    if _available_models_cache is not None and (current_time - _cache_timestamp) < 300:
        return _available_models_cache
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{LM_STUDIO_BASE_URL}/models")
            response.raise_for_status()
            
            models_data = response.json()
            model_ids = [model["id"] for model in models_data.get("data", [])]
            
            # Update cache
            _available_models_cache = model_ids
            _cache_timestamp = current_time
            
            return model_ids
    except Exception as e:
        logger.error(f"Error fetching available models: {e}")
        return []

async def validate_and_get_model(model: Optional[str] = None) -> str:
    """Validate and get the best available model"""
    target_model = model or AI_MODEL
    
    # If model is placeholder or invalid, get the first available model
    if target_model == "your-model-identifier" or not target_model or target_model == DEFAULT_AI_MODEL:
        try:
            available_models = await get_available_models()
            if available_models:
                # Use the first available model that's not an embedding model
                for available_model in available_models:
                    if "embedding" not in available_model.lower():
                        target_model = available_model
                        break
                if not target_model or target_model == "your-model-identifier":
                    target_model = available_models[0]  # Fallback to first model
                logger.info(f"Auto-selected model: {target_model}")
            else:
                logger.warning("No models available in LM Studio")
        except Exception as e:
            logger.warning(f"Could not get available models: {e}, using configured model: {target_model}")
    
    return target_model

async def create_ai_request(
    content: str,
    system_prompt: str,
    model: Optional[str] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
    history: Optional[List[Dict[str, str]]] = None
) -> AIRequest:
    """Create a standardized AI request"""
    messages = [AIMessage(role="system", content=system_prompt)]
    
    # Add conversation history if provided
    if history:
        for msg in history:
            if msg["role"] in ["user", "assistant", "system"]:
                messages.append(AIMessage(role=msg["role"], content=msg["content"]))
    
    # Add current message
    messages.append(AIMessage(role="user", content=content))
    
    return AIRequest(
        messages=messages,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens
    )

async def query_lm_studio_internal(request: AIRequest, timeout: float = None) -> AIResponse:
    """Internal function to send a request to LM Studio API using LangChain"""
    model = await validate_and_get_model(request.model)
    temperature = request.temperature or DEFAULT_TEMPERATURE
    max_tokens = request.max_tokens or DEFAULT_MAX_TOKENS
    
    # If no timeout specified, use the configured max inference time
    if timeout is None:
        timeout = MAX_INFERENCE_TIME / 1000
    
    # Log request details
    logger.info(f"Querying LM Studio with model: {model}")
    logger.debug(f"Request parameters: temp={temperature}, max_tokens={max_tokens}")
    logger.debug(f"Message count: {len(request.messages)}")
    
    # Get LangChain model instance
    llm = get_chatopen_ai_instance(model, temperature, max_tokens)
    
    # Convert our AIMessage objects to LangChain message objects
    langchain_messages = []
    for msg in request.messages:
        if msg.role == "system":
            langchain_messages.append(SystemMessage(content=msg.content))
        elif msg.role == "user":
            langchain_messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            langchain_messages.append(LCMessage(content=msg.content))
    
    try:
        import time
        start_time = time.time()
        
        # Invoke the model
        response = await llm.ainvoke(langchain_messages)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Extract content from LangChain response
        full_content = response.content
        
        # Log a sample of the final content for debugging
        content_sample = full_content[:100] + "..." if len(full_content) > 100 else full_content
        logger.debug(f"Final content sample: {content_sample}")
        
        # Create response object with collected data
        ai_response = AIResponse(
            content=full_content,
            model=model,
            usage=None,  # Not directly available from LangChain
            tokens_per_second=None,
            time_to_first_token=None,
            tool_calls=None
        )
        return ai_response
                
    except Exception as e:
        logger.error(f"Error querying LM Studio API: {e}")
        raise

async def query_lm_studio(request: AIRequest, max_retries: int = 3) -> AIResponse:
    """Query LM Studio with retry logic using LangChain"""
    retry_count = 0
    last_error = None
    
    # Set timeout based on environment configuration - convert from milliseconds to seconds
    timeout = MAX_INFERENCE_TIME / 1000
    logger.debug(f"Using query timeout of {timeout} seconds (from config: {MAX_INFERENCE_TIME}ms)")
    
    while retry_count < max_retries:
        try:
            response = await query_lm_studio_internal(request, timeout=timeout)
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

async def handle_ai_error(e: Exception, task_name: str) -> Dict[str, Any]:
    """Standardized error handling for AI operations"""
    logger.error(f"Error in {task_name}: {e}")
    error_msg = str(e)
    if "Client disconnected" in error_msg:
        error_msg = f"{task_name} took too long. Try a shorter input or different settings."
    
    return {
        "think": None,
        "answer": error_msg,
        "raw_content": error_msg
    }

async def process_ai_request(
    content: str,
    system_prompt: str,
    model: Optional[str] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
    history: Optional[List[Dict[str, str]]] = None,
    task_name: str = "AI request"
) -> Dict[str, Any]:
    """Generic function to process AI requests with standardized error handling"""
    try:
        request = await create_ai_request(
            content=content,
            system_prompt=system_prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            history=history
        )
        
        response = await query_lm_studio(request)
        parsed_response = parse_ai_response(response.content)
        
        return {
            "think": parsed_response.think,
            "answer": parsed_response.answer,
            "raw_content": parsed_response.raw_content
        }
    except Exception as e:
        return await handle_ai_error(e, task_name)

# Streamlined specific functions
async def analyze_journal_entry(
    entry_title: str, 
    entry_content: str, 
    analysis_type: str = "general", 
    model: Optional[str] = None
) -> Dict[str, Any]:
    """Analyze a journal entry using the AI model."""
    system_prompt = get_prompt_manager().get_analysis_prompt(analysis_type)
    max_tokens = ANALYSIS_MAX_TOKENS.get(analysis_type, 800)
    
    content = f"Journal title: {entry_title}\n\nJournal content:\n{entry_content}"
    
    result = await process_ai_request(
        content=content,
        system_prompt=system_prompt,
        model=model,
        temperature=0.7,
        max_tokens=max_tokens,
        task_name="journal analysis"
    )
    
    result["analysis_type"] = analysis_type
    return result

async def improve_writing(
    text: str,
    improvement_type: str = "grammar",
    model: Optional[str] = None
) -> Dict[str, Any]:
    """Improve the writing quality of English text."""
    system_prompt = get_prompt_manager().get_writing_improvement_prompt(improvement_type)
    
    content = f"Please improve this text:\n\n{text}"
    
    result = await process_ai_request(
        content=content,
        system_prompt=system_prompt,
        model=model,
        temperature=0.3,  # Lower temperature for more consistent improvements
        max_tokens=1500,
        task_name="writing improvement"
    )
    
    result["improvement_type"] = improvement_type
    result["original_text"] = text
    return result

async def suggest_writing_improvements(
    text: str,
    model: Optional[str] = None
) -> Dict[str, Any]:
    """Provide detailed writing improvement suggestions for English text."""
    logger.debug(f"suggest_writing_improvements called with model: {model}")
    
    content = f"Please analyze and provide improvement suggestions for this text:\n\n{text}"
    
    result = await process_ai_request(
        content=content,
        system_prompt=get_system_prompt("writing_suggestions"),
        model=model,
        temperature=0.4,
        max_tokens=1000,
        task_name="writing suggestions"
    )
    
    result["original_text"] = text
    return result

async def generate_journaling_prompts(
    topic: str = "",
    theme: str = "",
    count: int = 5,
    model: Optional[str] = None
) -> List[str]:
    """Generate journaling prompts using the AI model."""
    base_content = f"Generate {count} journaling prompts"
    if topic:
        base_content += f" about {topic}"
    if theme:
        base_content += f" with theme {theme}"
    base_content += "."
    
    try:
        result = await process_ai_request(
            content=base_content,
            system_prompt=get_system_prompt("journaling_prompts"),
            model=model,
            temperature=0.8,  # Higher temperature for creativity
            max_tokens=500,
            task_name="journaling prompts"
        )
        
        # Process response - extract bullet points
        content = result["answer"]
        
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

async def check_ai_service() -> Dict[str, Any]:
    """Check if LM Studio API is available and return status details"""
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

async def query_lm_studio_stream(request: AIRequest):
    """Query LM Studio with streaming response using direct OpenAI client"""
    try:
        import time
        import json
        start_time = time.time()
        
        logger.debug(f"Starting streaming query to LM Studio")
        logger.debug(f"Request model: {request.model or AI_MODEL}")
        
        # Set up parameters
        model = await validate_and_get_model(request.model)
        temperature = request.temperature if request.temperature is not None else DEFAULT_TEMPERATURE
        max_tokens = request.max_tokens if request.max_tokens is not None else DEFAULT_MAX_TOKENS
        
        # Set timeout from configuration (convert from ms to seconds)
        timeout = MAX_INFERENCE_TIME / 1000
        
        # Use direct OpenAI API streaming since LangChain streaming has issues
        from openai import AsyncOpenAI
        
        # Initialize OpenAI client for LM Studio
        openai_client = AsyncOpenAI(
            base_url=LM_STUDIO_BASE_URL,
            api_key="not-needed"  # LM Studio doesn't require an API key
        )
        
        # Convert our AIMessage objects to OpenAI format
        openai_messages = []
        for msg in request.messages:
            openai_messages.append({"role": msg.role, "content": msg.content})
        
        # Stream response directly using OpenAI client
        stream = await openai_client.chat.completions.create(
            model=model,
            messages=openai_messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
            timeout=timeout
        )
        
        collected_content = ""
        async for chunk in stream:
            if hasattr(chunk, 'choices') and chunk.choices:
                choice = chunk.choices[0]
                if hasattr(choice, 'delta') and hasattr(choice.delta, 'content') and choice.delta.content is not None:
                    content = choice.delta.content
                    collected_content += content
                    yield content
        
        # Calculate final stats
        end_time = time.time()
        total_time = end_time - start_time
        
        # Estimate tokens based on content length (approximate)
        total_tokens = len(collected_content) / 4
        tokens_per_second = total_tokens / total_time if total_time > 0 else 0
        
        # Send stats as a separate message
        yield json.dumps({
            "type": "stats",
            "inference_time": int(total_time * 1000),  # Convert to milliseconds
            "tokens_per_second": tokens_per_second
        })
    
    except Exception as e:
        logger.error(f"Error in streaming query: {str(e)}")
        yield f"Error: {str(e)}"

# Agent functionality (simplified, keeping only what's actually used)

def create_default_tools() -> List[Tool]:
    """Create default tools for the agent"""
    return [
        Tool(
            name="search",
            func=lambda x: f"Search results for: {x}",
            description="Search for information on a topic"
        ),
        Tool(
            name="calculator",
            func=lambda x: str(eval(x)),
            description="Perform mathematical calculations"
        )
    ]

async def _post_process_sql_execution(content: str, streaming: bool = False):
    """Post-process agent response to execute SQL code if provided but not executed"""
    try:
        # Import the SQL tool for executing queries
        from app.ai.sql_tool import SQLTool
        import re
        import os
        
        logger.info(f"🔍 Starting SQL post-processing, content length: {len(content)}")
        
        # Initialize SQL tool if needed for post-processing
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            logger.warning("No DATABASE_URL found, skipping SQL post-processing")
            return None
            
        sql_tool = SQLTool(database_url)
        
        # Look for SQL queries in the new format from model
        # Priority order: proper code blocks first, then direct SQL patterns
        sql_patterns = [
            r'```\s*\n([^`]+)\n```',  # ``` SQL QUERY ``` (new format without sql tag)
            r'```sql\s*\n([^`]+)\n```',  # ```sql SELECT ... ``` (old format)
            r'```([^`]+)```',  # ```SQL QUERY``` (single line)
        ]
        
        # Check if response already contains actual results (not just fake numbers)
        has_real_results = any(indicator in content.lower() for indicator in [
            'rows returned', 'query executed successfully', 'actual count', 'real count',
            'query result:', 'execution completed', 'data retrieved'
        ])
        
        # Also check for specific database execution indicators
        real_db_indicators = [
            '🔧 post-processed sql execution', '✅ query result:', 'count:',
            'tool result:', '📋 result:', 'database connection'
        ]
        
        has_real_results = has_real_results or any(indicator in content.lower() for indicator in real_db_indicators)
        
        logger.info(f"🔍 has_real_results: {has_real_results}")
        
        # Extract and execute SQL queries from model response
        logger.info("🔍 Extracting SQL queries from model response...")
        
        sql_executed = False
        executed_queries = set()  # Track executed queries to avoid duplicates
        
        for i, pattern in enumerate(sql_patterns):
            logger.debug(f"🔍 Checking pattern {i+1}: {pattern}")
            matches = re.findall(pattern, content, re.IGNORECASE | re.MULTILINE | re.DOTALL)
            logger.debug(f"🔍 Pattern {i+1} matches: {len(matches)}")
            
            for j, match in enumerate(matches):
                # Extract SQL query
                if isinstance(match, tuple):
                    sql_query = match[0] if match[0] else (match[1] if len(match) > 1 else "")
                else:
                    sql_query = match
                
                # Clean and validate SQL query
                sql_query = _clean_sql_query(sql_query)
                if not sql_query:
                    continue
                
                # Skip if we already executed this query
                query_key = sql_query.strip().lower().replace(' ', '').replace('\n', '')
                if query_key in executed_queries:
                    logger.debug(f"🔍 Skipping duplicate query: {sql_query[:50]}...")
                    continue
                
                # Validate SQL query
                if not _is_valid_sql_query(sql_query):
                    logger.warning(f"🔍 Skipping invalid query: '{sql_query[:50]}...'")
                    continue
                
                try:
                    logger.info(f"🔧 Executing SQL: {sql_query[:100]}...")
                    executed_queries.add(query_key)
                    
                    # Execute the query
                    result = sql_tool.execute_query(sql_query)
                    
                    if result.get("success", False):
                        query_result = result.get("result", [])
                        row_count = result.get("row_count", 0)
                        
                        # Print the actual result to console for debugging
                        print(f"\n{COLORS['GREEN']}🔧 Post-processed SQL execution:{COLORS['RESET']}")
                        print(f"{COLORS['CYAN']}Query: {sql_query}{COLORS['RESET']}")
                        print(f"{COLORS['GREEN']}✅ Result: {row_count} rows{COLORS['RESET']}")
                        
                        # Return structured result for API to send to frontend
                        real_result = {
                            "type": "sql_execution",
                            "query": sql_query,
                            "success": True,
                            "row_count": row_count,
                            "result": query_result
                        }
                        
                        if query_result:
                            if len(query_result) == 1 and len(query_result[0]) == 1:
                                # Single value result (like COUNT)
                                value = list(query_result[0].values())[0]
                                print(f"{COLORS['YELLOW']}REAL Count: {value} (overriding any fake results){COLORS['RESET']}")
                                real_result["value"] = value
                                real_result["message"] = f"**✅ REAL Result:** {value} (actual count from database)"
                            else:
                                # Multiple rows/columns - format as nice table
                                print(f"{COLORS['WHITE']}Data Preview:{COLORS['RESET']}")
                                
                                # Format as markdown table
                                formatted_table = _format_query_results_as_table(query_result)
                                real_result["message"] = f"**✅ REAL Results:** {row_count} rows\n\n{formatted_table}"
                                
                                # Console preview (first 3 rows only)
                                for k, row in enumerate(query_result[:3]):
                                    row_dict = dict(row)
                                    # Hide sensitive data in console
                                    if 'password_hash' in row_dict:
                                        row_dict['password_hash'] = '[HIDDEN]'
                                    row_text = f"Row {k+1}: {row_dict}"
                                    print(f"  • {row_text}")
                                if len(query_result) > 3:
                                    extra_text = f"... and {len(query_result) - 3} more rows"
                                    print(f"  {extra_text}")
                        
                        logger.info("✅ SQL execution successful, returning first result")
                        sql_executed = True
                        return real_result  # Return first successful result
                    else:
                        logger.error(f"SQL execution failed: {result.get('error', 'Unknown error')}")
                        
                except Exception as e:
                    logger.error(f"Error executing SQL from agent response: {e}")
        
        if not sql_executed:
            logger.warning("🔍 No valid SQL queries found or executed")
        
        return None
                        
    except Exception as e:
        logger.warning(f"Error in SQL post-processing: {e}")
        import traceback
        traceback.print_exc()
        return None

async def chat_with_ai(
    message: str,
    history: List[Dict[str, str]] = None,
    model: Optional[str] = None,
    system_prompt: Optional[str] = None,
    streaming: bool = False,
    use_agent: bool = False,
    tools: Optional[List[Tool]] = None
):
    """Process a chat message with AI."""
    try:
        # Kiểm tra message có liên quan đến database không để chuẩn bị thông tin schema
        is_db_related = any(keyword in message.lower() for keyword in 
                           ["database", "sql", "query", "table", "schema", "select", "insert", 
                           "update", "delete", "join", "where", "postgres", "postgresql"])
        
        db_schema_prompt = ""
        # Lấy thông tin database schema nếu có database và câu hỏi liên quan đến database
        if is_db_related:
            try:
                from app.ai.sql_tool import SQLTool
                import os
                
                database_url = os.getenv("DATABASE_URL")
                if database_url:
                    logger.info("Fetching database schema for database-related question")
                    sql_tool = SQLTool(database_url)
                    schema_result = sql_tool.get_database_schema()
                    
                    if schema_result.get("success", False):
                        schema_text = schema_result.get("schema", "")
                        # Tạo prompt cho database schema
                        schema_prompt_prefix = "\n\n## Database Information\nYou have access to a PostgreSQL database with the following schema:\n\n```\n"
                        schema_prompt_suffix = "```\n\n### SQL Guidelines:\n1. Always analyze the schema first to understand the data structure\n2. Use appropriate SQL statements based on the task:\n   - SELECT: To retrieve data\n   - INSERT, UPDATE, DELETE: To modify data\n3. Always use proper SQL syntax and PostgreSQL features\n4. When writing SQL queries:\n   - Use explicit column names instead of * when possible\n   - Add proper JOIN conditions when joining tables\n   - Include appropriate WHERE clauses to filter data\n   - Use ORDER BY for sorting when needed\n   - Add LIMIT to control result size\n5. Format SQL queries properly with appropriate indentation and keywords in UPPERCASE\n6. Explain your SQL approach before providing the query\n\n### When answering database questions:\n1. Explain clearly which tables and columns are relevant to the question\n2. Break down complex requests into simpler steps\n3. Provide well-formatted SQL queries with comments explaining key parts\n4. Explain what the expected result would look like\n5. When suggesting data modifications, warn about potential data integrity risks"
                        
                        db_schema_prompt = schema_prompt_prefix + schema_text + schema_prompt_suffix
                        logger.info("Database schema successfully added to context")
                    else:
                        logger.warning(f"Failed to get database schema: {schema_result.get('error', 'Unknown error')}")
                else:
                    logger.warning("No DATABASE_URL found for database schema")
            except Exception as db_error:
                logger.error(f"Error preparing database context: {db_error}")

        if use_agent:
            agent_status = f"{COLORS['GREEN']}{COLORS['BOLD']}[AGENT MODE ACTIVE]{COLORS['RESET']}"
            print(f"\n{agent_status} Initializing LangChainAgent with model: {model or AI_MODEL}")
            logger.info(f"Using LangChainAgent for message: {message}")
            # Initialize agent with error handling
            try:
                from app.ai.agent import LangChainAgent  # Import agent class
                agent = LangChainAgent(
                    model_name=model or AI_MODEL,
                    system_prompt=system_prompt,
                    tools=tools  # Pass tools as-is, don't fallback to default tools
                )
                print(f"{COLORS['GREEN']}✓ LangChainAgent initialized successfully{COLORS['RESET']}")
                
                # Stream or non-stream response using enhanced streaming
                if streaming:
                    print(f"{COLORS['CYAN']}🌊 Starting streaming response...{COLORS['RESET']}")
                    # Use agent streaming method that maintains tool access
                    collected_content = ""
                    async for chunk in agent.chat_with_agent_streaming(message):
                        if chunk:  # Only yield non-empty chunks
                            collected_content += chunk
                            yield chunk
                    
                    # Post-process SQL execution after all chunks are collected
                    real_sql_result = await _post_process_sql_execution(collected_content, streaming=True)
                    if real_sql_result and real_sql_result.get("success", False):
                        # Yield real result as a special message
                        real_message = real_sql_result.get("message", "")
                        if real_message:
                            yield f"\n\n{real_message}"
                else:
                    print(f"{COLORS['BLUE']}💬 Processing non-streaming response...{COLORS['RESET']}")
                    # Use non-streaming mode
                    async for response in agent.chat(message, streaming=False):
                        if response:  # Only yield non-empty responses
                            yield response
                return  # Exit after successful agent processing
            except Exception as agent_error:
                logger.error(f"Agent error: {agent_error}")
                fallback_message = f"{COLORS['RED']}{COLORS['BOLD']}[AGENT FAILED]{COLORS['RESET']} Falling back to non-agent mode: {agent_error}"
                print(fallback_message)
                # Continue to non-agent mode below

        # Non-agent mode (fallback or original setting)
        non_agent_status = f"{COLORS['YELLOW']}{COLORS['BOLD']}[NON-AGENT MODE]{COLORS['RESET']}"
        print(f"\n{non_agent_status} Using standard chat mode with model: {model or AI_MODEL}")
        base_system_prompt = system_prompt or get_system_prompt("default_chat")
        
        # Thêm thông tin database schema vào prompt nếu cần
        if db_schema_prompt and is_db_related:
            enhanced_system_prompt = base_system_prompt + db_schema_prompt
            logger.info("Enhanced system prompt with database schema information")
        else:
            enhanced_system_prompt = base_system_prompt
        
        request = await create_ai_request(
            content=message,
            system_prompt=enhanced_system_prompt,
            model=model,
            temperature=0.7,
            max_tokens=2000,
            history=history
        )
        
        if streaming:
            # Add SQL post-processing for agent mode
            if use_agent:
                collected_content = ""
                async for chunk in query_lm_studio_stream(request):
                    if isinstance(chunk, str) and not chunk.startswith('{"type":"stats"'):
                        collected_content += chunk
                        yield chunk
                    else:
                        yield chunk
                
                # Post-process to execute SQL if agent provided code but didn't execute it
                await _post_process_sql_execution(collected_content, streaming=True)
            else:
                async for chunk in query_lm_studio_stream(request):
                    yield chunk if not (isinstance(chunk, str) and chunk.startswith('{"type":"stats"')) else chunk
        else:
            response = await query_lm_studio(request)
            result = {
                "content": response.content,
                "model": response.model,
                "usage": response.usage
            }
            
            # Post-process SQL for agent mode
            if use_agent:
                await _post_process_sql_execution(response.content, streaming=False)
            
            yield result
            
    except Exception as e:
        logger.error(f"Chat error: {e}")
        error_msg = "The response took too long. Try asking a shorter question." if "Client disconnected" in str(e) else str(e)
        yield {
            "content": f"Error: {error_msg}",
            "model": model or AI_MODEL,
            "error": True
        }

async def chat_with_ai_agent_enhanced_streaming(
    message: str,
    model: Optional[str] = None,
    system_prompt: Optional[str] = None,
    tools: Optional[List[Tool]] = None
):
    """
    Enhanced streaming chat with agent that provides detailed events.
    This function gives more granular control over the streaming process,
    showing tool usage, thinking process, and final responses.
    """
    try:
        agent_status = f"{COLORS['GREEN']}{COLORS['BOLD']}[ENHANCED AGENT STREAMING]{COLORS['RESET']}"
        print(f"\n{agent_status} Initializing LangChainAgent with model: {model or AI_MODEL}")
        
        from app.ai.agent import LangChainAgent
        agent = LangChainAgent(
            model_name=model or AI_MODEL,
            system_prompt=system_prompt,
            tools=tools  # Pass tools as-is, don't fallback to default tools
        )
        print(f"{COLORS['GREEN']}✓ Enhanced streaming agent initialized{COLORS['RESET']}")
        print(f"{COLORS['CYAN']}🔍 Starting detailed streaming...{COLORS['RESET']}")
        
        # Use the enhanced event streaming
        async for event_chunk in agent.astream_events(message):
            if event_chunk:
                yield event_chunk
                
    except Exception as e:
        logger.error(f"Enhanced agent streaming error: {e}")
        error_msg = f"Enhanced streaming error: {str(e)}"
        yield error_msg

def _clean_sql_query(sql_query: str):
    """Clean and extract valid SQL query from text"""
    if not sql_query:
        return None
    
    # Remove leading/trailing whitespace
    sql_query = sql_query.strip()
    
    # Remove comments and empty lines
    lines = []
    for line in sql_query.split('\n'):
        line = line.strip()
        if line and not line.startswith('--'):
            lines.append(line)
    
    if not lines:
        return None
    
    # Join lines and clean up
    cleaned = ' '.join(lines)
    
    # Remove extra whitespace
    cleaned = ' '.join(cleaned.split())
    
    # Ensure semicolon at end if missing
    if cleaned and not cleaned.endswith(';'):
        cleaned += ';'
    
    logger.debug(f"Cleaned SQL: '{cleaned}'")
    return cleaned

def _is_valid_sql_query(sql_query: str) -> bool:
    """Validate if the string is a proper SQL query"""
    if not sql_query or len(sql_query) < 8:
        return False
    
    # Check for SQL keywords at start
    sql_keywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'SHOW', 'DESCRIBE', 'EXPLAIN']
    first_word = sql_query.strip().split()[0].upper()
    
    if first_word not in sql_keywords:
        return False
    
    # Skip example or placeholder queries
    forbidden_words = ['example', 'placeholder', 'your_table', 'your_column', 'sample_data']
    if any(word in sql_query.lower() for word in forbidden_words):
        return False
    
    # Skip if it contains explanatory text mixed with SQL
    explanatory_words = ['need to', 'according to', 'explanation', 'this query', 'the result']
    if any(phrase in sql_query.lower() for phrase in explanatory_words):
        return False
    
    return True

def _format_query_results_as_table(query_results):
    """Format SQL query results as a nice markdown table"""
    if not query_results:
        return "*No data found*"
    
    # Get column names from first row
    first_row = dict(query_results[0])
    columns = list(first_row.keys())
    
    # Filter out sensitive columns for display
    sensitive_columns = ['password_hash', 'password', 'token', 'secret']
    display_columns = [col for col in columns if not any(sens in col.lower() for sens in sensitive_columns)]
    
    # Limit number of columns for readability (max 6)
    if len(display_columns) > 6:
        display_columns = display_columns[:5] + ['...more']
    
    # Create markdown table header
    table_lines = []
    table_lines.append("| " + " | ".join(display_columns) + " |")
    table_lines.append("| " + " | ".join(["---"] * len(display_columns)) + " |")
    
    # Add rows (limit to 10 for readability)
    max_rows = min(10, len(query_results))
    for i in range(max_rows):
        row = dict(query_results[i])
        row_values = []
        
        for col in display_columns:
            if col == '...more':
                row_values.append(f"+{len(columns) - 5} cols")
                continue
                
            value = row.get(col, '')
            
            # Format different data types
            if value is None:
                formatted_value = "*null*"
            elif hasattr(value, 'strftime'):  # datetime objects
                formatted_value = value.strftime("%Y-%m-%d %H:%M")
            elif isinstance(value, str) and len(value) > 30:
                formatted_value = value[:27] + "..."
            elif isinstance(value, bool):
                formatted_value = "✓" if value else "✗"
            else:
                formatted_value = str(value)
            
            # Escape markdown special characters
            formatted_value = formatted_value.replace("|", "\\|").replace("\n", " ")
            row_values.append(formatted_value)
        
        table_lines.append("| " + " | ".join(row_values) + " |")
    
    # Add summary if there are more rows
    if len(query_results) > max_rows:
        table_lines.append("")
        table_lines.append(f"*Showing {max_rows} of {len(query_results)} total rows*")
    
    if len(columns) > len(display_columns):
        hidden_cols = [col for col in columns if col not in display_columns]
        table_lines.append(f"*Hidden columns: {', '.join(hidden_cols)}*")
    
    return "\n".join(table_lines)