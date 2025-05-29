#!/usr/bin/env python3
"""
Script to test AI connectivity from Docker environment
"""
import requests
import sys
import time
import os
from typing import Dict, Any

def test_ai_connectivity() -> Dict[str, Any]:
    """Test AI connectivity from current environment"""
    
    # Get LM Studio URL from environment or use default
    lm_studio_url = os.getenv('LM_STUDIO_BASE_URL', 'http://127.0.0.1:1234/v1')
    
    print(f"Testing AI connectivity to: {lm_studio_url}")
    print("-" * 50)
    
    results = {
        'lm_studio_url': lm_studio_url,
        'models_endpoint': f"{lm_studio_url}/models",
        'chat_endpoint': f"{lm_studio_url}/chat/completions",
        'tests': {}
    }
    
    # Test 1: Models endpoint
    print("1. Testing models endpoint...")
    try:
        response = requests.get(f"{lm_studio_url}/models", timeout=10)
        if response.status_code == 200:
            models_data = response.json()
            model_count = len(models_data.get('data', []))
            print(f"   ✅ Success! Found {model_count} models")
            results['tests']['models'] = {
                'status': 'success',
                'model_count': model_count,
                'models': [model['id'] for model in models_data.get('data', [])]
            }
        else:
            print(f"   ❌ Failed! Status: {response.status_code}")
            results['tests']['models'] = {
                'status': 'failed',
                'error': f"HTTP {response.status_code}: {response.text}"
            }
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Connection failed! Error: {e}")
        results['tests']['models'] = {
            'status': 'failed',
            'error': str(e)
        }
    
    # Test 2: Chat completions endpoint (if models work)
    if results['tests']['models']['status'] == 'success':
        print("\n2. Testing chat completions...")
        try:
            test_payload = {
                "model": results['tests']['models']['models'][0] if results['tests']['models']['models'] else "test",
                "messages": [{"role": "user", "content": "Hello! Can you respond with just 'AI Test Successful'?"}],
                "max_tokens": 50,
                "temperature": 0.1
            }
            
            response = requests.post(
                f"{lm_studio_url}/chat/completions", 
                json=test_payload, 
                timeout=30,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                chat_data = response.json()
                content = chat_data.get('choices', [{}])[0].get('message', {}).get('content', 'No content')
                print(f"   ✅ Success! AI Response: {content[:100]}...")
                results['tests']['chat'] = {
                    'status': 'success',
                    'response': content
                }
            else:
                print(f"   ❌ Failed! Status: {response.status_code}")
                results['tests']['chat'] = {
                    'status': 'failed',
                    'error': f"HTTP {response.status_code}: {response.text}"
                }
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Connection failed! Error: {e}")
            results['tests']['chat'] = {
                'status': 'failed',
                'error': str(e)
            }
    else:
        print("\n2. Skipping chat test (models endpoint failed)")
        results['tests']['chat'] = {
            'status': 'skipped',
            'reason': 'Models endpoint failed'
        }
    
    return results

def test_environment_setup():
    """Test environment variables and setup"""
    print("\n3. Environment Check:")
    print("-" * 30)
    
    env_vars = [
        'LM_STUDIO_BASE_URL',
        'LM_STUDIO_MODEL',
        'DATABASE_URL'
    ]
    
    for var in env_vars:
        value = os.getenv(var, 'Not set')
        print(f"   {var}: {value}")

def main():
    print("🤖 AI Connectivity Test for Docker Environment")
    print("=" * 50)
    
    # Test environment
    test_environment_setup()
    
    # Test AI connectivity
    print("\n🔌 Testing AI Connectivity:")
    print("-" * 30)
    results = test_ai_connectivity()
    
    print("\n📊 Summary:")
    print("-" * 20)
    
    models_status = results['tests']['models']['status']
    chat_status = results['tests'].get('chat', {}).get('status', 'skipped')
    
    if models_status == 'success' and chat_status == 'success':
        print("   🎉 All tests passed! AI is working correctly.")
        sys.exit(0)
    elif models_status == 'success':
        print("   ⚠️  Models endpoint works, but chat failed.")
        print("   This might be a model loading issue.")
        sys.exit(1)
    else:
        print("   ❌ AI connectivity failed!")
        print("\n🔧 Troubleshooting suggestions:")
        
        if 'host.docker.internal' in results['lm_studio_url']:
            print("   1. Ensure LM Studio is running on host machine (port 1234)")
            print("   2. Check if Docker Desktop is running (required for host.docker.internal)")
            print("   3. Try accessing http://127.0.0.1:1234/v1/models from host browser")
        else:
            print("   1. Ensure LM Studio is running and accessible")
            print("   2. Check firewall settings")
            print("   3. Verify the URL in LM_STUDIO_BASE_URL")
        
        print("   4. Check LM Studio server logs for errors")
        sys.exit(1)

if __name__ == '__main__':
    main() 