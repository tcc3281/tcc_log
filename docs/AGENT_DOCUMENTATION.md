# 🤖 LangChain Agent Documentation

## 🎯 Tổng quan

File `agent.py` chứa implementation của `LangChainAgent` class - một wrapper thông minh xung quanh LangChain's OpenAI Functions Agent. Class này được thiết kế để cung cấp khả năng chat với AI model kèm theo tool access (đặc biệt là SQL tools) và multiple streaming modes.

## 🏗️ Kiến trúc tổng thể

```
User Message → LangChainAgent → [Tool Planning] → Tool Execution → LLM Response
                    ↓
              Memory Management → Conversation History → Context Preservation
                    ↓
              Multiple Streaming Modes → Real-time Response Generation
```

## 📋 Cấu trúc File

### 1. **Imports & Dependencies (Dòng 1-30)**

```python
import logging
from typing import Optional, List, Dict, Any
import os

# Import từ lm_studio
from app.ai.lm_studio import (
    get_chatopen_ai_instance, DEFAULT_AI_MODEL, DEFAULT_TEMPERATURE,
    DEFAULT_MAX_TOKENS, AI_MODEL, query_lm_studio_stream,
    create_ai_request, AIRequest, AIMessage
)

# Import prompt manager
from app.ai.prompt_manager import get_prompt_manager, get_system_prompt, get_sql_prompt

# LangChain imports
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

# Import SQL Tools
from app.ai.sql_tool import PostgreSQLTool
```

**Mục đích**: 
- Tích hợp với `lm_studio.py` cho LLM access
- Import LangChain components cho agent functionality
- Import SQL tools cho database interaction
- Setup logging và typing

### 2. **LangChainAgent Class Definition**

#### `__init__()` - Agent Initialization
```python
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
        
        # Escape curly braces in system_prompt để tránh format errors
        self.system_prompt = system_prompt or get_system_prompt("default_chat")
        self.system_prompt = self.system_prompt.replace("{", "{{").replace("}", "}}")
        
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
                MessagesPlaceholder(variable_name="agent_scratchpad")  # Cho agent reasoning
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
```

**Key Features**:
- **Flexible Configuration**: Support custom model, temperature, max_tokens
- **Auto-tool Loading**: Tự động load SQL tools nếu có database connection
- **Memory Management**: ConversationBufferMemory cho conversation history
- **Error Handling**: Comprehensive error handling trong initialization
- **Prompt Template**: ChatPromptTemplate với placeholders cho history và scratchpad
- **Callback Integration**: Custom streaming callback handler

#### **Core Methods**

### 3. **Basic Query Method**

#### `query()` - Simple Query Processing
```python
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
```

**Tính năng**:
- **Synchronous Processing**: Blocking call cho simple use cases
- **Error Handling**: Graceful error handling với Vietnamese error messages
- **Structured Response**: Consistent response format

#### `clear_memory()` - Memory Management
```python
def clear_memory(self):
    """Clear the conversation memory"""
    self.memory.clear()
```

### 4. **SQL Tool Integration System**

#### `__add__postgre_sql_tool()` - Auto SQL Tool Setup
```python
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
```

**Auto-Configuration Features**:
- **Environment Detection**: Tự động detect DATABASE_URL
- **Schema Integration**: Inject database schema vào system prompt
- **Tool Registration**: Tự động add SQL tools vào agent
- **Fallback Strategy**: Use dummy schema nếu connection fails
- **Error Resilience**: Graceful handling của database connection issues

#### `_format_schema_for_prompt()` - Schema Formatting
```python
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
```

**Schema Formatting Features**:
- **Comprehensive Table Info**: Table names, columns, data types
- **Relationship Mapping**: Primary keys và foreign key relationships
- **Human-Readable Format**: Well-formatted text cho AI model
- **Nullable Information**: Include nullable constraints
- **Error Handling**: Graceful handling của missing data

