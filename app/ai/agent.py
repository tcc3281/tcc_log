import logging
from typing import Optional, List, Dict, Any
import json
import httpx

# Import từ lm_studio
# Import từ lm_studio
from lm_studio import (
    get_chatopen_ai_instance,
    DEFAULT_AI_MODEL,
    DEFAULT_TEMPERATURE,
    DEFAULT_MAX_TOKENS,
    SYSTEM_PROMPTS,
    AI_MODEL  # Thêm vào đây
)

# Thiết lập logger
logger = logging.getLogger(__name__)

# Langchain imports 
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableConfig
from langchain_core.callbacks.manager import CallbackManager
from langchain_core.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_core.tools import Tool
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import MessagesPlaceholder

class LangChainAgent:
    """Simplified LangChain Agent class"""
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
        self.system_prompt = system_prompt or SYSTEM_PROMPTS["default_chat"]
        
        # Initialize memory
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        
        # Initialize LLM
        self.llm = get_chatopen_ai_instance(self.model_name, self.temperature, self.max_tokens)
        
        # Create prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        # Create agent and executor
        self.agent = create_openai_functions_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=self.prompt
        )
        
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            memory=self.memory,
            verbose=True
        )
    
    async def chat(self, message: str, streaming: bool = False):
        """Process a chat message with the agent."""
        try:
            if streaming:
                # Stream the response
                collected_content = ""
                async for chunk in self.agent_executor.astream({"input": message}):
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
