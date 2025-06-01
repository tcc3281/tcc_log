import os
import logging
from typing import Optional, List, Dict, Any, Union
import httpx
import json
import re
from pydantic import BaseModel
from dotenv import load_dotenv
import asyncio

# LangChain imports
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage as LCMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableConfig
from langchain_core.callbacks.manager import CallbackManager
from langchain_core.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_core.tools import Tool
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import MessagesPlaceholder

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Default configuration
DEFAULT_LM_STUDIO_BASE_URL = "http://127.0.0.1:1234/v1"
DEFAULT_AI_MODEL = "lmstudio-community/Qwen2.5-7B-Instruct-GGUF"
DEFAULT_MAX_TOKENS = 2000
DEFAULT_TEMPERATURE = 0.7
DEFAULT_MAX_INFERENCE_TIME = 60000  # Default 60 seconds in milliseconds

# Load from environment variables or use defaults
LM_STUDIO_BASE_URL = os.getenv("LM_STUDIO_BASE_URL", DEFAULT_LM_STUDIO_BASE_URL)
AI_MODEL = os.getenv("LM_STUDIO_MODEL", DEFAULT_AI_MODEL)
MAX_INFERENCE_TIME = int(os.getenv("LM_MAX_INFERENCE_TIME", DEFAULT_MAX_INFERENCE_TIME))

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


def parse_ai_response(content: str) -> ParsedAIResponse:
    """
    Parse AI response to separate think and answer sections
    
    Args:
        content: Raw AI response content
        
    Returns:
        ParsedAIResponse: Structured response with think and answer sections
    """
    # Log the raw content for debugging
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
    
    # Log for debugging
    logger.debug(f"Parsed AI response - has think: {think_content is not None}, answer length: {len(answer_content)}")
    
    return parsed_response