#### `_create_dummy_schema()` - Fallback Schema
```python
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
```

**Fallback Features**:
- **Instructional Content**: Provide examples của how to create tables
- **Best Practices**: Show good SQL patterns
- **Helpful Guidance**: Guide user to setup database properly

### 5. **🌊 Streaming Chat Methods**

#### `chat()` - Basic Streaming Chat
```python
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
```

**Streaming Features**:
- **Multi-chunk Processing**: Handle different types of chunks từ agent
- **Action Visibility**: Show agent thinking process với "🤔 Thinking"
- **Tool Usage Tracking**: Display tool usage với "🔧 Using tool"
- **Result Preview**: Show tool results với truncation
- **Fallback Messaging**: Provide default message nếu no content
- **Error Resilience**: Graceful error handling

#### `astream_events()` - Advanced Event Streaming
```python
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
```

**Advanced Streaming Features**:
- **Event-based Architecture**: Handle specific LangChain events
- **Granular Control**: Fine-grained control over streaming process
- **LLM Token Streaming**: Direct access to LLM token-level streaming
- **Tool Lifecycle**: Track tool start và end events
- **Agent Completion**: Handle agent finish events

#### `chat_with_real_streaming()` - Token-level Streaming
```python
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
```

**Real Streaming Features**:
- **Token-level Granularity**: True token-by-token streaming
- **Async Task Management**: Background agent execution
- **Live Monitoring**: Real-time token monitoring while agent runs
- **Callback Integration**: Use custom streaming callback handler
- **Fallback Strategy**: Yield final output nếu no tokens captured

#### `chat_with_direct_streaming()` - Direct LLM Streaming
```python
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
```

**Direct Streaming Features**:
- **Agent Bypass**: Direct LLM access bypassing agent overhead
- **Integration với lm_studio**: Use proven streaming từ lm_studio.py
- **Message Conversion**: Convert LangChain messages to AIRequest format
- **Stats Filtering**: Filter out statistics messages
- **Performance**: Faster streaming without agent processing

#### `chat_with_agent_streaming()` - **RECOMMENDED METHOD**
```python
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
```

**Best Streaming Features**:
- **Tool Access Maintained**: Full agent capabilities với tools
- **Real Token Streaming**: True LLM token-level streaming
- **Tool Visibility**: Clear indication của tool usage
- **Content Completeness**: Ensure no content is lost
- **Fallback Handling**: Comprehensive fallback strategies
- **Performance Balance**: Optimal balance between features và performance

### 6. **🔧 AgentStreamingCallbackHandler - Custom Callback**

```python
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
```

**Callback Features**:
- **Token Capture**: Capture individual tokens as they're generated
- **Content Accumulation**: Build complete content from tokens
- **Lifecycle Management**: Handle LLM start/token events
- **State Management**: Provide access to tokens và content
- **Reset Capability**: Clear state between different calls

## 🚀 Key Features & Innovations

### 1. **Multi-Modal Streaming Architecture**
- **4 Different Streaming Methods**: From basic streaming đến real token-level
- **Flexible Interface**: Choose streaming mode based on requirements
- **Performance Optimization**: Balance between features và speed
- **Fallback Strategies**: Graceful degradation across all modes

### 2. **Intelligent Tool Integration**
- **Auto-discovery**: Automatic SQL tool loading based on environment
- **Schema Injection**: Dynamic database schema integration
- **Tool Lifecycle Tracking**: Comprehensive tool usage visibility
- **Error Recovery**: Graceful handling của tool failures

### 3. **Advanced Memory Management**
- **ConversationBufferMemory**: Persistent conversation history
- **Context Preservation**: Maintain context across multiple interactions
- **Memory Control**: Clear memory when needed
- **History Integration**: Seamless integration với LangChain memory systems

