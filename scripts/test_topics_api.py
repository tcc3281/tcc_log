#!/usr/bin/env python3

import requests
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Base URL
API_URL = "http://localhost:8000"

def test_topics_with_trailing_slash():
    """Test POST to /topics/ endpoint (with trailing slash)"""
    url = f"{API_URL}/topics/"
    data = {
        "topic_name": "Test Topic With Slash",
        "description": "Created by test script with trailing slash in URL"
    }
    
    # Get demo token - normally you would login first
    demo_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X3VzZXIiLCJleHAiOjE3MDg3NzM1MjJ9.-bOShjsWKQMUUs_gQ-_mFSHt-n2RzPJkCAGaoJwdcnI"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {demo_token}"
    }
    
    logger.info(f"Testing POST to {url} with trailing slash")
    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        logger.info(f"Status code: {response.status_code}")
        if response.status_code == 200 or response.status_code == 201:
            logger.info("Success! Response:")
            logger.info(json.dumps(response.json(), indent=2))
        else:
            logger.error(f"Failed with status code {response.status_code}")
            logger.error(f"Response: {response.text}")
    except Exception as e:
        logger.error(f"Exception: {e}")

def test_topics_without_trailing_slash():
    """Test POST to /topics endpoint (without trailing slash)"""
    url = f"{API_URL}/topics"  # No trailing slash
    data = {
        "topic_name": "Test Topic Without Slash",
        "description": "Created by test script without trailing slash in URL"
    }
    
    # Get demo token - normally you would login first
    demo_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X3VzZXIiLCJleHAiOjE3MDg3NzM1MjJ9.-bOShjsWKQMUUs_gQ-_mFSHt-n2RzPJkCAGaoJwdcnI"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {demo_token}"
    }
    
    logger.info(f"Testing POST to {url} without trailing slash")
    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        logger.info(f"Status code: {response.status_code}")
        if response.status_code == 200 or response.status_code == 201:
            logger.info("Success! Response:")
            logger.info(json.dumps(response.json(), indent=2))
        else:
            logger.error(f"Failed with status code {response.status_code}")
            logger.error(f"Response: {response.text}")
    except Exception as e:
        logger.error(f"Exception: {e}")

def test_all_routes():
    """Get all API routes from debug endpoint"""
    url = f"{API_URL}/debug/routes"
    logger.info(f"Getting all routes from {url}")
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            routes = response.json().get("routes", [])
            logger.info("Available routes:")
            for route in routes:
                path = route.get("path", "")
                methods = route.get("methods", [])
                logger.info(f"{path} - {methods}")
        else:
            logger.error(f"Failed to get routes: {response.status_code}")
    except Exception as e:
        logger.error(f"Exception: {e}")

if __name__ == "__main__":
    test_all_routes()
    test_topics_with_trailing_slash()
    test_topics_without_trailing_slash()
