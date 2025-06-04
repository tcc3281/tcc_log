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
    AI_MODEL
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
            
            # Create agent executor
            self.agent_executor = AgentExecutor(
                agent=self.agent,
                tools=self.tools,
                memory=self.memory,
                verbose=False,
                handle_parsing_errors=True
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