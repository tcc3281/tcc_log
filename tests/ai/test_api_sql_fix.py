#!/usr/bin/env python3
"""
Test API SQL execution fix
"""

import asyncio
import sys
import os
import httpx
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from dotenv import load_dotenv

async def test_api_sql_execution():
    print("🧪 Testing API SQL Execution Fix...")
    
    # API endpoint
    api_url = "http://localhost:8000/api/ai/chat-stream"
    
    # Test request
    request_data = {
        "message": "How many users are in the database? Execute the query to show me the real count.",
        "use_agent": True,
        "history": []
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            print("📡 Sending request to API...")
            
            async with client.stream("POST", api_url, json=request_data) as response:
                if response.status_code != 200:
                    print(f"❌ API Error: {response.status_code}")
                    return
                
                print("✅ API connected, receiving stream...")
                
                collected_content = ""
                sql_execution_detected = False
                actual_results_detected = False
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])  # Remove "data: " prefix
                            
                            chunk_type = data.get("type", "")
                            content = data.get("content", "")
                            
                            if content:
                                collected_content += content
                                print(content, end="", flush=True)
                            
                            # Check for SQL execution indicators
                            if "🔧 Executing SQL Query:" in content:
                                sql_execution_detected = True
                                print(f"\n✅ SQL execution detected!")
                            
                            # Check for actual results
                            if any(indicator in content for indicator in ["✅ Query Result:", "Count:", "rows"]):
                                actual_results_detected = True
                                print(f"\n✅ Actual query results detected!")
                            
                            if chunk_type == "done":
                                print(f"\n📋 Stream completed")
                                break
                                
                        except json.JSONDecodeError:
                            continue
                
                print(f"\n\n🔍 Analysis:")
                print(f"SQL execution detected: {'✅' if sql_execution_detected else '❌'}")
                print(f"Actual results detected: {'✅' if actual_results_detected else '❌'}")
                
                # Check for undefined issue
                if "undefined" in collected_content.lower():
                    print(f"❌ 'undefined' still found in response")
                else:
                    print(f"✅ No 'undefined' found in response")
                
                if sql_execution_detected and actual_results_detected:
                    print(f"\n🎉 SUCCESS: API now executes SQL and shows real results!")
                else:
                    print(f"\n⚠️  PARTIAL: API may still have issues with SQL execution")
                    
    except Exception as e:
        print(f"❌ Test error: {e}")

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(test_api_sql_execution()) 