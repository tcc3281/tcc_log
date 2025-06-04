#!/usr/bin/env python3
"""
Test API with SQL execution and markdown fixes
"""

import asyncio
import httpx
import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from dotenv import load_dotenv

async def test_api_frontend_fixes():
    print("🧪 Testing API with Frontend Fixes...")
    
    # API endpoint
    api_url = "http://localhost:8000/api/ai/chat-stream"
    
    # Test request - targeting the exact issue
    request_data = {
        "message": "How many topics are in the database? Execute the query to show me the real count.",
        "use_agent": True,
        "history": []
    }
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            print("📡 Sending request to API...")
            
            real_result_found = False
            undefined_found = False
            sql_block_found = False
            fake_result_found = False
            
            async with client.stream("POST", api_url, json=request_data) as response:
                if response.status_code == 200:
                    print("✅ API responding...")
                    
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            try:
                                data = json.loads(line[6:])  # Remove "data: " prefix
                                content = data.get("content", "")
                                data_type = data.get("type", "")
                                
                                # Print content for debugging
                                if content and content.strip():
                                    print(content, end="", flush=True)
                                
                                # Check for issues
                                if "undefined" in content.lower():
                                    undefined_found = True
                                    print(f"\n❌ FOUND 'undefined': {content}")
                                
                                if "```sql" in content:
                                    sql_block_found = True
                                    print(f"\n🔍 SQL block found: {content[:50]}...")
                                
                                if "✅ REAL Result:" in content:
                                    real_result_found = True
                                    print(f"\n🎉 REAL result found: {content}")
                                
                                if any(fake in content for fake in ["123", "456", "245"]):
                                    fake_result_found = True
                                    print(f"\n⚠️ Potential fake result: {content}")
                                
                                if data_type == "done":
                                    break
                                    
                            except json.JSONDecodeError as e:
                                print(f"\n❌ JSON decode error: {e}")
                                
                else:
                    print(f"❌ API error: {response.status_code}")
                    print(await response.aread())
                    
            # Analysis
            print(f"\n\n🔍 === FRONTEND TEST ANALYSIS ===")
            print(f"Real SQL result found: {'✅' if real_result_found else '❌'}")
            print(f"Undefined found: {'❌' if undefined_found else '✅'}")
            print(f"SQL blocks detected: {'✅' if sql_block_found else '❌'}")
            print(f"Fake results found: {'⚠️' if fake_result_found else '✅'}")
            
            if real_result_found and not undefined_found:
                print(f"\n🎉 SUCCESS: Frontend fixes working properly!")
                print(f"✅ Real results are being sent to frontend")
                print(f"✅ No 'undefined' markdown issues")
            else:
                print(f"\n❌ Issues detected:")
                if not real_result_found:
                    print(f"  - Real SQL results not sent to frontend")
                if undefined_found:
                    print(f"  - 'undefined' found in response")
                    
    except Exception as e:
        print(f"❌ Test error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(test_api_frontend_fixes()) 