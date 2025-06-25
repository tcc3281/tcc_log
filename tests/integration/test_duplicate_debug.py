#!/usr/bin/env python3
"""
Debug duplicate SQL results issue
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.ai.lm_studio import chat_with_ai, COLORS
from dotenv import load_dotenv

async def test_duplicate_debug():
    print(f'{COLORS["CYAN"]}🧪 Debugging Duplicate Results{COLORS["RESET"]}')
    
    test_message = "Show me all users in the database. Execute SELECT * FROM users."
    
    print(f'{COLORS["BLUE"]}Message: {test_message}{COLORS["RESET"]}')
    print(f'{COLORS["YELLOW"]}Monitoring for duplicates...{COLORS["RESET"]}\n')
    
    try:
        real_result_count = 0
        collected_chunks = []
        
        async for chunk in chat_with_ai(
            message=test_message,
            streaming=True,
            use_agent=True
        ):
            if isinstance(chunk, str):
                collected_chunks.append(chunk)
                print(chunk, end="", flush=True)
                
                # Count real results
                if "✅ REAL Result" in chunk:
                    real_result_count += 1
                    print(f"\n{COLORS['RED']}[DEBUG] Real result #{real_result_count} detected!{COLORS['RESET']}\n")
            elif isinstance(chunk, dict) and 'content' in chunk:
                content = chunk['content']
                collected_chunks.append(content)
                print(content, end="", flush=True)
                
                if "✅ REAL Result" in content:
                    real_result_count += 1
                    print(f"\n{COLORS['RED']}[DEBUG] Real result #{real_result_count} detected in dict!{COLORS['RESET']}\n")
        
        print(f'\n\n{COLORS["YELLOW"]}=== DUPLICATE ANALYSIS ==={COLORS["RESET"]}')
        print(f'Total real results detected: {real_result_count}')
        
        if real_result_count > 1:
            print(f'{COLORS["RED"]}❌ DUPLICATE DETECTED! Results shown {real_result_count} times{COLORS["RESET"]}')
            
            # Analyze full content
            full_content = "".join(collected_chunks)
            real_result_positions = []
            pos = 0
            while True:
                pos = full_content.find("✅ REAL Result", pos)
                if pos == -1:
                    break
                real_result_positions.append(pos)
                pos += 1
            
            print(f'Real result positions in text: {real_result_positions}')
        else:
            print(f'{COLORS["GREEN"]}✅ No duplicates detected{COLORS["RESET"]}')
            
    except Exception as e:
        print(f'{COLORS["RED"]}❌ Error: {e}{COLORS["RESET"]}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(test_duplicate_debug()) 