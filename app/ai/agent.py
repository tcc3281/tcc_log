import logging
from typing import Optional, List, Dict, Any
import os
# Import từ lm_studio
from app.ai.lm_studio import (
    get_chatopen_ai_instance,
    DEFAULT_AI_MODEL,
    DEFAULT_TEMPERATURE,
    DEFAULT_MAX_TOKENS,
    AI_MODEL,
    query_lm_studio_stream,
    create_ai_request,
    AIRequest,
    AIMessage
)
# Import prompt manager
from app.ai.prompt_manager import get_prompt_manager, get_system_prompt, get_sql_prompt

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
from app.ai.sql_tool import SQLTool


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
        self.system_prompt = system_prompt or get_system_prompt("default_chat")
        self.system_prompt = self.system_prompt.replace("{", "{{").replace("}", "}}")
        
        # Log system_prompt to debug
        logger.debug(f"System prompt content: {self.system_prompt[:500]}...")
        
        # Initialize memory
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        
        # Initialize tools list if None
        if self.tools is None:
            self.tools = []
        
        # Always try to add SQL tools
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
                logger.info("Adding SQL tools to agent")
                sql_tool = SQLTool(database_url)
                
                # Get schema and add to system prompt
                schema_result = sql_tool.get_database_schema()
                if schema_result.get("success", False):
                    # Format schema as text
                    schema_text = schema_result.get("schema", "")
                    sql_prompt = self._get_sql_prompt(schema_text)
                    self.system_prompt += sql_prompt
                    
                    # Add few-shot learning examples
                    try:
                        few_shot_examples = sql_tool.generate_learning_prompt_addition()
                        if few_shot_examples:
                            self.system_prompt += few_shot_examples
                            logger.info("Added few-shot learning examples to system prompt")
                    except Exception as few_shot_error:
                        logger.warning(f"Could not add few-shot examples: {few_shot_error}")
                    
                    logger.info("Added database schema to system prompt")
                else:
                    logger.warning(f"Could not get database schema: {schema_result.get('error', 'Unknown error')}")
                    # Add basic SQL prompt
                    sql_prompt = self._get_basic_sql_prompt()
                    self.system_prompt += sql_prompt
                
                # Add SQL tools from SQLTool
                sql_tools = sql_tool.get_langchain_tools()
                self.tools.extend(sql_tools)
                logger.info(f"Added {len(sql_tools)} SQL tools to agent")
            else:
                logger.info("No DATABASE_URL found, skipping SQL tools")
        except Exception as e:
            logger.error(f"Error adding SQL tools: {e}")
            # Add basic SQL prompt even if connection fails
            sql_prompt = self._get_basic_sql_prompt()
            self.system_prompt += sql_prompt
    
    # Removed _execute_sql_tool method - now handled by SQLTool.get_langchain_tools()
    
    def _get_basic_sql_prompt(self) -> str:
        """Get basic SQL prompt without schema details"""
        return """

## Database Access & SQL Tools
You have access to a PostgreSQL database through specialized SQL tools. Use these tools to help users with database-related questions.

### Available SQL Tools:
1. **sql_query**: Execute SQL queries against the database
2. **get_database_schema**: Retrieve complete database schema information
3. **list_tables**: Get a list of all available tables

### Database Interaction Workflow:
1. **First, understand the schema**: Use `get_database_schema` tool to understand the database structure
2. **Analyze the user's question**: Determine what data they need and from which tables
3. **Construct appropriate SQL**: Write clear, efficient SQL queries
4. **Execute and explain**: Run queries using `sql_query` tool and explain results
5. **Follow up**: Ask clarifying questions if needed

### SQL Best Practices:
1. **Always start by understanding the schema** - Use `get_database_schema` for complex questions
2. **Write clear, readable SQL**:
   - Use meaningful aliases (e.g., `u` for users, `e` for entries)
   - Format with proper indentation
   - Use explicit column names instead of SELECT *
   - Add comments for complex queries
3. **Optimize queries**:
   - Use appropriate JOINs (INNER, LEFT, RIGHT)
   - Add WHERE clauses to filter unnecessary data
   - Use LIMIT for large result sets
   - Use ORDER BY for sorted results
4. **Handle data modifications carefully**:
   - Explain what the operation will do before executing
   - Use transactions for multiple related operations
   - Always confirm before DELETE or UPDATE operations

### Response Format for Database Questions:
1. **Analysis**: "Let me check the database schema to understand the structure..."
2. **Schema Review**: Use tools to understand relevant tables and relationships
3. **SQL Construction**: "Based on the schema, I'll write a query to..."
4. **Execution**: Run the SQL query using the sql_query tool
5. **Results Interpretation**: Explain what the results mean in user-friendly terms
6. **Follow-up**: Suggest related queries or ask if they need additional information

### Error Handling:
- If a query fails, explain the error and suggest corrections
- If tables don't exist, use `list_tables` to show available options
- For complex requests, break them down into smaller, manageable queries

Remember: Always use the SQL tools to execute queries rather than just showing SQL code. Users want actual results from their database!
"""

    def _format_schema_for_prompt(self, schema_result: Dict[str, Any]) -> str:
        """DEPRECATED: Format database schema result into readable text for prompt"""
        # This method is no longer used with SQLTool implementation
        logger.warning("_format_schema_for_prompt is deprecated with SQLTool")
        return "Schema formatting not available with current SQLTool implementation"
    
    def _get_sql_prompt(self, schema_text: str) -> str:
        """Create specialized prompt for database interaction using prompt manager"""
        try:
            return get_sql_prompt(schema_text)
        except Exception as e:
            logger.warning(f"Error getting SQL prompt from prompt manager: {e}")
            # Fallback to enhanced prompt with schema
            return f"""

## Database Information & SQL Tools
You have access to a PostgreSQL database with the following schema:

```
{schema_text}
```

### Available SQL Tools:
1. **sql_query**: Execute SQL queries against the database
2. **get_database_schema**: Retrieve updated schema information if needed
3. **list_tables**: Get a list of all available tables

### Database Interaction Guidelines:

#### For Data Retrieval Questions:
1. **Analyze the schema above** to identify relevant tables and relationships
2. **Construct efficient SQL queries** using proper JOINs and WHERE clauses
3. **Execute queries immediately** using the `sql_query` tool
4. **Interpret and explain results** in user-friendly language

#### SQL Query Best Practices:
- **Use table aliases** for readability (e.g., `u` for users, `e` for entries)
- **Specify columns explicitly** instead of using SELECT *
- **Apply appropriate filters** with WHERE clauses
- **Use JOINs correctly** based on foreign key relationships shown above
- **Add ORDER BY** for meaningful sorting
- **Use LIMIT** for large datasets to avoid overwhelming output

#### Response Workflow:
1. **Quick Schema Analysis**: "Based on the database schema, I can see..."
2. **SQL Query Construction**: "I'll query the [table_name] table to..."
3. **Immediate Execution**: Use sql_query tool to run the query
4. **Results Explanation**: "The results show..." with user-friendly interpretation
5. **Additional Insights**: Suggest related queries or point out interesting patterns

#### For Data Modification Requests:
1. **Explain the operation** before executing
2. **Show the SQL query** that will be used
3. **Warn about potential impacts** (especially for UPDATE/DELETE)
4. **Ask for confirmation** if the operation affects multiple records
5. **Execute and confirm** the operation was successful

#### Error Handling:
- If a query fails, **explain the error** and **provide a corrected version**
- If requested tables don't exist, **reference the schema above** and suggest alternatives
- For complex requests, **break them into smaller steps** with multiple queries

### Key Principles:
- **Always execute SQL queries** using the sql_query tool - don't just show code
- **Provide actual database results** to answer user questions
- **Explain technical concepts** in business-friendly terms
- **Be proactive** in suggesting additional useful queries
- **Maintain data integrity** and warn about risky operations

Remember: Your goal is to help users get actionable insights from their data by executing real SQL queries and explaining the results clearly!
"""

    def _create_dummy_schema(self) -> str:
        """DEPRECATED: Create a dummy schema when no tables are available in the database"""
        # This method is no longer used with SQLTool implementation
        logger.warning("_create_dummy_schema is deprecated with SQLTool")
        return "No schema information available with current SQLTool implementation"

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

    async def chat_with_agent_streaming(self, message: str):
        """Stream agent responses while maintaining access to tools"""
        try:
            # Use astream_events for more granular control over streaming
            collected_tokens = []
            tool_usage_messages = []
            
            async for event in self.agent_executor.astream_events(
                {"input": message}, 
                version="v1"
            ):
                event_type = event.get("event", "")
                event_data = event.get("data", {})
                
                # Handle different event types
                if event_type == "on_chat_model_stream":
                    # Direct streaming from the LLM - this gives us real token streaming
                    chunk = event_data.get("chunk", {})
                    if hasattr(chunk, 'content') and chunk.content:
                        collected_tokens.append(chunk.content)
                        yield chunk.content
                elif event_type == "on_tool_start":
                    # Tool execution started
                    tool_name = event_data.get("input", {}).get("tool", "unknown")
                    tool_msg = f"\n🔧 Using tool: {tool_name}...\n"
                    tool_usage_messages.append(tool_msg)
                    yield tool_msg
                elif event_type == "on_tool_end":
                    # Tool execution completed
                    tool_result = event_data.get("output", "")
                    if tool_result:
                        result_preview = str(tool_result)[:200] + "..." if len(str(tool_result)) > 200 else str(tool_result)
                        tool_result_msg = f"📋 Tool result: {result_preview}\n"
                        tool_usage_messages.append(tool_result_msg)
                        yield tool_result_msg
                elif event_type == "on_agent_finish":
                    # Agent finished - get final output if no tokens were streamed
                    output = event_data.get("output", "")
                    if output and not collected_tokens:
                        # If no streaming tokens were captured, yield the final output
                        yield output
                    elif output and collected_tokens:
                        # Check if there's additional content not yet streamed
                        streamed_content = "".join(collected_tokens)
                        if len(output) > len(streamed_content):
                            remaining_content = output[len(streamed_content):]
                            if remaining_content.strip():
                                yield remaining_content
            
            # If no content was yielded at all, provide a fallback
            if not collected_tokens and not tool_usage_messages:
                yield "✅ Task completed."
                        
        except Exception as e:
            logger.error(f"Error in agent streaming: {e}")
            yield f"Agent error: {str(e)}"

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