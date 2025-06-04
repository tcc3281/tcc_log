#!/usr/bin/env python3
"""
Test script for agent streaming functionality
"""

import asyncio
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.ai.lm_studio import (
    chat_with_ai, 
    chat_with_ai_agent_enhanced_streaming,
    create_default_tools,
    COLORS
)

async def test_basic_agent_streaming():
    """Test basic agent streaming"""
    print(f"\n{COLORS['YELLOW']}{COLORS['BOLD']}=== Testing Basic Agent Streaming ==={COLORS['RESET']}")
    
    message = "What is 2 + 2? Please calculate this and explain your reasoning."
    
    print(f"\n{COLORS['BLUE']}User: {message}{COLORS['RESET']}")
    print(f"{COLORS['GREEN']}Assistant: {COLORS['RESET']}", end="", flush=True)
    
    try:
        async for chunk in chat_with_ai(
            message=message,
            streaming=True,
            use_agent=True,
            tools=create_default_tools()
        ):
            if isinstance(chunk, str):
                print(chunk, end="", flush=True)
            elif isinstance(chunk, dict) and "content" in chunk:
                print(chunk["content"], end="", flush=True)
        print()  # New line at the end
    except Exception as e:
        print(f"\n{COLORS['RED']}Error in basic streaming: {e}{COLORS['RESET']}")

async def test_enhanced_agent_streaming():
    """Test enhanced agent streaming with detailed events"""
    print(f"\n{COLORS['YELLOW']}{COLORS['BOLD']}=== Testing Enhanced Agent Streaming ==={COLORS['RESET']}")
    
    message = "Calculate the area of a circle with radius 5, then search for information about circles."
    
    print(f"\n{COLORS['BLUE']}User: {message}{COLORS['RESET']}")
    print(f"{COLORS['GREEN']}Assistant: {COLORS['RESET']}")
    
    try:
        async for event_chunk in chat_with_ai_agent_enhanced_streaming(
            message=message,
            tools=create_default_tools()
        ):
            if event_chunk:
                print(event_chunk, end="", flush=True)
        print()  # New line at the end
    except Exception as e:
        print(f"\n{COLORS['RED']}Error in enhanced streaming: {e}{COLORS['RESET']}")

async def test_non_agent_streaming():
    """Test regular non-agent streaming for comparison"""
    print(f"\n{COLORS['YELLOW']}{COLORS['BOLD']}=== Testing Non-Agent Streaming (for comparison) ==={COLORS['RESET']}")
    
    message = "Explain the concept of streaming in programming in simple terms."
    
    print(f"\n{COLORS['BLUE']}User: {message}{COLORS['RESET']}")
    print(f"{COLORS['GREEN']}Assistant: {COLORS['RESET']}", end="", flush=True)
    
    try:
        async for chunk in chat_with_ai(
            message=message,
            streaming=True,
            use_agent=False  # Regular streaming without agent
        ):
            if isinstance(chunk, str):
                print(chunk, end="", flush=True)
            elif isinstance(chunk, dict) and "content" in chunk:
                print(chunk["content"], end="", flush=True)
        print()  # New line at the end
    except Exception as e:
        print(f"\n{COLORS['RED']}Error in non-agent streaming: {e}{COLORS['RESET']}")

async def test_database_agent_streaming():
    """Test agent streaming with database tools (if available)"""
    print(f"\n{COLORS['YELLOW']}{COLORS['BOLD']}=== Testing Database Agent Streaming ==={COLORS['RESET']}")
    
    # Check if database is available
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print(f"{COLORS['YELLOW']}⚠️  No DATABASE_URL found, skipping database test{COLORS['RESET']}")
        return
    
    message = "Show me the database schema and then query for some sample data."
    
    print(f"\n{COLORS['BLUE']}User: {message}{COLORS['RESET']}")
    print(f"{COLORS['GREEN']}Assistant: {COLORS['RESET']}", end="", flush=True)
    
    try:
        async for chunk in chat_with_ai(
            message=message,
            streaming=True,
            use_agent=True,
            tools=None  # Will auto-add PostgreSQL tools
        ):
            if isinstance(chunk, str):
                print(chunk, end="", flush=True)
            elif isinstance(chunk, dict) and "content" in chunk:
                print(chunk["content"], end="", flush=True)
        print()  # New line at the end
    except Exception as e:
        print(f"\n{COLORS['RED']}Error in database agent streaming: {e}{COLORS['RESET']}")

async def main():
    """Run all tests"""
    print(f"{COLORS['MAGENTA']}{COLORS['BOLD']}🚀 Starting Agent Streaming Tests{COLORS['RESET']}")
    
    # Test basic agent streaming
    await test_basic_agent_streaming()
    
    # Wait a bit between tests
    await asyncio.sleep(2)
    
    # Test enhanced agent streaming
    await test_enhanced_agent_streaming()
    
    # Wait a bit between tests
    await asyncio.sleep(2)
    
    # Test non-agent streaming for comparison
    await test_non_agent_streaming()
    
    # Wait a bit between tests
    await asyncio.sleep(2)
    
    # Test database agent streaming if available
    await test_database_agent_streaming()
    
    print(f"\n{COLORS['MAGENTA']}{COLORS['BOLD']}✅ All streaming tests completed{COLORS['RESET']}")

if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n{COLORS['YELLOW']}⚠️  Tests interrupted by user{COLORS['RESET']}")
    except Exception as e:
        print(f"\n{COLORS['RED']}💥 Test error: {e}{COLORS['RESET']}") 