async def query_lm_studio(request: AIRequest, max_retries: int = 3) -> AIResponse:
    """
    Query LM Studio with retry logic using LangChain
    """
    retry_count = 0
    last_error = None
    
    # Set timeout based on environment configuration - convert from milliseconds to seconds
    timeout = MAX_INFERENCE_TIME / 1000
    logger.debug(f"Using query timeout of {timeout} seconds (from config: {MAX_INFERENCE_TIME}ms)")
    
    while retry_count < max_retries:
        try:
            response = await _query_lm_studio_internal(request, timeout=timeout)
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
    """    # Define system prompts based on analysis type
    system_prompts = {
        "general": """Analyze this journal entry briefly. Focus on key themes and main points.
                     Keep your response under 200 words.
                     
                     First, put your analytical thinking inside <think> tags. Then provide your final answer separately.
                     Example: 
                     <think>
                     Here I analyze the key themes...
                     </think>
                     
                     My analysis of your journal entry:
                     [Your final response]""",
                      
        "mood": """Analyze the writer's mood and emotional state in 3-5 sentences.
                   Focus only on emotions and mood.
                   
                   First, put your analytical thinking inside <think> tags. Then provide your final answer separately.
                   Example: 
                   <think>
                   Here I analyze the emotions...
                   </think>
                   
                   Mood analysis:
                   [Your final response]""",
                   
        "summary": """Summarize the main points in 3-4 sentences.
                     Focus on key events and emotions only.
                     
                     First, put your analytical thinking inside <think> tags. Then provide your final answer separately.
                     Example: 
                     <think>
                     Here I identify the key points...
                     </think>
                     
                     Summary:
                     [Your final response]""",
                      
        "insights": """Provide 2-3 key insights about the writer's thoughts or patterns.
                      Keep it brief and focused.
                      
                      First, put your analytical thinking inside <think> tags. Then provide your final answer separately.
                      Example: 
                      <think>
                      Here I analyze patterns...
                      </think>
                      
                      Key insights:
                      [Your final response]"""
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
    logger.debug(f"suggest_writing_improvements called with model: {model}")
    
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


async def _query_lm_studio_internal(request: AIRequest, timeout: float = None) -> AIResponse:
    """
    Internal function to send a request to LM Studio API using LangChain
    """
    model = request.model or AI_MODEL
    temperature = request.temperature or DEFAULT_TEMPERATURE
    max_tokens = request.max_tokens or DEFAULT_MAX_TOKENS
    
    # If no timeout specified, use the configured max inference time
    if timeout is None:
        timeout = MAX_INFERENCE_TIME / 1000
    
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
    
    # Set up LangChain model with specific parameters for this request
    llm = ChatOpenAI(
        base_url=LM_STUDIO_BASE_URL,
        api_key="not-needed",
        model_name=model,
        temperature=temperature,
        max_tokens=max_tokens,
        timeout=timeout  # Apply the timeout in seconds
    )
    
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


async def query_lm_studio_stream(request: AIRequest):
    """
    Query LM Studio with streaming response using LangChain
    
    Args:
        request: AIRequest object containing messages and parameters
        
    Yields:
        str or dict: Streaming chunks of the response or stats data
    """
    try:
        import time
        import json
        start_time = time.time()
        
        logger.debug(f"Starting streaming query to LM Studio")
        logger.debug(f"Request model: {request.model or AI_MODEL}")
        
        # Set up parameters
        model = request.model or AI_MODEL
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


class ConversationMemory:
    """Class to manage conversation memory"""
    def __init__(self, max_messages: int = 10):
        self.max_messages = max_messages
        self.messages: List[Dict[str, str]] = []
    
    def add_message(self, role: str, content: str):
        """Add a message to memory"""
        self.messages.append({"role": role, "content": content})
        # Keep only the last max_messages
        if len(self.messages) > self.max_messages:
            self.messages = self.messages[-self.max_messages:]
    
    def get_messages(self) -> List[Dict[str, str]]:
        """Get all messages in memory"""
        return self.messages
    
    def clear(self):
        """Clear all messages"""
        self.messages = []


class LangChainAgent:
    """Class to manage LangChain Agent and memory"""
    def __init__(
        self,
        model_name: str = AI_MODEL,
        temperature: float = DEFAULT_TEMPERATURE,
        max_tokens: int = DEFAULT_MAX_TOKENS,
        tools: Optional[List[Tool]] = None,
        system_prompt: Optional[str] = None
    ):
        self.model_name = model_name
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.tools = tools or []
        self.system_prompt = system_prompt or """You are a helpful AI assistant. 
        You can structure your responses using <think>...</think> tags to show your reasoning process.
        For example:    
        <think>
        The user is asking about... Let me consider this carefully...
        </think>
        
        Then provide your main response after the think section.
        
        When using LaTeX for mathematical expressions, follow these guidelines:
        1. For inline math (within a sentence), use \(...\) delimiters:
           Example: "The formula \(E = mc^2\) is famous."
        
        2. For display math (on its own line), use \[...\] delimiters:
           Example: "The quadratic formula is:
           \[
           x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
           \]"
        
        3. For matrices and other environments, use \[...\] with the appropriate environment:
           Example: "The matrix A is:
           \[
           \begin{bmatrix}
           a_{11} & a_{12} \\
           a_{21} & a_{22}
           \end{bmatrix}
           \]"
        
        4. For code blocks containing LaTeX, use the latex language identifier:
           ```latex
           \begin{bmatrix}
           a_{11} & a_{12} \\
           a_{21} & a_{22}
           \end{bmatrix}
           ```
        
        Provide clear, concise, and accurate responses to the user's questions like:
        1. Overview of the topic
        2. Key points or steps
        ...
        Be friendly and conversational in your replies.
        You should use Markdown formatting in your responses, including headers, bulleted lists, tables using the GFM (GitHub Flavored Markdown) syntax.
        Finally, provide a conclusion or summary of your response."""
        
        # Initialize memory
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        
        # Initialize LLM
        self.llm = ChatOpenAI(
            base_url=LM_STUDIO_BASE_URL,
            api_key="not-needed",
            model_name=self.model_name,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            streaming=False
        )
        
        # Initialize streaming LLM
        self.streaming_llm = ChatOpenAI(
            base_url=LM_STUDIO_BASE_URL,
            api_key="not-needed",
            model_name=self.model_name,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            streaming=True,
            callback_manager=CallbackManager([StreamingStdOutCallbackHandler()])
        )
        
        # Create prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        # Create agent
        self.agent = create_openai_functions_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=self.prompt
        )
        
        # Create agent executor
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            memory=self.memory,
            verbose=True
        )
        
        # Create streaming agent executor
        self.streaming_agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            memory=self.memory,
            verbose=True
        )
    
    async def chat(
        self,
        message: str,
        streaming: bool = False
    ):
        """
        Process a chat message with the agent.
        
        Args:
            message: The user message
            streaming: Whether to use streaming response
            
        Returns:
            If streaming=False: Dict containing response content and metadata
            If streaming=True: Yields streaming chunks of the response
        """
        try:
            if streaming:
                # Stream the response
                collected_content = ""
                async for chunk in self.streaming_agent_executor.astream({"input": message}):
                    if "output" in chunk:
                        content = chunk["output"]
                        collected_content += content
                        yield content
                
                # Add to memory
                self.memory.chat_memory.add_user_message(message)
                self.memory.chat_memory.add_ai_message(collected_content)
            else:
                # Get complete response
                response = await self.agent_executor.ainvoke({"input": message})
                
                # Add to memory
                self.memory.chat_memory.add_user_message(message)
                self.memory.chat_memory.add_ai_message(response["output"])
                
                yield {
                    "content": response["output"],
                    "model": self.model_name,
                    "usage": None  # LangChain doesn't provide usage stats
                }
        
        except Exception as e:
            logger.error(f"Error in agent chat: {e}")
            error_msg = str(e)
            if "Client disconnected" in error_msg:
                error_msg = "The response took too long. Try asking a shorter question."
            
            if streaming:
                yield f"Error: {error_msg}"
            else:
                yield {
                    "content": f"Error: {error_msg}",
                    "model": self.model_name,
                    "error": True
                }
    
    def clear_memory(self):
        """Clear the conversation memory"""
        self.memory.clear()

# Example usage of tools
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

async def chat_with_ai(
    message: str,
    history: List[Dict[str, str]] = None,
    model: Optional[str] = None,
    system_prompt: Optional[str] = None,
    streaming: bool = False,
    use_agent: bool = False,
    tools: Optional[List[Tool]] = None
):
    """
    Process a chat message with AI.
    
    Args:
        message: The current user message
        history: Previous conversation history (list of role/content pairs)
        model: Optional model override
        system_prompt: Optional system prompt override
        streaming: Whether to use streaming response
        use_agent: Whether to use LangChain agent
        tools: Optional list of tools for the agent
        
    Returns:
        If streaming=False: Dict containing AI response with content, model used, etc.
        If streaming=True: Yields streaming chunks of the AI response or stats data
    """
    if use_agent:
        # Create agent instance
        agent = LangChainAgent(
            model_name=model or AI_MODEL,
            system_prompt=system_prompt,
            tools=tools or create_default_tools()
        )
        
        # Use agent for chat
        if streaming:
            async for response in agent.chat(message, streaming=True):
                yield response
        else:
            response = await agent.chat(message, streaming=False)
            yield response
    else:
        # Use original chat implementation
        # Default system prompt if none provided
        if system_prompt is None:
            system_prompt = """You are a helpful AI assistant. 
            You can structure your responses using <think>...</think> tags to show your reasoning process.
            Think step by step and provide a detailed response.
            Just list pipeline steps and don't be too detailed.
            For example:    
            <think>
            The user is asking about... Let me consider this carefully...
            </think>
            
            Then provide your main response after the think section.
            
            You have to use Latex to show mathematical expressions. When using LaTeX for mathematical expressions, follow these guidelines:
            1. For inline math (within a sentence), use \(...\) delimiters:
               Example: "The formula \(E = mc^2\) is famous."
            
            2. For display math (on its own line), use \[...\] delimiters:
               Example: "The quadratic formula is:
               \[
               x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
               \]"
            
            3. For matrices and other environments, use \[...\] with the appropriate environment:
               Example: "The matrix A is:
               \[
               \begin{bmatrix}
               a_{11} & a_{12} \\
               a_{21} & a_{22}
               \end{bmatrix}
               \]"
            
            4. For code blocks containing LaTeX, use the latex language identifier:
               ```latex
               \begin{bmatrix}
               a_{11} & a_{12} \\
               a_{21} & a_{22}
               \end{bmatrix}
               ```
            If there are compared requirement, create table with markdown to compare between objecs.
            Bold the key word in the answer.
            Provide clear, concise, and accurate responses to the user's questions like:
            1. Overview of the topic
            2. Key points or steps
            ...
            Be friendly and conversational in your replies.
            You should use Markdown formatting in your responses, including headers, bulleted lists, tables using the GFM (GitHub Flavored Markdown) syntax.
            Finally, provide a conclusion or summary of your response."""
        
        # Initialize message list with system prompt
        messages = [AIMessage(role="system", content=system_prompt)]
        
        # Add conversation history if provided
        if history:
            for msg in history:
                if msg["role"] in ["user", "assistant", "system"]:
                    messages.append(AIMessage(role=msg["role"], content=msg["content"]))
        
        # Add current message
        messages.append(AIMessage(role="user", content=message))
        
        # Create request
        request = AIRequest(
            messages=messages,
            model=model,
            temperature=0.7,
            max_tokens=2000  # Larger context for chat
        )
        
        try:
            if streaming:
                # Stream the AI response
                collected_content = ""
                async for chunk in query_lm_studio_stream(request):
                    # Check if this is a stats message (JSON string)
                    if chunk.startswith('{"type":"stats"'):
                        yield chunk  # Pass through the stats data
                    else:
                        collected_content += chunk
                        yield chunk  # Pass through regular content
            else:
                # Query the AI with retry logic
                response = await query_lm_studio(request)
                yield {
                    "content": response.content,
                    "model": response.model,
                    "usage": response.usage
                }
        
        except Exception as e:
            logger.error(f"Error in chat: {e}")
            error_msg = str(e)
            if "Client disconnected" in error_msg:
                error_msg = "The response took too long. Try asking a shorter question."
            
            yield {
                "content": f"Error: {error_msg}",
                "model": model or AI_MODEL,
                "error": True
            }
