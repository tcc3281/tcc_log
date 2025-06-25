#!/usr/bin/env python3
import requests
import json

# Test API call to create entry
url = "http://localhost:8000/entries/"
data = {
    "topic_id": 1,
    "title": "Test Entry",
    "content": "Test content",
    "entry_date": "2025-06-25"
}

headers = {
    "Content-Type": "application/json"
}

try:
    print(f"Testing POST {url}")
    print(f"Data: {json.dumps(data, indent=2)}")
    
    response = requests.post(url, json=data, headers=headers, timeout=10)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body: {response.text}")
    
except Exception as e:
    print(f"Error: {e}")
