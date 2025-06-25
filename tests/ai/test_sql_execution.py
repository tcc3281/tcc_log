#!/usr/bin/env python3
"""
Test script to verify if agent executes SQL queries
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.ai.lm_studio import chat_with_ai, COLORS
from dotenv import load_dotenv

async def test_sql_execution():
    print(f'{COLORS["YELLOW"]}Testing SQL Execution...{COLORS["RESET"]}')
    
    # Test questions that require actual SQL execution
    test_questions = [
        "How many users are in the database? Execute a query to find out.",
        "How many entries are there? Run a SELECT COUNT(*) query.",
        "Show me 3 sample records from the users table.",
        "What is the actual data in the topics table? Execute a query to show me."
    ]
    
    for i, question in enumerate(test_questions, 1):
        print(f'\n{COLORS["BLUE"]}=== Test {i}: {question} ==={COLORS["RESET"]}')
        
        try:
            response_chunks = []
            tool_usage_detected = False
            
            async for chunk in chat_with_ai(
                message=question,
                streaming=True,
                use_agent=True
            ):
                if isinstance(chunk, str):
                    response_chunks.append(chunk)
                    print(chunk, end="", flush=True)
                    
                    # Check for tool usage indicators
                    if any(indicator in chunk for indicator in ["🔧", "📋", "Using tool:", "Tool result:"]):
                        tool_usage_detected = True
            
            full_response = "".join(response_chunks)
            
            # Check if agent actually executed queries vs just provided SQL code
            if tool_usage_detected:
                print(f'\n{COLORS["GREEN"]}✅ Agent used database tools{COLORS["RESET"]}')
            else:
                print(f'\n{COLORS["RED"]}❌ Agent did NOT use database tools{COLORS["RESET"]}')
            
            # Check if response contains actual data vs just SQL code
            if any(keyword in full_response.lower() for keyword in ["count", "result", "rows", "data"]) and "undefined" not in full_response.lower():
                print(f'{COLORS["GREEN"]}✅ Response contains actual data{COLORS["RESET"]}')
            else:
                print(f'{COLORS["RED"]}❌ Response seems to be just SQL code{COLORS["RESET"]}')
            
            # Wait between tests
            await asyncio.sleep(3)
            
        except Exception as e:
            print(f'\n{COLORS["RED"]}Error in test {i}: {e}{COLORS["RESET"]}')

if __name__ == "__main__":
    load_dotenv()
    try:
        asyncio.run(test_sql_execution())
    except KeyboardInterrupt:
        print(f'\n{COLORS["YELLOW"]}Tests interrupted{COLORS["RESET"]}')
    except Exception as e:
        print(f'\n{COLORS["RED"]}Test error: {e}{COLORS["RESET"]}') 