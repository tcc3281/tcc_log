import logging
from typing import Dict, List, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from langchain_core.tools import Tool
import os
from urllib.parse import urlparse, quote_plus
from langchain_core.tools import BaseTool
from langchain_core.tools.base import ArgsSchema
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class SQLToolArgs(BaseModel):
    """Arguments for the SQL tool"""
    query: str = Field(..., description="The SQL query to execute")

class SQLTool(BaseTool):
    """Tool for executing SQL queries against a PostgreSQL database"""
    
    name: str = "sql_tool"
    description: str = "Execute SQL queries against the configured PostgreSQL database."
    args_schema: ArgsSchema = SQLToolArgs
    
    def __init__(self, db_url: str, **kwargs):
        super().__init__(**kwargs)
        # Use object.__setattr__ to bypass Pydantic validation for private attributes
        object.__setattr__(self, '_db_url', db_url)
        object.__setattr__(self, 'connection', None)
        self.connect()

    def __del__(self):
        """Close connection when object is destroyed"""
        try:
            self._close_connection()
        except:
            pass

    def connect(self):
        """Establish a connection to the PostgreSQL database"""
        try:
            parsed_url = urlparse(object.__getattribute__(self, '_db_url'))
            dbname = parsed_url.path[1:]  # Remove leading '/'
            user = parsed_url.username
            password = quote_plus(parsed_url.password) if parsed_url.password else ''
            host = parsed_url.hostname
            port = parsed_url.port or 5432
            
            connection = psycopg2.connect(
                dbname=dbname,
                user=user,
                password=password,
                host=host,
                port=port
            )
            object.__setattr__(self, 'connection', connection)
            logger.info("Connected to the PostgreSQL database successfully.")
        except Exception as e:
            logger.error(f"Failed to connect to the database: {e}")
            raise

    def _run_query(self, query: str) -> List[Dict[str, Any]]:
        """Execute a SQL query and return the results"""
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query)
            return cursor.fetchall()

    def _close_connection(self):
        """Close the database connection"""
        if self.connection:
            self.connection.close()
            logger.info("Database connection closed.")

    def _run(self, query: str) -> Dict[str, Any]:
        """Run the SQL query and return results"""
        try:
            if not self.connection:
                self.connect()
            results = self._run_query(query)
            return {"results": results}
        except Exception as e:
            logger.error(f"Error executing query '{query}': {e}")
            return {"error": str(e)}

    def _arun(self, query: str) -> Dict[str, Any]:
        """Asynchronous version of run method (not implemented)"""
        raise NotImplementedError("Asynchronous execution is not implemented for SQLTool.")
    
    # Schema inspection methods for compatibility with agent/lm_studio expectations
    def get_database_schema(self) -> Dict[str, Any]:
        """Get database schema information"""
        try:
            if not self.connection:
                self.connect()
            
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Get all tables in public schema
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    ORDER BY table_name;
                """)
                tables_data = cursor.fetchall()
                
                schema_info = {"success": True, "tables": []}
                
                for table_row in tables_data:
                    table_name = table_row['table_name']
                    table_info = {
                        "table_name": table_name,
                        "columns": [],
                        "primary_keys": [],
                        "foreign_keys": []
                    }
                    
                    # Get column information
                    cursor.execute("""
                        SELECT column_name, data_type, is_nullable, column_default
                        FROM information_schema.columns 
                        WHERE table_schema = 'public' AND table_name = %s
                        ORDER BY ordinal_position;
                    """, (table_name,))
                    columns = cursor.fetchall()
                    
                    for col in columns:
                        table_info["columns"].append({
                            "column_name": col['column_name'],
                            "data_type": col['data_type'],
                            "is_nullable": col['is_nullable'],
                            "column_default": col['column_default']
                        })
                    
                    # Get primary keys
                    cursor.execute("""
                        SELECT kcu.column_name
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.key_column_usage kcu 
                        ON tc.constraint_name = kcu.constraint_name
                        WHERE tc.table_schema = 'public' 
                        AND tc.table_name = %s 
                        AND tc.constraint_type = 'PRIMARY KEY';
                    """, (table_name,))
                    pk_rows = cursor.fetchall()
                    table_info["primary_keys"] = [row['column_name'] for row in pk_rows]
                    
                    # Get foreign keys
                    cursor.execute("""
                        SELECT kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.key_column_usage kcu 
                        ON tc.constraint_name = kcu.constraint_name
                        JOIN information_schema.constraint_column_usage ccu 
                        ON ccu.constraint_name = tc.constraint_name
                        WHERE tc.table_schema = 'public' 
                        AND tc.table_name = %s 
                        AND tc.constraint_type = 'FOREIGN KEY';
                    """, (table_name,))
                    fk_rows = cursor.fetchall()
                    for fk_row in fk_rows:
                        table_info["foreign_keys"].append({
                            "column_name": fk_row['column_name'],
                            "foreign_table": fk_row['foreign_table'],
                            "foreign_column": fk_row['foreign_column']
                        })
                    
                    schema_info["tables"].append(table_info)
                
                # Create schema text for backward compatibility
                schema_text = self._format_schema_as_text(schema_info["tables"])
                schema_info["schema"] = schema_text
                
                return schema_info
                
        except Exception as e:
            logger.error(f"Error getting database schema: {e}")
            return {
                "success": False,
                "error": str(e),
                "tables": [],
                "schema": "Error retrieving schema"
            }
    
    def _format_schema_as_text(self, tables: List[Dict[str, Any]]) -> str:
        """Format schema information as readable text"""
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
    
    def get_all_tables(self) -> List[str]:
        """Get list of all table names in the database"""
        try:
            if not self.connection:
                self.connect()
            
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    ORDER BY table_name;
                """)
                return [row[0] for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"Error getting table names: {e}")
            return []
    
    def execute_query(self, query: str) -> Dict[str, Any]:
        """Execute query with success/result format for backward compatibility"""
        try:
            if not self.connection:
                self.connect()
            results = self._run_query(query)
            return {
                "success": True,
                "result": results,
                "row_count": len(results) if results else 0
            }
        except Exception as e:
            logger.error(f"Error executing query '{query}': {e}")
            return {
                "success": False,
                "error": str(e),
                "result": [],
                "row_count": 0
            }
    
    def get_langchain_tools(self) -> List[Tool]:
        """Get LangChain tools for agent integration"""
        tools = []
        
        # SQL execution tool
        sql_tool = Tool(
            name="sql_query",
            description="Execute SQL queries against the PostgreSQL database. Use this tool to query, insert, update, or delete data from the database.",
            func=lambda query: self._format_query_result(self.execute_query(query))
        )
        tools.append(sql_tool)
        
        # Schema inspection tool
        schema_tool = Tool(
            name="get_database_schema",
            description="Get the database schema including tables, columns, primary keys, and foreign keys.",
            func=lambda _: self._format_schema_result(self.get_database_schema())
        )
        tools.append(schema_tool)
        
        # Table list tool
        tables_tool = Tool(
            name="list_tables",
            description="Get a list of all tables in the database.",
            func=lambda _: ", ".join(self.get_all_tables())
        )
        tools.append(tables_tool)
        
        return tools
    
    def _format_query_result(self, result: Dict[str, Any]) -> str:
        """Format query result for LangChain tool output"""
        if result.get("success"):
            results = result.get("result", [])
            row_count = result.get("row_count", 0)
            
            if not results:
                return "Query executed successfully. No results returned."
            
            if len(results) == 1 and len(results[0]) == 1:
                # Single value result
                value = list(results[0].values())[0]
                return f"Query result: {value}"
            else:
                # Multiple results - format as table
                formatted_results = []
                for i, row in enumerate(results[:10]):  # Limit to 10 rows
                    row_dict = dict(row)
                    formatted_results.append(f"Row {i+1}: {row_dict}")
                
                result_str = "\n".join(formatted_results)
                if len(results) > 10:
                    result_str += f"\n... and {len(results) - 10} more rows"
                
                return f"Query executed successfully. {row_count} rows returned:\n{result_str}"
        else:
            return f"Query failed: {result.get('error', 'Unknown error')}"
    
    def _format_schema_result(self, schema_result: Dict[str, Any]) -> str:
        """Format schema result for LangChain tool output"""
        if schema_result.get("success"):
            return schema_result.get("schema", "Schema information not available")
        else:
            return f"Error getting schema: {schema_result.get('error', 'Unknown error')}"
    
    def inspect_data_sample(self, table_name: str, limit: int = 5) -> Dict[str, Any]:
        """Get a sample of data from a table for inspection"""
        try:
            query = f"SELECT * FROM {table_name} LIMIT {limit};"
            return self.execute_query(query)
        except Exception as e:
            logger.error(f"Error inspecting data from {table_name}: {e}")
            return {
                "success": False,
                "error": str(e),
                "result": [],
                "row_count": 0
            }
    
    def get_few_shot_examples(self) -> List[Dict[str, Any]]:
        """Get few-shot learning examples based on current database schema"""
        try:
            schema_info = self.get_database_schema()
            if not schema_info.get("success"):
                return []
            
            examples = []
            tables = schema_info.get("tables", [])
            
            for table in tables:
                table_name = table.get("table_name")
                columns = table.get("columns", [])
                
                # Generate count example
                examples.append({
                    "user_question": f"How many {table_name} do we have?",
                    "sql_query": f"SELECT COUNT(*) FROM {table_name}",
                    "explanation": f"Count all records in {table_name} table"
                })
                
                # Generate recent data example if has timestamp column
                timestamp_cols = [col for col in columns if 'created_at' in col.get('column_name', '').lower()]
                if timestamp_cols:
                    examples.append({
                        "user_question": f"Show me recent {table_name}",
                        "sql_query": f"SELECT * FROM {table_name} ORDER BY created_at DESC LIMIT 5",
                        "explanation": f"Get 5 most recent {table_name} ordered by creation time"
                    })
                
                # Generate specific lookup if has ID column
                id_cols = [col for col in columns if col.get('column_name', '').endswith('_id')]
                if id_cols:
                    id_col = id_cols[0]['column_name']
                    examples.append({
                        "user_question": f"Show me {table_name} with {id_col} = 1",
                        "sql_query": f"SELECT * FROM {table_name} WHERE {id_col} = 1",
                        "explanation": f"Get specific {table_name} record by {id_col}"
                    })
            
            return examples[:10]  # Limit to 10 examples
            
        except Exception as e:
            logger.error(f"Error generating few-shot examples: {e}")
            return []
    
    def get_sample_data_for_learning(self, max_tables: int = 3) -> Dict[str, Any]:
        """Get sample data from tables for few-shot learning context"""
        try:
            tables = self.get_all_tables()[:max_tables]  # Limit number of tables
            sample_data = {}
            
            for table_name in tables:
                try:
                    # Get just 2 rows as example
                    sample_result = self.inspect_data_sample(table_name, limit=2)
                    if sample_result.get("success") and sample_result.get("result"):
                        sample_data[table_name] = {
                            "sample_rows": sample_result["result"],
                            "row_count": sample_result["row_count"]
                        }
                except Exception as table_error:
                    logger.warning(f"Could not get sample data for {table_name}: {table_error}")
                    continue
            
            return {
                "success": True,
                "sample_data": sample_data,
                "tables_sampled": list(sample_data.keys())
            }
            
        except Exception as e:
            logger.error(f"Error getting sample data for learning: {e}")
            return {"success": False, "error": str(e)}
    
    def generate_learning_prompt_addition(self) -> str:
        """Generate additional prompt content with few-shot examples from actual database"""
        try:
            examples = self.get_few_shot_examples()
            sample_data = self.get_sample_data_for_learning()
            
            if not examples:
                return ""
            
            prompt_addition = "\n\n### DATABASE-SPECIFIC FEW-SHOT EXAMPLES:\n"
            prompt_addition += "Based on your current database schema, here are example interactions:\n\n"
            
            for i, example in enumerate(examples[:5], 1):  # Show first 5 examples
                prompt_addition += f"**Example {i}:**\n"
                prompt_addition += f"User: \"{example['user_question']}\"\n"
                prompt_addition += f"Action: sql_query\n"
                prompt_addition += f"Input: {example['sql_query']}\n"
                prompt_addition += f"Purpose: {example['explanation']}\n\n"
            
            # Add sample data context if available
            if sample_data.get("success") and sample_data.get("sample_data"):
                prompt_addition += "### SAMPLE DATA CONTEXT:\n"
                for table_name, data in sample_data["sample_data"].items():
                    prompt_addition += f"Table '{table_name}' contains data like:\n"
                    for row in data["sample_rows"]:
                        prompt_addition += f"  {dict(row)}\n"
                    prompt_addition += "\n"
            
            prompt_addition += "### KEY LEARNING POINTS:\n"
            prompt_addition += "- Use exact table names from your schema\n"
            prompt_addition += "- Follow the Action: sql_query → Input: [SQL] → Observation: [Result] pattern\n"
            prompt_addition += "- Always execute queries immediately for database questions\n"
            prompt_addition += "- Interpret results in user-friendly language\n"
            
            return prompt_addition
            
        except Exception as e:
            logger.error(f"Error generating learning prompt addition: {e}")
            return ""