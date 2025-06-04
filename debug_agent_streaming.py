#!/usr/bin/env python3
"""
Debug script for agent streaming to understand output format
"""

import asyncio
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.ai.lm_studio import chat_with_ai, create_default_tools, COLORS
from dotenv import load_dotenv

async def test_agent_streaming():
    print(f'{COLORS["YELLOW"]}Testing Agent Streaming Output Format...{COLORS["RESET"]}')
    
    try:
        chunk_count = 0
        async for chunk in chat_with_ai(
            message='Calculate 2+2 and explain',
            streaming=True,
            use_agent=True,
            tools=create_default_tools()
        ):
            chunk_count += 1
            if isinstance(chunk, str):
                preview = chunk[:100].replace('\n', '\\n') if len(chunk) > 100 else chunk.replace('\n', '\\n')
                print(f'{COLORS["GREEN"]}#{chunk_count} STRING: "{preview}"{COLORS["RESET"]}')
            elif isinstance(chunk, dict):
                print(f'{COLORS["BLUE"]}#{chunk_count} DICT: {chunk}{COLORS["RESET"]}')
            else:
                print(f'{COLORS["RED"]}#{chunk_count} OTHER ({type(chunk)}): {chunk}{COLORS["RESET"]}')
        
        print(f'{COLORS["CYAN"]}Total chunks received: {chunk_count}{COLORS["RESET"]}')
        
    except Exception as e:
        print(f'{COLORS["RED"]}Error: {e}{COLORS["RESET"]}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    load_dotenv()
    try:
        asyncio.run(test_agent_streaming())
    except KeyboardInterrupt:
        print(f'\n{COLORS["YELLOW"]}Test interrupted{COLORS["RESET"]}')
    except Exception as e:
        print(f'\n{COLORS["RED"]}Test error: {e}{COLORS["RESET"]}') 