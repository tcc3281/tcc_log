#!/usr/bin/env python3
import requests
import json

# Test API call với authentication
def test_with_token():
    # Test login with new user
    try:
        print("=== Testing Login ===")
        login_response = requests.post(
            "http://localhost:8000/auth/token", 
            data={"username": "testuser", "password": "Mayyeutao0?"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10
        )
        
        print(f"Login Status: {login_response.status_code}")
        print(f"Login Response: {login_response.text}")
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            access_token = token_data.get("access_token")
            
            if access_token:
                print(f"Got token: {access_token[:20]}...")
                
                # Create a topic first
                print("\n=== Creating Topic for Entry Test ===")
                topic_data = {
                    "topic_name": "Test Topic",
                    "description": "Topic for testing entries"
                }
                
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
                
                topic_response = requests.post(
                    "http://localhost:8000/topics/",
                    json=topic_data,
                    headers=headers,
                    timeout=10
                )
                
                print(f"Topic Creation Status: {topic_response.status_code}")
                print(f"Topic Creation Response: {topic_response.text}")
                
                if topic_response.status_code == 200:
                    topic_id = topic_response.json().get("topic_id")
                    
                    # Now test the entries endpoint with the token                    print("\n=== Testing Entries Creation with Token ===")
                    entry_data = {
                        "topic_id": topic_id,
                        "title": "Test Entry with Auth",
                        "content": "Test content",
                        "entry_date": "2025-06-25",
                        "is_public": False
                    }
                    
                    entry_response = requests.post(
                        "http://localhost:8000/entries/",
                        json=entry_data,
                        headers=headers,
                        timeout=10
                    )
                    
                    print(f"Entry Creation Status: {entry_response.status_code}")
                    print(f"Entry Creation Response: {entry_response.text}")
                else:
                    print("Failed to create topic, cannot test entries")
            else:
                print("No access token in response")
        
    except Exception as e:
        print(f"Error: {e}")

def test_auth_me():
    """Test the /auth/me endpoint to see what authentication errors look like"""
    print("=== Testing /auth/me without token ===")
    try:
        response = requests.get("http://localhost:8000/auth/me", timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_auth_me()
    print("\n" + "="*50 + "\n")
    test_with_token()
