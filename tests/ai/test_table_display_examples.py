#!/usr/bin/env python3
"""
Test enhanced few-shot examples for displaying table records
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.ai.lm_studio import chat_with_ai, COLORS
from dotenv import load_dotenv

async def test_table_display_examples():
    print(f'{COLORS["CYAN"]}🧪 Testing Enhanced Few-Shot Examples for Table Display{COLORS["RESET"]}')
    
    # Test cases focused on displaying table records
    test_cases = [
        {
            "query": "Show me all users from the database",
            "expectation": "Display users table with proper formatting"
        },
        {
            "query": "Display entries from the entries table", 
            "expectation": "Show entries data in table format"
        },
        {
            "query": "List recent conversations",
            "expectation": "Display conversations with ORDER BY"
        },
        {
            "query": "Show me topics data",
            "expectation": "Display topics table records"
        },
        {
            "query": "Get all messages from messages table",
            "expectation": "Display messages with proper columns"
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        query = test_case["query"]
        expectation = test_case["expectation"]
        
        print(f'\n{COLORS["YELLOW"]}=== Test {i}: {query} ==={COLORS["RESET"]}')
        print(f'{COLORS["BLUE"]}Expected: {expectation}{COLORS["RESET"]}')
        
        try:
            tool_executed = False
            table_formatted = False
            real_data_found = False
            collected_content = ""
            sql_queries_found = []
            
            async for chunk in chat_with_ai(
                message=query,
                streaming=True,
                use_agent=True
            ):
                if isinstance(chunk, str):
                    collected_content += chunk
                    print(chunk, end="", flush=True)
                    
                    # Check for tool execution
                    if any(indicator in chunk for indicator in ['🔧 Using tool:', 'database_query', 'Tool result:']):
                        tool_executed = True
                    
                    # Check for table formatting
                    if any(indicator in chunk for indicator in ['|', '---', '✅ REAL Result']):
                        table_formatted = True
                    
                    # Check for real database results
                    if "✅ REAL Result" in chunk:
                        real_data_found = True
                    
                    # Extract SQL queries
                    if "SELECT" in chunk.upper():
                        lines = chunk.split('\n')
                        for line in lines:
                            if "SELECT" in line.upper():
                                sql_queries_found.append(line.strip())
                                
                elif isinstance(chunk, dict) and 'content' in chunk:
                    content = chunk['content']
                    collected_content += content
                    print(content, end="", flush=True)
            
            print(f'\n\n{COLORS["BLUE"]}=== Analysis ==={COLORS["RESET"]}')
            
            # Analysis results
            if tool_executed:
                print(f'{COLORS["GREEN"]}✅ Database tool executed{COLORS["RESET"]}')
            else:
                print(f'{COLORS["RED"]}❌ No database tool execution detected{COLORS["RESET"]}')
            
            if table_formatted:
                print(f'{COLORS["GREEN"]}✅ Table formatting detected{COLORS["RESET"]}')
            else:
                print(f'{COLORS["RED"]}❌ No table formatting found{COLORS["RESET"]}')
            
            if real_data_found:
                print(f'{COLORS["GREEN"]}✅ Real database results found{COLORS["RESET"]}')
            else:
                print(f'{COLORS["RED"]}❌ No real results - possibly hallucinated{COLORS["RESET"]}')
            
            if sql_queries_found:
                print(f'{COLORS["CYAN"]}📝 SQL Queries found: {len(sql_queries_found)}{COLORS["RESET"]}')
                for j, sql in enumerate(sql_queries_found[:3], 1):  # Show first 3
                    print(f'   {j}. {sql[:80]}...' if len(sql) > 80 else f'   {j}. {sql}')
            else:
                print(f'{COLORS["RED"]}❌ No SQL queries detected{COLORS["RESET"]}')
            
            # Check for common hallucination patterns
            hallucination_indicators = [
                "based on the database",
                "example data",
                "sample records",
                "john@example.com",
                "user1", "user2", "entry1"
            ]
            
            has_hallucination = any(indicator in collected_content.lower() for indicator in hallucination_indicators)
            
            if has_hallucination and not real_data_found:
                print(f'{COLORS["RED"]}⚠️  Likely hallucination detected{COLORS["RESET"]}')
            elif not has_hallucination and real_data_found:
                print(f'{COLORS["GREEN"]}✅ Clean real data response{COLORS["RESET"]}')
            
            # Overall assessment
            score = sum([tool_executed, table_formatted, real_data_found])
            if score >= 2:
                print(f'{COLORS["GREEN"]}🎯 GOOD: {score}/3 criteria met{COLORS["RESET"]}')
            else:
                print(f'{COLORS["RED"]}🎯 NEEDS IMPROVEMENT: {score}/3 criteria met{COLORS["RESET"]}')
            
        except Exception as e:
            print(f'{COLORS["RED"]}❌ Error: {e}{COLORS["RESET"]}')
            import traceback
            traceback.print_exc()
        
        print(f'\n{"="*80}\n')
    
    # Final summary
    print(f'{COLORS["CYAN"]}🎯 Enhanced Few-Shot Examples Summary:{COLORS["RESET"]}')
    print(f'{COLORS["GREEN"]}✅ Added specific table display examples{COLORS["RESET"]}')
    print(f'{COLORS["GREEN"]}✅ Included proper table formatting samples{COLORS["RESET"]}')
    print(f'{COLORS["GREEN"]}✅ Added LIMIT clauses for better performance{COLORS["RESET"]}')
    print(f'{COLORS["GREEN"]}✅ More WRONG behavior examples for contrast{COLORS["RESET"]}')
    print(f'{COLORS["BLUE"]}📈 Should improve agent understanding of table display tasks{COLORS["RESET"]}')

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(test_table_display_examples()) 