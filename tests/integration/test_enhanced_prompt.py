#!/usr/bin/env python3
"""
Test enhanced prompt for database tool usage
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.ai.lm_studio import chat_with_ai, COLORS
from dotenv import load_dotenv

async def test_enhanced_prompt():
    print(f'{COLORS["CYAN"]}Testing Enhanced Prompt for Tool Usage{COLORS["RESET"]}')
    
    # Test with explicit instruction to use tools
    test_question = "How many users are in the database? Use the database_query tool to execute SELECT COUNT(*) FROM users and give me the real result."
    
    print(f'\n{COLORS["BLUE"]}Question: {test_question}{COLORS["RESET"]}')
    
    try:
        tool_usage_detected = False
        response_chunks = []
        
        async for chunk in chat_with_ai(
            test_question,
            streaming=True,
            use_agent=True
        ):
            if isinstance(chunk, str):
                response_chunks.append(chunk)
                print(chunk, end='', flush=True)
                
                # Check for tool usage indicators
                if any(indicator in chunk for indicator in ["🔧", "📋", "Using tool:", "Tool result:", "database_query"]):
                    tool_usage_detected = True
        
        full_response = "".join(response_chunks)
        
        print(f'\n\n{COLORS["YELLOW"]}=== Analysis ==={COLORS["RESET"]}')
        
        if tool_usage_detected:
            print(f'{COLORS["GREEN"]}✅ Tool usage detected in response{COLORS["RESET"]}')
        else:
            print(f'{COLORS["RED"]}❌ No tool usage detected{COLORS["RESET"]}')
        
        # Check for actual data vs SQL code
        if "SELECT COUNT(*)" in full_response and "undefined" not in full_response and tool_usage_detected:
            print(f'{COLORS["GREEN"]}✅ Agent executed query and returned results{COLORS["RESET"]}')
        elif "SELECT COUNT(*)" in full_response and not tool_usage_detected:
            print(f'{COLORS["RED"]}❌ Agent only provided SQL code without execution{COLORS["RESET"]}')
        else:
            print(f'{COLORS["YELLOW"]}⚠️  Unclear response format{COLORS["RESET"]}')
        
    except Exception as e:
        print(f'\n{COLORS["RED"]}Error: {e}{COLORS["RESET"]}')

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(test_enhanced_prompt()) 