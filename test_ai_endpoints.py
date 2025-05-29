#!/usr/bin/env python3
"""
Script to test AI endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8000"
LM_STUDIO_URL = "http://127.0.0.1:1234"

def test_lm_studio_direct():
    """Test LM Studio directly"""
    print("🔍 Testing LM Studio directly...")
    
    results = {}
    
    try:
        # Test models endpoint
        response = requests.get(f"{LM_STUDIO_URL}/v1/models")
        if response.status_code == 200:
            models = response.json()
            results['models'] = True
            print(f"✅ LM Studio models endpoint: {response.status_code}")
            print(f"   Available models: {len(models.get('data', []))}")
            for model in models.get('data', [])[:3]:  # Show first 3 models
                print(f"   - {model.get('id', 'Unknown')}")
        else:
            results['models'] = False
            print(f"❌ LM Studio models endpoint: {response.status_code}")
    except Exception as e:
        results['models'] = False
        print(f"❌ LM Studio connection error: {e}")
    
    try:
        # Test chat completions
        payload = {
            "model": "deepseek-r1-distill-qwen-1.5b",
            "messages": [{"role": "user", "content": "Hello"}],
            "max_tokens": 50
        }
        response = requests.post(f"{LM_STUDIO_URL}/v1/chat/completions", json=payload)
        if response.status_code == 200:
            results['chat_completions'] = True
            print(f"✅ LM Studio chat/completions endpoint: {response.status_code}")
        else:
            results['chat_completions'] = False
            print(f"❌ LM Studio chat/completions endpoint: {response.status_code}")
    except Exception as e:
        results['chat_completions'] = False
        print(f"❌ LM Studio chat/completions error: {e}")
    
    try:
        # Test completions (legacy)
        payload = {
            "model": "deepseek-r1-distill-qwen-1.5b",
            "prompt": "Hello",
            "max_tokens": 50
        }
        response = requests.post(f"{LM_STUDIO_URL}/v1/completions", json=payload)
        if response.status_code == 200:
            results['completions'] = True
            print(f"✅ LM Studio completions endpoint: {response.status_code}")
        else:
            results['completions'] = False
            print(f"❌ LM Studio completions endpoint: {response.status_code}")
    except Exception as e:
        results['completions'] = False
        print(f"❌ LM Studio completions error: {e}")
    
    try:
        # Test embeddings
        payload = {
            "model": "nomic-ai/nomic-embed-text-v1.5-GGUF",
            "input": "Hello world"
        }
        response = requests.post(f"{LM_STUDIO_URL}/v1/embeddings", json=payload)
        if response.status_code == 200:
            results['embeddings'] = True
            print(f"✅ LM Studio embeddings endpoint: {response.status_code}")
        else:
            results['embeddings'] = False
            print(f"❌ LM Studio embeddings endpoint: {response.status_code}")
    except Exception as e:
        results['embeddings'] = False
        print(f"❌ LM Studio embeddings error: {e}")
    
    return results

def test_backend_routes():
    """Test backend routes"""
    print("\n🔍 Testing backend routes...")
    
    try:
        response = requests.get(f"{BASE_URL}/debug/routes")
        if response.status_code == 200:
            routes = response.json().get('routes', [])
            print(f"✅ Backend routes endpoint: {response.status_code}")
            print(f"   Total routes: {len(routes)}")
            
            # Look for AI routes
            ai_routes = [r for r in routes if '/ai' in r.get('path', '')]
            if ai_routes:
                print(f"   AI routes found: {len(ai_routes)}")
                for route in ai_routes:
                    print(f"   - {route.get('path')} {route.get('methods', '')}")
                return ai_routes
            else:
                print("   ❌ No AI routes found!")
                return []
        else:
            print(f"❌ Backend routes endpoint: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Backend connection error: {e}")
        return []

def test_ai_endpoints():
    """Test AI endpoints"""
    print("\n🔍 Testing Backend AI endpoints...")
    
    # After restart, the correct paths should be /ai/* not /ai/ai/*
    endpoints_to_test = [
        "/ai/status",
        "/ai/models"
    ]
    
    results = {}
    
    for endpoint in endpoints_to_test:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}")
            if response.status_code == 200:
                results[endpoint] = True
                print(f"✅ {endpoint}: {response.status_code}")
                data = response.json()
                if endpoint == "/ai/status":
                    print(f"   Status: {data.get('status', 'Unknown')}")
                    print(f"   Message: {data.get('message', 'No message')}")
                    print(f"   Base URL: {data.get('base_url', 'Unknown')}")
                    print(f"   Models: {data.get('model_count', 'Unknown')}")
                elif endpoint == "/ai/models":
                    models = data.get('models', [])
                    print(f"   Models: {len(models)}")
                    for model in models[:3]:
                        print(f"   - {model}")
            else:
                results[endpoint] = False
                print(f"❌ {endpoint}: {response.status_code}")
                if response.status_code == 404:
                    print(f"   Response: {response.text}")
        except Exception as e:
            results[endpoint] = False
            print(f"❌ {endpoint}: Error - {e}")
    
    return results

def test_writing_improvement():
    """Test writing improvement endpoints"""
    print("\n🔍 Testing Writing Improvement endpoints...")
    
    # Sample text for testing
    test_text = "i am go to store and buy some food. it is very good and i like it alot."
    
    results = {}
    
    # Test improve-writing endpoint
    try:
        payload = {
            "text": test_text,
            "improvement_type": "complete"
        }
        response = requests.post(f"{BASE_URL}/ai/improve-writing", json=payload)
        if response.status_code == 200:
            results['improve-writing'] = True
            data = response.json()
            print(f"✅ /ai/improve-writing: {response.status_code}")
            print(f"   Original: {data.get('original_text', '')[:50]}...")
            print(f"   Improved: {data.get('improved_text', '')[:50]}...")
            print(f"   Type: {data.get('improvement_type', 'Unknown')}")
        else:
            results['improve-writing'] = False
            print(f"❌ /ai/improve-writing: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        results['improve-writing'] = False
        print(f"❌ /ai/improve-writing: Error - {e}")
    
    # Test writing-suggestions endpoint
    try:
        payload = {"text": test_text}
        response = requests.post(f"{BASE_URL}/ai/writing-suggestions", json=payload)
        if response.status_code == 200:
            results['writing-suggestions'] = True
            data = response.json()
            print(f"✅ /ai/writing-suggestions: {response.status_code}")
            print(f"   Suggestions available: {len(data.get('suggestions', '')) > 0}")
        else:
            results['writing-suggestions'] = False
            print(f"❌ /ai/writing-suggestions: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        results['writing-suggestions'] = False
        print(f"❌ /ai/writing-suggestions: Error - {e}")
    
    return results

def main():
    print("🚀 AI Endpoints Comprehensive Test\n")
    
    lm_studio_results = test_lm_studio_direct()
    ai_routes = test_backend_routes()
    backend_ai_results = test_ai_endpoints()
    writing_results = test_writing_improvement()
    
    print("\n" + "="*50)
    print("📊 COMPREHENSIVE TEST SUMMARY")
    print("="*50)
    
    print("\n🤖 LM Studio (http://127.0.0.1:1234):")
    for test, passed in lm_studio_results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"   {test}: {status}")
    
    print(f"\n🔗 Backend AI Integration (http://localhost:8000):")
    for test, passed in backend_ai_results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"   {test}: {status}")
    
    print(f"\n✍️ Writing Improvement Features:")
    for test, passed in writing_results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"   {test}: {status}")
    
    print(f"\n📝 Available AI Routes: {len(ai_routes)}")
    for route in ai_routes:
        print(f"   - {route.get('path')} {route.get('methods', '')}")
    
    # Overall status
    lm_studio_ok = all(lm_studio_results.values())
    backend_ai_ok = all(backend_ai_results.values())
    writing_ok = all(writing_results.values())
    
    print(f"\n🎯 Overall Status:")
    print(f"   LM Studio: {'✅ Operational' if lm_studio_ok else '❌ Issues detected'}")
    print(f"   Backend AI: {'✅ Operational' if backend_ai_ok else '❌ Issues detected'}")
    print(f"   Writing Features: {'✅ Operational' if writing_ok else '❌ Issues detected'}")
    
    if lm_studio_ok and backend_ai_ok and writing_ok:
        print(f"\n🎉 All AI services including writing improvement are working correctly!")
        print(f"\n📖 Usage Instructions:")
        print(f"   1. Open frontend: http://localhost:3000/ai")
        print(f"   2. Use 'English Writing Assistant' section")
        print(f"   3. Paste your English text and choose improvement type")
        print(f"   4. Get instant grammar, style, and vocabulary improvements!")
    else:
        print(f"\n⚠️  Some issues detected. Check the details above.")

if __name__ == "__main__":
    main() 