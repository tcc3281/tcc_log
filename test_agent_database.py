#!/usr/bin/env python3
"""
Test script for agent database access
"""

import asyncio
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.ai.lm_studio import chat_with_ai, COLORS
from dotenv import load_dotenv

async def test_database_access():
    print(f'{COLORS["YELLOW"]}Testing Agent Database Access...{COLORS["RESET"]}')
    
    # Test questions about database
    test_questions = [
        "What tables are available in the database?",
        "Show me the database schema",
        "Get some sample data from any table if available",
        "What's the structure of the database?"
    ]
    
    for i, question in enumerate(test_questions, 1):
        print(f'\n{COLORS["BLUE"]}=== Test {i}: {question} ==={COLORS["RESET"]}')
        
        try:
            response_chunks = []
            async for chunk in chat_with_ai(
                message=question,
                streaming=True,
                use_agent=True
            ):
                if isinstance(chunk, str):
                    response_chunks.append(chunk)
                    print(chunk, end="", flush=True)
            
            full_response = "".join(response_chunks)
            
            # Check if agent actually used database tools
            if any(indicator in full_response for indicator in ["🔧", "📋", "Tool result", "database", "schema", "table"]):
                print(f'\n{COLORS["GREEN"]}✅ Agent seems to have used database tools{COLORS["RESET"]}')
            else:
                print(f'\n{COLORS["RED"]}❌ Agent may not have used database tools{COLORS["RESET"]}')
                print(f'{COLORS["YELLOW"]}Response preview: {full_response[:200]}...{COLORS["RESET"]}')
            
            # Wait between tests
            await asyncio.sleep(2)
            
        except Exception as e:
            print(f'\n{COLORS["RED"]}Error in test {i}: {e}{COLORS["RESET"]}')

async def test_database_connection():
    """Test direct database connection"""
    print(f'\n{COLORS["YELLOW"]}Testing Direct Database Connection...{COLORS["RESET"]}')
    
    try:
        from app.ai.sql_tool import PostgreSQLTool
        database_url = os.getenv("DATABASE_URL")
        
        if not database_url:
            print(f'{COLORS["RED"]}❌ No DATABASE_URL found{COLORS["RESET"]}')
            return
        
        print(f'{COLORS["BLUE"]}DATABASE_URL: {database_url[:50]}...{COLORS["RESET"]}')
        
        # Test direct connection
        pg_tool = PostgreSQLTool(database_url)
        schema_result = pg_tool.get_database_schema()
        
        if schema_result.get("success", False):
            tables = schema_result.get("tables", [])
            print(f'{COLORS["GREEN"]}✅ Database connection successful{COLORS["RESET"]}')
            print(f'{COLORS["CYAN"]}Found {len(tables)} tables{COLORS["RESET"]}')
            
            # Show table names
            for table in tables[:3]:  # Show first 3 tables
                table_name = table.get("table_name", "unknown")
                column_count = len(table.get("columns", []))
                print(f'{COLORS["WHITE"]}  - {table_name} ({column_count} columns){COLORS["RESET"]}')
                    
        else:
            print(f'{COLORS["RED"]}❌ Database connection failed: {schema_result.get("error", "Unknown error")}{COLORS["RESET"]}')
            
    except Exception as e:
        print(f'{COLORS["RED"]}❌ Database test error: {e}{COLORS["RESET"]}')
        import traceback
        traceback.print_exc()

async def main():
    """Run all tests"""
    print(f'{COLORS["MAGENTA"]}{COLORS["BOLD"]}🧪 Agent Database Testing{COLORS["RESET"]}')
    
    # Test direct database connection first
    await test_database_connection()
    
    # Wait a bit
    await asyncio.sleep(2)
    
    # Test agent database access
    await test_database_access()
    
    print(f'\n{COLORS["MAGENTA"]}{COLORS["BOLD"]}✅ All database tests completed{COLORS["RESET"]}')

if __name__ == "__main__":
    load_dotenv()
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f'\n{COLORS["YELLOW"]}⚠️  Tests interrupted{COLORS["RESET"]}')
    except Exception as e:
        print(f'\n{COLORS["RED"]}💥 Test error: {e}{COLORS["RESET"]}') 