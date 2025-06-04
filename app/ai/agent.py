import logging
from typing import Optional, List, Dict, Any
import os
# Import từ lm_studio
from app.ai.lm_studio import (
    get_chatopen_ai_instance,
    DEFAULT_AI_MODEL,
    DEFAULT_TEMPERATURE,
    DEFAULT_MAX_TOKENS,
    SYSTEM_PROMPTS,
    AI_MODEL,
    query_lm_studio_stream,
    create_ai_request,
    AIRequest,
    AIMessage
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
from langchain_core.callbacks.base import BaseCallbackHandler
from langchain_core.messages import SystemMessage, HumanMessage

# Import Tools
from app.ai.sql_tool import PostgreSQLTool


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
        
        # Escape curly braces in system_prompt
        self.system_prompt = system_prompt or SYSTEM_PROMPTS["default_chat"]
        self.system_prompt = self.system_prompt.replace("{", "{{").replace("}", "}}")
        
        # Log system_prompt to debug
        logger.debug(f"System prompt content: {self.system_prompt[:500]}...")
        
        # Initialize memory
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        
        # Only try to add SQL tools if any tools were specified
        if tools is None:
            self.__add__postgre_sql_tool()  # Add PostgreSQL tool if available
        
        # Log system_prompt again after adding SQL tools
        logger.debug(f"System prompt after SQL tools: {self.system_prompt[:500]}...")
        
        # Initialize the LLM
        llm = get_chatopen_ai_instance(
            model=self.model_name,
            temperature=self.temperature,
            max_tokens=self.max_tokens
        )
        
        # Initialize streaming callback handler
        self.streaming_handler = AgentStreamingCallbackHandler()
        
        try:
            # Create prompt template with agent_scratchpad
            prompt = ChatPromptTemplate.from_messages([
                ("system", self.system_prompt),
                MessagesPlaceholder(variable_name="chat_history"),
                ("human", "{input}"),
                MessagesPlaceholder(variable_name="agent_scratchpad")  # Thêm placeholder cho agent_scratchpad
            ])
            
            # Create the agent with tools
            self.agent = create_openai_functions_agent(
                llm=llm,
                tools=self.tools,
                prompt=prompt
            )
            
            # Create agent executor with callback manager
            callback_manager = CallbackManager([self.streaming_handler])
            self.agent_executor = AgentExecutor(
                agent=self.agent,
                tools=self.tools,
                memory=self.memory,
                verbose=False,
                handle_parsing_errors=True,
                callbacks=[self.streaming_handler]  # Add the streaming callback
            )
        except Exception as e:
            logger.error(f"Error initializing agent: {e}")
            logger.exception(e)
            raise

    def query(self, query_text: str) -> Dict[str, Any]:
        """Process a user query and return results"""
        try:
            result = self.agent_executor.invoke({"input": query_text})
            return {
                "response": result.get("output", ""),
                "error": None
            }
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            logger.exception(e)
            return {
                "response": f"Xảy ra lỗi khi xử lý câu hỏi: {str(e)}",
                "error": str(e)
            }
    
    def clear_memory(self):
        """Clear the conversation memory"""
        self.memory.clear()
        
    def __add__postgre_sql_tool(self):
        """Add PostgreSQL tools if database is available"""
        try:
            database_url = os.getenv("DATABASE_URL")
            if database_url:
                logger.info("Adding PostgreSQL tools to agent")
                pg_tool = PostgreSQLTool(database_url)
                
                # Get schema and add to system prompt
                schema_result = pg_tool.get_database_schema()
                if schema_result.get("success", False):
                    # Format schema as text
                    schema_text = self._format_schema_for_prompt(schema_result)
                    sql_prompt = self._get_sql_prompt(schema_text)
                    self.system_prompt += sql_prompt
                    logger.info("Added database schema to system prompt")
                else:
                    logger.warning(f"Could not get database schema: {schema_result.get('error', 'Unknown error')}")
                    # Add dummy schema
                    dummy_schema = self._create_dummy_schema()
                    sql_prompt = self._get_sql_prompt(dummy_schema)
                    self.system_prompt += sql_prompt
                
                # Add PostgreSQL tools
                pg_tools = pg_tool.get_langchain_tools()
                self.tools.extend(pg_tools)
                logger.info(f"Added {len(pg_tools)} PostgreSQL tools to agent")
            else:
                logger.info("No DATABASE_URL found, skipping PostgreSQL tools")
        except Exception as e:
            logger.error(f"Error adding PostgreSQL tools: {e}")
            # Add dummy schema even if connection fails
            dummy_schema = self._create_dummy_schema()
            sql_prompt = self._get_sql_prompt(dummy_schema)
            self.system_prompt += sql_prompt
    
    def _format_schema_for_prompt(self, schema_result: Dict[str, Any]) -> str:
        """Format database schema result into readable text for prompt"""
        if not schema_result.get("success", False):
            return "No database schema available"
        
        tables = schema_result.get("tables", [])
        if not tables:
            return "No tables found in database"
        
        schema_text = ""
        for table in tables:
            table_name = table.get("table_name", "unknown")
            columns = table.get("columns", [])
            primary_keys = table.get("primary_keys", [])
            foreign_keys = table.get("foreign_keys", [])
            
            schema_text += f"\nTable: {table_name}\n"
            schema_text += "Columns:\n"
            
            for col in columns:
                col_name = col.get("column_name", "unknown")
                data_type = col.get("data_type", "unknown")
                is_nullable = col.get("is_nullable", "YES")
                pk_indicator = " (PK)" if col_name in primary_keys else ""
                schema_text += f"  - {col_name}: {data_type}{pk_indicator} (nullable: {is_nullable})\n"
            
            if foreign_keys:
                schema_text += "Foreign Keys:\n"
                for fk in foreign_keys:
                    source_col = fk.get("column_name", "unknown")
                    target_table = fk.get("foreign_table", "unknown")
                    target_col = fk.get("foreign_column", "unknown")
                    schema_text += f"  - {source_col} -> {target_table}.{target_col}\n"
            
            schema_text += "\n"
        
        return schema_text.strip()

    def _get_sql_prompt(self, schema_text: str) -> str:
        """Create specialized prompt for database interaction"""
        # Check if schema is empty and handle that case
        if not schema_text or schema_text.strip() == "":
            safe_schema_text = "No tables found in the database."
            logger.debug("Empty schema detected, using default text.")
        else:
            # Escape any curly braces in schema_text
            safe_schema_text = schema_text.replace("{", "{{").replace("}", "}}")
        
        # Log the schema text for debugging
        logger.debug(f"Schema text length: {len(schema_text) if schema_text else 0}")
        logger.debug(f"Schema text (first 100 chars): {schema_text[:100] if schema_text else 'Empty'}")
        logger.debug(f"Escaped schema text (first 100 chars): {safe_schema_text[:100] if safe_schema_text else 'Empty'}")
        
        # Construct the SQL prompt
        sql_prompt = "\n\n## Database Access\n"
        sql_prompt += "You have access to a PostgreSQL database with the following schema:\n\n"
        sql_prompt += "```\n"
        sql_prompt += safe_schema_text
        sql_prompt += "\n```\n\n"
        
        # Add SQL guidelines (ensure no unescaped curly braces here)
        sql_prompt += """
    ### Available Database Tools:
    1. `database_query`: Execute SQL queries on the PostgreSQL database
    2. `get_database_schema`: Get the full database schema
    3. `analyze_query`: Analyze a SQL query for issues without executing it
    4. `get_table_info`: Get detailed information about a specific table
    5. `inspect_data`: Get a sample of data from a table
    6. `get_table_relationships`: Get all relationships between tables
    7. `get_table_sizes`: Get information about the data size of tables

    ### SQL Guidelines:
    1. Always analyze the schema first to understand the data structure
    2. Use appropriate SQL statements based on the task:
    - SELECT: To retrieve data
    - INSERT, UPDATE, DELETE: To modify data
    3. Always use proper SQL syntax and PostgreSQL features
    4. When writing SQL queries:
    - Use explicit column names instead of * when possible
    - Add proper JOIN conditions when joining tables
    - Include appropriate WHERE clauses to filter data
    - Use ORDER BY for sorting when needed
    - Add LIMIT to control result size
    5. Format SQL queries properly with appropriate indentation
    """
        # Escape curly braces in the entire sql_prompt
        sql_prompt = sql_prompt.replace("{", "{{").replace("}", "}}")
        
        # Log final sql_prompt
        logger.debug(f"Final SQL prompt (first 100 chars): {sql_prompt[:100]}...")
        
        return sql_prompt

    def _create_dummy_schema(self) -> str:
        """Create a dummy schema when no tables are available in the database"""
        return (
            "No tables found in the database currently.\n\n"
            "You can create tables with SQL commands like:\n"
            "CREATE TABLE entries (\n"
            "    id SERIAL PRIMARY KEY,\n"
            "    content TEXT NOT NULL,\n" 
            "    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n"
            ");\n\n"
            "Then insert data with:\n"
            "INSERT INTO entries (content) VALUES ('Sample entry 1'), ('Sample entry 2');"
        )

    async def chat(self, message: str, streaming: bool = False):
        """Chat with the agent, optionally with streaming"""
        try:
            if streaming:
                # Use astream for streaming response with real-time chunks
                collected_content = ""
                async for chunk in self.agent_executor.astream({"input": message}):
                    if isinstance(chunk, dict):
                        if "output" in chunk:
                            # Final output from agent
                            full_output = chunk["output"]
                            
                            # If we haven't sent this content yet, yield it all at once
                            if full_output and full_output != collected_content:
                                # For now, yield the complete output as one chunk
                                # In the future, we could implement character-by-character streaming
                                remaining_content = full_output[len(collected_content):]
                                if remaining_content:
                                    yield remaining_content
                                    collected_content = full_output
                        elif "actions" in chunk:
                            # Agent is planning actions
                            actions = chunk["actions"]
                            if actions:
                                for action in actions:
                                    if hasattr(action, 'log') and action.log:
                                        thinking_msg = f"🤔 Thinking: {action.log}"
                                        yield thinking_msg
                        elif "steps" in chunk:
                            # Agent executed tools
                            steps = chunk["steps"]
                            if steps:
                                for step in steps:
                                    if hasattr(step, 'action') and hasattr(step.action, 'tool'):
                                        tool_name = step.action.tool
                                        yield f"🔧 Using tool: {tool_name}"
                                    if hasattr(step, 'observation') and step.observation:
                                        observation = str(step.observation)[:200]
                                        yield f"📋 Tool result: {observation}{'...' if len(str(step.observation)) > 200 else ''}"
                        elif "intermediate_steps" in chunk:
                            # Additional intermediate information
                            steps = chunk["intermediate_steps"]
                            for step in steps:
                                if hasattr(step, 'observation'):
                                    yield f"🔍 Processing: {str(step.observation)[:100]}..."
                    elif isinstance(chunk, str):
                        # Direct string content
                        yield chunk
                
                # If no content was yielded, yield a default message
                if not collected_content:
                    yield "✅ Task completed."
            else:
                # Non-streaming mode
                result = self.agent_executor.invoke({"input": message})
                yield result.get("output", "No response generated")
                
        except Exception as e:
            logger.error(f"Error in agent chat: {e}")
            error_msg = f"Agent error: {str(e)}"
            yield error_msg

    async def astream_events(self, message: str):
        """Stream events from agent execution with more detailed control"""
        try:
            # Use astream_events for more granular control over streaming
            async for event in self.agent_executor.astream_events(
                {"input": message}, 
                version="v1"
            ):
                event_type = event.get("event", "")
                event_name = event.get("name", "")
                event_data = event.get("data", {})
                
                # Handle different event types
                if event_type == "on_chat_model_stream":
                    # Direct streaming from the LLM
                    chunk = event_data.get("chunk", {})
                    if hasattr(chunk, 'content') and chunk.content:
                        yield chunk.content
                elif event_type == "on_tool_start":
                    # Tool execution started
                    tool_name = event_data.get("input", {}).get("tool", "unknown")
                    yield f"\n🔧 Using tool: {tool_name}...\n"
                elif event_type == "on_tool_end":
                    # Tool execution completed
                    tool_result = event_data.get("output", "")
                    if tool_result:
                        yield f"📋 Result: {str(tool_result)[:200]}...\n" if len(str(tool_result)) > 200 else f"📋 Result: {tool_result}\n"
                elif event_type == "on_agent_finish":
                    # Agent finished, get final output
                    output = event_data.get("output", "")
                    if output:
                        yield f"\n✅ {output}"
                        
        except Exception as e:
            logger.error(f"Error in agent stream events: {e}")
            yield f"\nError: {str(e)}"

    async def chat_with_real_streaming(self, message: str):
        """Chat with real token-level streaming using callback handler"""
        try:
            # Clear previous streaming data
            self.streaming_handler.clear()
            
            # Start the agent execution in a background task
            import asyncio
            
            # Keep track of tokens yielded so far
            tokens_yielded = 0
            
            # Start agent execution
            agent_task = asyncio.create_task(
                self.agent_executor.ainvoke({"input": message})
            )
            
            # Monitor for new tokens while agent is running
            while not agent_task.done():
                current_tokens = self.streaming_handler.get_tokens()
                
                # Yield any new tokens
                if len(current_tokens) > tokens_yielded:
                    new_tokens = current_tokens[tokens_yielded:]
                    for token in new_tokens:
                        yield token
                    tokens_yielded = len(current_tokens)
                
                # Small delay to avoid busy waiting
                await asyncio.sleep(0.01)
            
            # Get final result and yield any remaining tokens
            final_result = await agent_task
            final_tokens = self.streaming_handler.get_tokens()
            
            # Yield any remaining tokens
            if len(final_tokens) > tokens_yielded:
                remaining_tokens = final_tokens[tokens_yielded:]
                for token in remaining_tokens:
                    yield token
            
            # If no tokens were captured, yield the final output
            if not final_tokens:
                final_output = final_result.get("output", "No response generated")
                yield final_output
                
        except Exception as e:
            logger.error(f"Error in real streaming chat: {e}")
            yield f"Agent error: {str(e)}"

    async def chat_with_direct_streaming(self, message: str):
        """Use direct OpenAI streaming bypass agent limitations"""
        try:
            # Prepare messages for direct LLM call
            messages = [
                SystemMessage(content=self.system_prompt),
                HumanMessage(content=message)
            ]
            
            # Create AI request in the expected format
            ai_messages = []
            for msg in messages:
                if isinstance(msg, SystemMessage):
                    ai_messages.append({"role": "system", "content": msg.content})
                elif isinstance(msg, HumanMessage):
                    ai_messages.append({"role": "user", "content": msg.content})
            
            # Convert to AIRequest format
            ai_request = AIRequest(
                messages=[AIMessage(role=msg["role"], content=msg["content"]) for msg in ai_messages],
                model=self.model_name,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            # Stream using the working streaming method
            async for chunk in query_lm_studio_stream(ai_request):
                if isinstance(chunk, str) and not chunk.startswith('{"type":"stats"'):
                    yield chunk
            
        except Exception as e:
            logger.error(f"Error in direct streaming: {e}")
            yield f"Streaming error: {str(e)}"

class AgentStreamingCallbackHandler(BaseCallbackHandler):
    """Custom callback handler to capture streaming tokens from agent LLM calls"""
    
    def __init__(self):
        self.tokens = []
        self.current_content = ""
    
    def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        """Called when a new token is generated by the LLM"""
        self.tokens.append(token)
        self.current_content += token
    
    def on_llm_start(self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any) -> None:
        """Called when LLM starts generating"""
        self.tokens = []
        self.current_content = ""
    
    def get_tokens(self) -> List[str]:
        """Get all collected tokens"""
        return self.tokens.copy()
    
    def get_content(self) -> str:
        """Get the current accumulated content"""
        return self.current_content
    
    def clear(self) -> None:
        """Clear the collected tokens and content"""
        self.tokens = []
        self.current_content = ""