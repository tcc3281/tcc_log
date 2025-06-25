#!/usr/bin/env python3
"""
Test agent mode after fixing the KeyError
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.ai.lm_studio import chat_with_ai, COLORS
from dotenv import load_dotenv

async def test_agent_fixed():
    print(f'{COLORS["CYAN"]}🧪 Testing Fixed Agent Mode{COLORS["RESET"]}')
    
    test_queries = [
        "How many users are in the database?",
        "Show me 3 users from the database",
        "Display entries table data"
    ]
    
    for i, query in enumerate(test_queries, 1):
        print(f'\n{COLORS["YELLOW"]}=== Test {i}: {query} ==={COLORS["RESET"]}')
        
        try:
            agent_tool_used = False
            real_data_found = False
            collected_content = ""
            
            async for chunk in chat_with_ai(
                message=query,
                streaming=True,
                use_agent=True  # Force agent mode
            ):
                if isinstance(chunk, str):
                    collected_content += chunk
                    print(chunk, end="", flush=True)
                    
                    # Check for agent tool usage
                    if any(indicator in chunk for indicator in ['🔧 Using tool:', 'database_query', 'Tool result:']):
                        agent_tool_used = True
                    
                    # Check for real data
                    if "✅ REAL Result" in chunk:
                        real_data_found = True
                        
                elif isinstance(chunk, dict) and 'content' in chunk:
                    content = chunk['content']
                    collected_content += content
                    print(content, end="", flush=True)
            
            print(f'\n\n{COLORS["BLUE"]}=== Results ==={COLORS["RESET"]}')
            
            if agent_tool_used:
                print(f'{COLORS["GREEN"]}✅ Agent tools executed successfully{COLORS["RESET"]}')
            else:
                print(f'{COLORS["RED"]}❌ No agent tool execution detected{COLORS["RESET"]}')
            
            if real_data_found:
                print(f'{COLORS["GREEN"]}✅ Real database results found{COLORS["RESET"]}')
            else:
                print(f'{COLORS["YELLOW"]}⚠️  No real results detected{COLORS["RESET"]}')
            
            # Check if agent mode was actually used (not fallen back to non-agent)
            if "[AGENT MODE ACTIVE]" in collected_content:
                print(f'{COLORS["GREEN"]}✅ Agent mode successfully activated{COLORS["RESET"]}')
            elif "[NON-AGENT MODE]" in collected_content:
                print(f'{COLORS["RED"]}❌ Fell back to non-agent mode{COLORS["RESET"]}')
            else:
                print(f'{COLORS["BLUE"]}ℹ️  Mode not explicitly indicated{COLORS["RESET"]}')
                
        except Exception as e:
            print(f'{COLORS["RED"]}❌ Error: {e}{COLORS["RESET"]}')
            import traceback
            traceback.print_exc()
        
        print(f'\n{"="*60}\n')
    
    print(f'{COLORS["CYAN"]}🎯 Agent Fix Summary:{COLORS["RESET"]}')
    print(f'{COLORS["GREEN"]}✅ Removed JSON syntax from few-shot examples{COLORS["RESET"]}')
    print(f'{COLORS["GREEN"]}✅ Fixed KeyError with user_id placeholder{COLORS["RESET"]}')
    print(f'{COLORS["GREEN"]}✅ Agent mode should now work with database tools{COLORS["RESET"]}')

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(test_agent_fixed()) 