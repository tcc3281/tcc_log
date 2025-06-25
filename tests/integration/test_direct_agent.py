#!/usr/bin/env python3
"""
Direct test of agent SQL execution without API auth
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.ai.lm_studio import chat_with_ai, COLORS
from dotenv import load_dotenv

async def test_agent_direct():
    print(f'{COLORS["CYAN"]}🧪 Direct Agent SQL Test (No API){COLORS["RESET"]}')
    
    test_message = "How many users are in the database? Execute the query to show me the real count."
    
    print(f'{COLORS["BLUE"]}Message: {test_message}{COLORS["RESET"]}')
    print(f'{COLORS["YELLOW"]}Testing agent with SQL execution post-processing...{COLORS["RESET"]}\n')
    
    try:
        collected_response = ""
        sql_execution_detected = False
        actual_results_detected = False
        
        async for chunk in chat_with_ai(
            message=test_message,
            streaming=True,
            use_agent=True
        ):
            if isinstance(chunk, str):
                collected_response += chunk
                print(chunk, end="", flush=True)
                
                # Check for execution indicators
                if any(indicator in chunk for indicator in ["🔧 Executing", "✅ Query Result", "Count:"]):
                    if "🔧 Executing" in chunk:
                        sql_execution_detected = True
                    if any(result_indicator in chunk for result_indicator in ["✅ Query Result", "Count:"]):
                        actual_results_detected = True
            elif isinstance(chunk, dict) and 'content' in chunk:
                content = chunk['content']
                collected_response += content
                print(content, end="", flush=True)
        
        print(f'\n\n{COLORS["YELLOW"]}=== Analysis ==={COLORS["RESET"]}')
        print(f'SQL execution detected: {"✅" if sql_execution_detected else "❌"}')
        print(f'Actual results detected: {"✅" if actual_results_detected else "❌"}')
        
        # Check for undefined
        if "undefined" in collected_response.lower():
            print(f'{COLORS["RED"]}❌ "undefined" found in response{COLORS["RESET"]}')
        else:
            print(f'{COLORS["GREEN"]}✅ No "undefined" found{COLORS["RESET"]}')
        
        # Check for fake vs real data
        if any(pattern in collected_response for pattern in ["150", "user_count", "result = database_query"]):
            if sql_execution_detected and actual_results_detected:
                print(f'{COLORS["GREEN"]}🎉 SUCCESS: Agent executes SQL and shows real results!{COLORS["RESET"]}')
            else:
                print(f'{COLORS["YELLOW"]}⚠️  Agent provides SQL but may not execute it{COLORS["RESET"]}')
        else:
            print(f'{COLORS["RED"]}❌ Agent response unclear{COLORS["RESET"]}')
            
    except Exception as e:
        print(f'{COLORS["RED"]}❌ Error: {e}{COLORS["RESET"]}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(test_agent_direct()) 