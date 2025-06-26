import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Add the parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.ai.sql_tool import PostgreSQLTool

# Test the connection with the fixed URL format
def test_connection():
    # Set the environment variable with the URL-encoded password
    os.environ["DATABASE_URL"] = "postgresql+psycopg2://postgres:Mayyeutao0%3F@localhost:5432/postgres"
    print(f"Using database URL: {os.environ['DATABASE_URL']}")
    
    try:
        print("Creating PostgreSQLTool instance...")
        pg_tool = PostgreSQLTool()
        print("PostgreSQLTool instance created successfully.")
        
        # Try to get all tables to verify connection
        print("Getting all tables...")
        tables = pg_tool.get_all_tables()
        print("Successfully connected to the database!")
        print(f"Tables in database: {tables}")
        
        # Test getting database schema
        print("Getting database schema...")
        schema_result = pg_tool.get_database_schema()
        print(f"Schema result success: {schema_result.get('success', False)}")
        print(f"Tables in schema: {len(schema_result.get('tables', []))}")
        
        # If there are tables, create a test entry
        if tables:
            print(f"\nTesting query on table {tables[0]}...")
            sample_data = pg_tool.inspect_data_sample(tables[0])
            print(f"Sample data from {tables[0]}: {sample_data}")
        else:
            print("No tables found in database. Creating a test table...")
            create_table_result = pg_tool.execute_query("""
                CREATE TABLE IF NOT EXISTS test_entries (
                    id SERIAL PRIMARY KEY,
                    content TEXT NOT NULL
                )
            """)
            print(f"Create table result: {create_table_result}")
            
            insert_data_result = pg_tool.execute_query("""
                INSERT INTO test_entries (content) 
                VALUES ('Test Entry 1'), ('Test Entry 2')
                ON CONFLICT DO NOTHING
            """)
            print(f"Insert data result: {insert_data_result}")
            
            # Verify data was inserted
            select_result = pg_tool.execute_query("SELECT * FROM test_entries")
            print(f"Select result: {select_result}")
            
        return True
    except Exception as e:
        logger.exception("Connection test failed")
        print(f"Connection failed: {e}")
        return False

if __name__ == "__main__":
    test_connection()
