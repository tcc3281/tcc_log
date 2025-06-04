import logging
from typing import Dict, List, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from langchain_core.tools import Tool
import os
from urllib.parse import urlparse, quote_plus

logger = logging.getLogger(__name__)

class PostgreSQLTool:
    def __init__(
            self,
            database_url: Optional[str] = None
    ):
        if database_url is None:
            database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("Database URL must be provided or set in the environment variable DATABASE_URL")
        
        self.database_url = database_url
        self.connection = None
        self.connect()
    
    def connect(self):
        """Establish a connection to the PostgreSQL database."""
        try:
            # When using psycopg2, it's better to parse the connection URL manually
            # if it contains special characters like ? in the password
            if self.database_url.startswith('postgresql'):
                try:
                    # Try to connect directly with the URL first
                    self.connection = psycopg2.connect(self.database_url, cursor_factory=RealDictCursor)
                except Exception as e:
                    # If that fails, try to parse the URL and connect with parameters
                    if "missing '='" in str(e) and "?" in self.database_url:
                        # Extract connection parameters from the URL
                        # Format: postgresql+psycopg2://user:password@host:port/dbname
                        parts = self.database_url.split('://', 1)
                        if len(parts) == 2:
                            scheme = parts[0]
                            rest = parts[1]
                            
                            # Find user:password
                            auth_host_split = rest.split('@', 1)
                            if len(auth_host_split) == 2:
                                auth, host_rest = auth_host_split
                                user_pass = auth.split(':', 1)
                                if len(user_pass) == 2:
                                    username, password = user_pass
                                    # Construct connection parameters
                                    conn_params = {
                                        'user': username,
                                        'password': password,
                                        'host': host_rest.split(':', 1)[0] if ':' in host_rest else host_rest.split('/')[0],
                                        'port': host_rest.split(':', 1)[1].split('/')[0] if ':' in host_rest else '5432',
                                        'dbname': host_rest.split('/')[-1] if '/' in host_rest else 'postgres'
                                    }
                                    self.connection = psycopg2.connect(**conn_params, cursor_factory=RealDictCursor)
                                else:
                                    raise ValueError(f"Could not parse authentication part of the URL: {auth}")
                            else:
                                raise ValueError(f"Could not parse URL: {self.database_url}")
                        else:
                            raise e
                    else:
                        raise e
            else:
                # Not a URL format, assume it's already in connection parameters format
                self.connection = psycopg2.connect(self.database_url, cursor_factory=RealDictCursor)
            
            logger.info("Connected to the PostgreSQL database.")
        except Exception as e:
            logger.error(f"Failed to connect to the database: {e}")
            raise

    def _get_connection(self):
        """Get a connection to the database, reconnecting if necessary."""
        if self.connection is None or self.connection.closed:
            self.connect()
        return self.connection
    
    def execute_query(self, query: str) -> Dict[str, Any]:
        """Thực thi truy vấn SQL và trả về kết quả"""
        conn = None
        cursor = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute(query)
            
            # Nếu là truy vấn SELECT, lấy kết quả
            if query.strip().upper().startswith(('SELECT', 'WITH')):
                results = cursor.fetchall()
                conn.commit()
                return {
                    "success": True,
                    "result": [dict(row) for row in results],
                    "row_count": len(results)
                }
            else:
                # Các truy vấn khác (INSERT, UPDATE, DELETE...)
                row_count = cursor.rowcount
                conn.commit()
                return {
                    "success": True,
                    "row_count": row_count,
                    "message": f"Query executed successfully. Affected rows: {row_count}"
                }
        except Exception as e:
            logger.error(f"Error executing query: {e}")
            if conn:
                conn.rollback()
            return {
                "success": False,
                "error": str(e)
            }
        finally:
            if cursor:
                cursor.close()

    def get_table_columns(self, table_name: str) -> List[Dict[str, str]]:
        """Get column information for a specific table."""
        query = f"""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = '{table_name}'
            ORDER BY ordinal_position
        """
        result = self.execute_query(query)
        if result.get("success", False):
            return result.get("result", [])
        return []

    def inspect_data_sample(self, table_name: str, limit: int = 5) -> Dict[str, Any]:
        """Get a sample of data from a specified table."""
        query = f"SELECT * FROM {table_name} LIMIT {limit}"
        return self.execute_query(query)

    def get_primary_keys(self, table_name: str) -> List[str]:
        """Get primary key columns for a table."""
        query = f"""
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY'
                AND kcu.table_name = '{table_name}'
        """
        result = self.execute_query(query)
        if result.get("success", False):
            return [row['column_name'] for row in result.get("result", [])]
        return []

    def get_foreign_keys(self, table_name: str) -> List[Dict[str, Any]]:
        """Get foreign key relationships for a table."""
        query = f"""
            SELECT
                kcu.column_name,
                ccu.table_name AS foreign_table,
                ccu.column_name AS foreign_column
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu
                ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND kcu.table_name = '{table_name}'
        """
        result = self.execute_query(query)
        if result.get("success", False):
            return result.get("result", [])
        return []

    def get_table_info(self, table_name: str) -> Dict[str, Any]:
        """Get comprehensive information about a table."""
        columns = self.get_table_columns(table_name)
        primary_keys = self.get_primary_keys(table_name)
        foreign_keys = self.get_foreign_keys(table_name)
        
        return {
            "table_name": table_name,
            "columns": columns,
            "primary_keys": primary_keys,
            "foreign_keys": foreign_keys
        }

    def get_all_tables(self) -> List[str]:
        """Get list of all tables in the database."""
        query = """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """
        result = self.execute_query(query)
        if result.get("success", False):
            return [row['table_name'] for row in result.get("result", [])]
        return []

    def get_database_schema(self) -> Dict[str, Any]:
        """Lấy toàn bộ schema của database."""
        try:
            tables = self.get_all_tables()
            schema = {
                "success": True,
                "tables": []
            }
            
            for table_name in tables:
                table_info = self.get_table_info(table_name)
                schema["tables"].append(table_info)
                
            return schema
        except Exception as e:
            logger.error(f"Error getting database schema: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def get_table_relationships(self) -> Dict[str, Any]:
        """Lấy tất cả mối quan hệ giữa các bảng trong database"""
        try:
            query = """
            SELECT
                tc.table_name as source_table,
                kcu.column_name as source_column,
                ccu.table_name AS target_table,
                ccu.column_name AS target_column,
                tc.constraint_name
            FROM
                information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
            WHERE
                tc.constraint_type = 'FOREIGN KEY'
            ORDER BY source_table, target_table
            """
            
            result = self.execute_query(query)
            if result.get("success"):
                # Tổ chức dữ liệu thành cấu trúc dễ đọc hơn
                relationships = {}
                for row in result.get("result", []):
                    source_table = row.get("source_table")
                    if source_table not in relationships:
                        relationships[source_table] = []
                    
                    relationships[source_table].append({
                        "source_column": row.get("source_column"),
                        "target_table": row.get("target_table"),
                        "target_column": row.get("target_column"),
                        "constraint_name": row.get("constraint_name")
                    })
                
                return {
                    "success": True,
                    "relationships": relationships
                }
            else:
                return result  # Return error from execute_query
        except Exception as e:
            logger.error(f"Error getting table relationships: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_table_sizes(self) -> Dict[str, Any]:
        """Lấy thông tin về kích thước của các bảng trong database"""
        try:
            query = """
            SELECT
                table_name,
                pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as total_size,
                pg_size_pretty(pg_relation_size(quote_ident(table_name))) as table_size,
                pg_size_pretty(pg_total_relation_size(quote_ident(table_name)) - 
                               pg_relation_size(quote_ident(table_name))) as index_size,
                pg_total_relation_size(quote_ident(table_name)) as total_bytes
            FROM
                information_schema.tables
            WHERE
                table_schema = 'public'
            ORDER BY
                total_bytes DESC
            """
            
            return self.execute_query(query)
        except Exception as e:
            logger.error(f"Error getting table sizes: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def analyze_query(self, query: str) -> Dict[str, Any]:
        """Phân tích truy vấn SQL để kiểm tra lỗi và tối ưu hóa"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Phân tích truy vấn mà không chạy nó
            query_analysis = f"""
            EXPLAIN (FORMAT JSON, ANALYZE FALSE) 
            {query}
            """
            cursor.execute(query_analysis)
            result = cursor.fetchall()
            
            return {
                "success": True,
                "analysis": result[0] if len(result) > 0 else {},
                "query": query
            }
        except Exception as e:
            logger.error(f"Error analyzing query: {e}")
            return {
                "success": False,
                "error": str(e),
                "query": query
            }
        finally:
            if cursor:
                cursor.close()
    
    def get_langchain_tools(self) -> List[Tool]:
        """Trả về danh sách các công cụ LangChain để sử dụng trong AI agent."""
        return [
            Tool(
                name="database_query",
                description="Execute SQL queries on the PostgreSQL database. Use this for SELECT, INSERT, UPDATE, DELETE operations.",
                func=self.execute_query,
            ),
            Tool(
                name="get_database_schema",
                description="Get the full database schema including tables, columns, relationships, and primary keys.",
                func=self.get_database_schema,
            ),
            Tool(
                name="analyze_query", 
                description="Analyze a SQL query for potential issues or optimization without executing it.",
                func=self.analyze_query,
            ),
            Tool(
                name="get_table_info", 
                description="Get detailed information about a specific table structure.",
                func=self.get_table_columns,
            ),
            Tool(
                name="inspect_data",
                description="Get a sample of data from a table to understand its contents.",
                func=self.inspect_data_sample,
            ),
            Tool(
                name="get_table_relationships",
                description="Get all relationships between tables in the database.",
                func=self.get_table_relationships,
            ),
            Tool(
                name="get_table_sizes",
                description="Get information about the data size of tables in the database.",
                func=self.get_table_sizes,
            )
        ]
    
    def __call__(self, query: str) -> Dict[str, Any]:
        """Make the tool callable directly with a query string"""
        return self.execute_query(query)
