#!/usr/bin/env python3
import requests
import json

def test_all_entries_endpoints():
    """Test tất cả các endpoints entries để tìm ra cái nào hoạt động"""
    
    # Login first để lấy token
    print("=== Getting Auth Token ===")
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
    
    # Test các endpoint khác nhau
    endpoints_to_test = [
        "/entries",           # Không có trailing slash
        "/entries/",          # Có trailing slash
        "/entries/1",         # Specific entry không có slash
        "/entries/1/",        # Specific entry có slash
    ]
    
    for endpoint in endpoints_to_test:
        try:
            print(f"\n=== Testing GET {endpoint} ===")
            response = requests.get(f"http://localhost:8000{endpoint}", headers=headers, timeout=10)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text[:200]}...")
        except Exception as e:
            print(f"Error: {e}")
    
    # Test POST endpoints
    post_endpoints = [
        "/entries",
        "/entries/"
    ]
    
    test_data = {
        "topic_id": 4,  # Sử dụng topic đã tạo
        "title": "Frontend Test Entry",
        "content": "Testing from frontend simulation",
        "entry_date": "2025-06-25",
        "is_public": False
    }
    
    for endpoint in post_endpoints:
        try:
            print(f"\n=== Testing POST {endpoint} ===")
            response = requests.post(f"http://localhost:8000{endpoint}", 
                                   json=test_data, headers=headers, timeout=10)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text[:200]}...")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_all_entries_endpoints()
