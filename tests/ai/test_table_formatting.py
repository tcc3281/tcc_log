#!/usr/bin/env python3
"""
Test table formatting for SQL results
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.ai.lm_studio import _post_process_sql_execution, _format_query_results_as_table, COLORS
from dotenv import load_dotenv

async def test_table_formatting():
    print(f'{COLORS["CYAN"]}🧪 Testing Table Formatting{COLORS["RESET"]}')
    
    # Test with SELECT * FROM users query
    test_content = """
To retrieve all users from the database, execute the following SQL query:

```sqlSELECT * FROM users;
```

This query will return all records from the `users` table.
    """
    
    print(f'{COLORS["BLUE"]}Testing SELECT * FROM users{COLORS["RESET"]}')
    print(f'Content: {test_content.strip()[:100]}...')
    
    try:
        result = await _post_process_sql_execution(test_content, streaming=True)
        
        if result and result.get("success", False):
            print(f'{COLORS["GREEN"]}✅ SQL executed successfully!{COLORS["RESET"]}')
            print(f'Row count: {result.get("row_count", "N/A")}')
            
            # Show the formatted message
            message = result.get("message", "")
            if message:
                print(f'\n{COLORS["YELLOW"]}=== Formatted Result ==={COLORS["RESET"]}')
                print(message)
            else:
                print(f'{COLORS["RED"]}❌ No formatted message{COLORS["RESET"]}')
        else:
            print(f'{COLORS["RED"]}❌ SQL execution failed{COLORS["RESET"]}')
            
    except Exception as e:
        print(f'{COLORS["RED"]}❌ Error: {e}{COLORS["RESET"]}')
        import traceback
        traceback.print_exc()
    
    print(f'\n{COLORS["CYAN"]}🎯 Test completed{COLORS["RESET"]}')

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(test_table_formatting()) 