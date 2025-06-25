#!/usr/bin/env python3
"""
Manual test of SQL post-processing function
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.ai.lm_studio import _post_process_sql_execution, COLORS
from dotenv import load_dotenv

async def test_sql_postprocess():
    print(f'{COLORS["CYAN"]}🧪 Manual SQL Post-Processing Test{COLORS["RESET"]}')
    
    # Sample agent response with SQL code
    sample_response = """
To find how many users exist, I'll run this query:

```sql
SELECT COUNT(*) FROM users
```

I will execute this using the database_query tool.

database_query("SELECT COUNT(*) FROM users")

Let me run this now.
    """
    
    print(f'{COLORS["BLUE"]}Sample response content:{COLORS["RESET"]}')
    print(sample_response[:200] + "...")
    
    print(f'\n{COLORS["YELLOW"]}Testing SQL post-processing...{COLORS["RESET"]}\n')
    
    try:
        await _post_process_sql_execution(sample_response, streaming=True)
        print(f'\n{COLORS["GREEN"]}✅ Post-processing completed{COLORS["RESET"]}')
    except Exception as e:
        print(f'\n{COLORS["RED"]}❌ Post-processing error: {e}{COLORS["RESET"]}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(test_sql_postprocess()) 