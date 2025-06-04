#!/usr/bin/env python3
"""
Debug agent PostgreSQL tool error
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.ai.sql_tool import PostgreSQLTool
from app.ai.lm_studio import COLORS
from dotenv import load_dotenv

def debug_agent_error():
    print(f'{COLORS["CYAN"]}🔍 Debugging Agent PostgreSQL Tool Error{COLORS["RESET"]}')
    
    try:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            print(f'{COLORS["RED"]}❌ No DATABASE_URL found{COLORS["RESET"]}')
            return
        
        print(f'{COLORS["BLUE"]}📡 Connecting to database...{COLORS["RESET"]}')
        pg_tool = PostgreSQLTool(database_url)
        
        print(f'{COLORS["BLUE"]}📋 Getting database schema...{COLORS["RESET"]}')
        schema_result = pg_tool.get_database_schema()
        
        print(f'{COLORS["YELLOW"]}Schema result:{COLORS["RESET"]}')
        print(f"Success: {schema_result.get('success', False)}")
        print(f"Error: {schema_result.get('error', 'None')}")
        
        if schema_result.get("success", False):
            tables = schema_result.get("tables", [])
            print(f'{COLORS["GREEN"]}✅ Found {len(tables)} tables{COLORS["RESET"]}')
            
            for i, table in enumerate(tables[:3]):  # Check first 3 tables
                print(f'\n{COLORS["CYAN"]}Table {i+1}: {table.get("table_name", "unknown")}{COLORS["RESET"]}')
                
                # Check table structure
                print(f"Keys in table object: {list(table.keys())}")
                
                columns = table.get("columns", [])
                print(f"Columns count: {len(columns)}")
                
                if columns:
                    print(f"First column keys: {list(columns[0].keys())}")
                    print(f"First column: {columns[0]}")
                
                # Check primary_keys structure
                primary_keys = table.get("primary_keys", [])
                print(f"Primary keys: {primary_keys}")
                print(f"Primary keys type: {type(primary_keys)}")
                
                # Check foreign_keys structure
                foreign_keys = table.get("foreign_keys", [])
                print(f"Foreign keys count: {len(foreign_keys)}")
                if foreign_keys:
                    print(f"First foreign key: {foreign_keys[0]}")
                    print(f"First foreign key keys: {list(foreign_keys[0].keys())}")
        
        print(f'\n{COLORS["BLUE"]}🧪 Testing _format_schema_for_prompt...{COLORS["RESET"]}')
        
        # Test the format function manually
        try:
            from app.ai.agent import LangChainAgent
            agent = LangChainAgent()
            
            if schema_result.get("success", False):
                formatted_schema = agent._format_schema_for_prompt(schema_result)
                print(f'{COLORS["GREEN"]}✅ Schema formatting successful{COLORS["RESET"]}')
                print(f"Schema length: {len(formatted_schema)}")
                print(f"Schema preview: {formatted_schema[:200]}...")
            else:
                print(f'{COLORS["RED"]}❌ Schema result not successful{COLORS["RESET"]}')
                
        except Exception as format_error:
            print(f'{COLORS["RED"]}❌ Error in _format_schema_for_prompt: {format_error}{COLORS["RESET"]}')
            import traceback
            traceback.print_exc()
            
    except Exception as e:
        print(f'{COLORS["RED"]}❌ Error: {e}{COLORS["RESET"]}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    load_dotenv()
    debug_agent_error() 