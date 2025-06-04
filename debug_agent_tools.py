#!/usr/bin/env python3
"""
Debug script to test agent tool usage directly
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from dotenv import load_dotenv
from app.ai.agent import LangChainAgent
from app.ai.lm_studio import COLORS

async def debug_agent_tools():
    print(f'{COLORS["CYAN"]}Direct Agent Tool Debug{COLORS["RESET"]}')
    
    try:
        # Initialize agent
        agent = LangChainAgent()
        
        print(f'{COLORS["YELLOW"]}Agent tools: {len(agent.tools)}{COLORS["RESET"]}')
        for i, tool in enumerate(agent.tools):
            print(f'{COLORS["WHITE"]}  {i+1}. {tool.name}: {tool.description[:80]}...{COLORS["RESET"]}')
        
        print(f'\n{COLORS["BLUE"]}Testing simple direct agent query...{COLORS["RESET"]}')
        
        # Test direct agent execution (non-streaming)
        result = agent.query("How many users are in the database? Use the database_query tool.")
        
        print(f'\n{COLORS["GREEN"]}Direct query result:{COLORS["RESET"]}')
        print(f'{COLORS["WHITE"]}{result}{COLORS["RESET"]}')
        
        # Check if tools were used by checking agent executor history
        if hasattr(agent.agent_executor, 'memory') and agent.agent_executor.memory:
            memory = agent.agent_executor.memory.chat_memory.messages
            print(f'\n{COLORS["YELLOW"]}Memory messages: {len(memory)}{COLORS["RESET"]}')
            for msg in memory[-3:]:  # Show last 3 messages
                print(f'{COLORS["WHITE"]}  {msg.type}: {str(msg.content)[:100]}...{COLORS["RESET"]}')
        
        print(f'\n{COLORS["BLUE"]}Testing streaming agent query...{COLORS["RESET"]}')
        
        # Test streaming
        stream_result = []
        async for chunk in agent.chat("Execute SELECT COUNT(*) FROM users using database_query tool", streaming=True):
            if isinstance(chunk, str):
                stream_result.append(chunk)
                print(chunk, end='', flush=True)
        
        full_stream = "".join(stream_result)
        
        print(f'\n\n{COLORS["GREEN"]}Stream complete. Length: {len(full_stream)}{COLORS["RESET"]}')
        
        # Check for tool usage indicators
        tool_indicators = ["🔧", "📋", "database_query", "Using tool", "Tool result"]
        tool_usage = any(indicator in full_stream for indicator in tool_indicators)
        
        if tool_usage:
            print(f'{COLORS["GREEN"]}✅ Tool usage detected in streaming{COLORS["RESET"]}')
        else:
            print(f'{COLORS["RED"]}❌ No tool usage in streaming{COLORS["RESET"]}')
            
    except Exception as e:
        print(f'{COLORS["RED"]}Error: {e}{COLORS["RESET"]}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(debug_agent_tools()) 