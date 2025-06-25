#!/usr/bin/env python3
"""
Test broken SQL markdown block parsing
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.ai.lm_studio import _post_process_sql_execution, COLORS
from dotenv import load_dotenv

async def test_broken_sql_blocks():
    print(f'{COLORS["CYAN"]}🧪 Testing Broken SQL Block Parsing{COLORS["RESET"]}')
    
    # Test cases with broken SQL markdown
    test_cases = [
        {
            "name": "Broken SQL block (no newline)",
            "content": """
To count entries, I'll run this query:

```sqlSELECT COUNT(*) FROM entries e JOIN topics t ON e.topic_id = t.topic_id WHERE t.topic_name = 'Career';
```

This should give us the count.
            """
        },
        {
            "name": "Proper SQL block (with newline)", 
            "content": """
To count entries, I'll run this query:

```sql
SELECT COUNT(*) FROM entries e 
JOIN topics t ON e.topic_id = t.topic_id 
WHERE t.topic_name = 'Career';
```

This should give us the count.
            """
        },
        {
            "name": "Python code block",
            "content": """
```python
result = database_query(\"\"\"
SELECT COUNT(*) FROM entries e
JOIN topics t ON e.topic_id = t.topic_id
WHERE t.topic_name = 'Career';
\"\"\")
print(result)
```
            """
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f'\n{COLORS["BLUE"]}=== Test {i}: {test_case["name"]} ==={COLORS["RESET"]}')
        print(f'Content preview: {test_case["content"][:100]}...')
        
        try:
            result = await _post_process_sql_execution(test_case["content"], streaming=True)
            
            if result and result.get("success", False):
                print(f'{COLORS["GREEN"]}✅ SQL executed successfully!{COLORS["RESET"]}')
                print(f'Query: {result.get("query", "N/A")}')
                print(f'Result: {result.get("value", "N/A")}')
            else:
                print(f'{COLORS["YELLOW"]}⚠️ No SQL execution detected{COLORS["RESET"]}')
                
        except Exception as e:
            print(f'{COLORS["RED"]}❌ Error: {e}{COLORS["RESET"]}')
    
    print(f'\n{COLORS["CYAN"]}🎯 Test completed{COLORS["RESET"]}')

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(test_broken_sql_blocks()) 