### 4. **Event-Driven Architecture**
- **LangChain Events**: Deep integration với LangChain event system
- **Real-time Feedback**: Live updates về agent activities
- **Tool Monitoring**: Real-time tool execution tracking
- **Error Events**: Comprehensive error event handling

### 5. **Hybrid Agent/Direct Approaches**
- **Agent Mode**: Full LangChain agent với tools và reasoning
- **Direct Mode**: Bypass agent cho faster simple responses
- **Flexible Switching**: Choose approach based on query complexity
- **Performance Tuning**: Optimize cho different use cases

## 🔧 Usage Examples

### Basic Agent Chat
```python
agent = LangChainAgent(
    model_name="gpt-3.5-turbo",
    temperature=0.7,
    tools=custom_tools
)

# Simple query
result = agent.query("What's the weather like?")
print(result["response"])
```

### Streaming Chat with Tools
```python
# Recommended streaming method
async for chunk in agent.chat_with_agent_streaming(
    "Count how many users are in the database"
):
    print(chunk, end="")
```

### Advanced Event Streaming
```python
async for event in agent.astream_events(
    "Analyze our sales data and create a summary report"
):
    print(event, end="")
```

### Direct LLM Streaming (No Tools)
```python
async for chunk in agent.chat_with_direct_streaming(
    "Write a creative story about AI"
):
    print(chunk, end="")
```

### Real Token-level Streaming
```python
async for token in agent.chat_with_real_streaming(
    "Explain quantum computing in simple terms"
):
    print(token, end="")
```

## 🎯 Method Comparison

| Method | Tools Support | Streaming Quality | Performance | Use Case |
|--------|---------------|-------------------|-------------|----------|
| `query()` | ✅ | ❌ | 🔶 | Simple, non-streaming |
| `chat()` | ✅ | 🔶 | 🔶 | Basic streaming với tools |
| `astream_events()` | ✅ | ⭐⭐ | 🔶 | Advanced event streaming |
| `chat_with_real_streaming()` | ✅ | ⭐⭐⭐ | 🔶 | True token-level streaming |
| `chat_with_direct_streaming()` | ❌ | ⭐⭐⭐ | ⭐⭐⭐ | Fast simple responses |
| `chat_with_agent_streaming()` | ✅ | ⭐⭐⭐ | ⭐⭐ | **RECOMMENDED** |

## 🎯 Best Practices

### 1. **Method Selection**
- Use `chat_with_agent_streaming()` cho most use cases
- Use `chat_with_direct_streaming()` cho simple responses without tools
- Use `astream_events()` cho debugging và advanced monitoring
- Use `query()` cho simple synchronous needs

### 2. **Error Handling**
```python
try:
    async for chunk in agent.chat_with_agent_streaming(message):
        yield chunk
except Exception as e:
    logger.error(f"Agent error: {e}")
    yield f"Sorry, something went wrong: {str(e)}"
```

### 3. **Memory Management**
```python
# Clear memory for new conversation
agent.clear_memory()

# Or create new agent instance for complete reset
agent = LangChainAgent(model_name="gpt-3.5-turbo")
```

### 4. **Tool Configuration**
```python
# Custom tools
custom_tools = [
    Tool(name="calculator", func=calculate, description="Perform calculations"),
    Tool(name="weather", func=get_weather, description="Get weather info")
]

agent = LangChainAgent(tools=custom_tools)
```

## 🎯 Summary

`LangChainAgent` class cung cấp:

- **Multiple Streaming Modes** cho different performance requirements
- **Intelligent Tool Integration** với auto-discovery và schema injection
- **Advanced Memory Management** với conversation history
- **Event-Driven Architecture** với real-time feedback
- **Hybrid Approaches** cho flexibility và performance
- **Comprehensive Error Handling** với graceful degradation
- **Easy Integration** với existing lm_studio.py infrastructure

Class này được thiết kế để là một powerful và flexible interface cho AI agent interactions, balancing performance với features để provide optimal user experience.
