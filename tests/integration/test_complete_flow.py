#!/usr/bin/env python3
import requests
import json

def test_complete_flow():
    """Test complete flow: login -> topic -> entry creation"""
    
    # Login
    print("=== Step 1: Login ===")
    login_response = requests.post(
        "http://localhost:8000/auth/token", 
        data={"username": "testuser", "password": "Mayyeutao0?"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=10
    )
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.status_code}")
        return
        
    access_token = login_response.json().get("access_token")
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    print("✓ Login successful")
    
    # Create topic
    print("\n=== Step 2: Create Topic ===")
    topic_data = {
        "topic_name": "Frontend Flow Test",
        "description": "Testing complete frontend flow"
    }
    
    topic_response = requests.post(
        "http://localhost:8000/topics/",
        json=topic_data,
        headers=headers,
        timeout=10
    )
    
    if topic_response.status_code != 200:
        print(f"Topic creation failed: {topic_response.status_code}")
        print(topic_response.text)
        return
        
    topic_id = topic_response.json().get("topic_id")
    print(f"✓ Topic created with ID: {topic_id}")
    
    # Create entry using correct endpoint
    print("\n=== Step 3: Create Entry (POST /entries/) ===")
    entry_data = {
        "topic_id": topic_id,
        "title": "Complete Flow Test Entry",
        "content": "This entry tests the complete frontend flow",
        "entry_date": "2025-06-25",
        "is_public": False
    }
    
    entry_response = requests.post(
        "http://localhost:8000/entries/",  # With trailing slash
        json=entry_data,
        headers=headers,
        timeout=10
    )
    
    if entry_response.status_code != 200:
        print(f"Entry creation failed: {entry_response.status_code}")
        print(entry_response.text)
        return
        
    entry_id = entry_response.json().get("entry_id")
    print(f"✓ Entry created with ID: {entry_id}")
    
    # Get entry using correct endpoint
    print(f"\n=== Step 4: Get Entry (GET /entries/{entry_id}) ===")
    get_response = requests.get(
        f"http://localhost:8000/entries/{entry_id}",  # Without trailing slash
        headers=headers,
        timeout=10
    )
    
    if get_response.status_code != 200:
        print(f"Get entry failed: {get_response.status_code}")
        print(get_response.text)
        return
        
    print("✓ Entry retrieved successfully")
    
    # Update entry
    print(f"\n=== Step 5: Update Entry (PUT /entries/{entry_id}) ===")
    update_data = {
        "title": "Updated Flow Test Entry",
        "content": "This entry has been updated",
        "entry_date": "2025-06-25",
        "is_public": False
    }
    
    update_response = requests.put(
        f"http://localhost:8000/entries/{entry_id}",  # Without trailing slash
        json=update_data,
        headers=headers,
        timeout=10
    )
    
    if update_response.status_code != 200:
        print(f"Update entry failed: {update_response.status_code}")
        print(update_response.text)
        return
        
    print("✓ Entry updated successfully")
      # Get list of entries for topic
    print(f"\n=== Step 6: Get Topic Entries (GET /topics/{topic_id}/entries) ===")
    list_response = requests.get(
        f"http://localhost:8000/topics/{topic_id}/entries",  # Without trailing slash
        headers=headers,
        timeout=10
    )
    
    if list_response.status_code != 200:
        print(f"Get topic entries failed: {list_response.status_code}")
        print(list_response.text)
        return
        
    entries = list_response.json()
    print(f"✓ Found {len(entries)} entries for topic")
    
    print("\n🎉 Complete flow test successful!")
    print("Frontend endpoints should use:")
    print("  - POST /entries/ (with slash)")
    print("  - GET /entries/{id} (without slash)")
    print("  - PUT /entries/{id} (without slash)")
    print("  - DELETE /entries/{id} (without slash)")
    print("  - GET /topics/{id}/entries (without slash)")

if __name__ == "__main__":
    test_complete_flow()
