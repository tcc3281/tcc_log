#!/usr/bin/env python3
import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.ai.lm_studio import chat_with_ai, COLORS
from dotenv import load_dotenv

async def quick_test():
    print(f'{COLORS["CYAN"]}Quick test: Agent database access{COLORS["RESET"]}')
    
    try:
        async for chunk in chat_with_ai(
            'What tables are in the database? Use database tools to find out.',
            streaming=True,
            use_agent=True
        ):
            if isinstance(chunk, str):
                print(chunk, end='', flush=True)
    except Exception as e:
        print(f'{COLORS["RED"]}Error: {e}{COLORS["RESET"]}')

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(quick_test()) 