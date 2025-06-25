#!/usr/bin/env python3
import requests
import json

def test_frontend_scenario():
    """Simulate the exact frontend scenario"""
    
    # Step 1: Login (như frontend sẽ làm)
    print("=== Step 1: User Login ===")
    try:
        # Try với cả 2 users có thể có
        test_users = [
            {"username": "testuser", "password": "Mayyeutao0?"},
            {"username": "tcc3281", "password": "Mayyeutao0?"},
        ]
        
        access_token = None
        for user_creds in test_users:
            login_response = requests.post(
                "http://localhost:8000/auth/token", 
                data=user_creds,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=10
            )
            
            print(f"Trying {user_creds['username']}: {login_response.status_code}")
            
            if login_response.status_code == 200:
                token_data = login_response.json()
                access_token = token_data.get("access_token")
                print(f"✅ Login successful with {user_creds['username']}")
                print(f"Token: {access_token[:30]}...")
                break
        
        if not access_token:
            print("❌ No valid login found")
            return
        
        # Step 2: Get user topics (to get topic_id)
        print("\n=== Step 2: Get User Topics ===")
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        topics_response = requests.get(
            "http://localhost:8000/topics/",
            headers=headers,
            timeout=10
        )
        
        print(f"Topics Status: {topics_response.status_code}")
        print(f"Topics Response: {topics_response.text}")
        
        if topics_response.status_code == 200:
            topics = topics_response.json()
            if topics:
                topic_id = topics[0]["topic_id"]
                print(f"Using topic_id: {topic_id}")
            else:
                print("No topics found, creating one...")
                topic_response = requests.post(
                    "http://localhost:8000/topics/",
                    json={"topic_name": "Test Topic", "description": "For testing"},
                    headers=headers,
                    timeout=10
                )
                if topic_response.status_code == 200:
                    topic_id = topic_response.json()["topic_id"]
                    print(f"Created topic_id: {topic_id}")
                else:
                    print(f"Failed to create topic: {topic_response.text}")
                    return
        else:
            print("Failed to get topics")
            return
        
        # Step 3: Create entry exactly like frontend does
        print("\n=== Step 3: Create Entry (Frontend Style) ===")
        entry_data = {
            "topic_id": topic_id,
            "title": "Frontend Test Entry",
            "content": "This is created exactly like frontend would do",
            "entry_date": "2025-06-25",
            "location": None,
            "mood": None,
            "weather": None,
            "is_public": False
        }
        
        # Test with both endpoint variations
        endpoints = ["/entries", "/entries/"]
        
        for endpoint in endpoints:
            print(f"\nTesting endpoint: {endpoint}")
            entry_response = requests.post(
                f"http://localhost:8000{endpoint}",
                json=entry_data,
                headers=headers,
                timeout=10
            )
            
            print(f"Status: {entry_response.status_code}")
            print(f"Response: {entry_response.text}")
            
            if entry_response.status_code == 200:
                print(f"✅ Success with {endpoint}")
                break
            else:
                print(f"❌ Failed with {endpoint}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_frontend_scenario()
