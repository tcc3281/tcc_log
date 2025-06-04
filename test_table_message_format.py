#!/usr/bin/env python3
"""
Test the exact format of table messages sent to frontend
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.ai.lm_studio import _post_process_sql_execution, COLORS
from dotenv import load_dotenv

async def test_table_message_format():
    print(f'{COLORS["CYAN"]}🧪 Testing Table Message Format for Frontend{COLORS["RESET"]}')
    
    # Test with SELECT * FROM users query
    test_content = """
To retrieve all users from the database, execute the following SQL query:

```sqlSELECT * FROM users;
```

This query will return all records from the `users` table.
    """
    
    print(f'{COLORS["BLUE"]}Testing message format that will be sent to frontend{COLORS["RESET"]}')
    
    try:
        result = await _post_process_sql_execution(test_content, streaming=True)
        
        if result and result.get("success", False):
            message = result.get("message", "")
            
            print(f'\n{COLORS["YELLOW"]}=== EXACT MESSAGE FORMAT FOR FRONTEND ==={COLORS["RESET"]}')
            print("=" * 80)
            print(message)
            print("=" * 80)
            
            # Check if it's proper markdown table format
            if "|" in message and "---" in message:
                print(f'{COLORS["GREEN"]}✅ Contains markdown table format{COLORS["RESET"]}')
            else:
                print(f'{COLORS["RED"]}❌ No markdown table detected{COLORS["RESET"]}')
                
            # Check if it's wrapped in code blocks
            if "```" in message:
                print(f'{COLORS["RED"]}❌ Message contains code block wrapping{COLORS["RESET"]}')
            else:
                print(f'{COLORS["GREEN"]}✅ No code block wrapping - will render as table{COLORS["RESET"]}')
                
        else:
            print(f'{COLORS["RED"]}❌ SQL execution failed{COLORS["RESET"]}')
            
    except Exception as e:
        print(f'{COLORS["RED"]}❌ Error: {e}{COLORS["RESET"]}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(test_table_message_format()) 