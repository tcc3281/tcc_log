#!/usr/bin/env python3
import requests
import logging
import sys
import time
import json
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("api-check")

# Load environment variables
load_dotenv()

# API URL
API_URL = "http://localhost:8000"

def check_options(endpoint):
    """Check OPTIONS request for an endpoint"""
    logger.info(f"Checking OPTIONS for {endpoint}")
    try:
        start_time = time.time()
        response = requests.options(f"{API_URL}{endpoint}")
        duration = time.time() - start_time
        
        logger.info(f"OPTIONS {endpoint} - Status: {response.status_code} in {duration:.4f}s")
        logger.info(f"Headers: {dict(response.headers)}")
        return response
    except Exception as e:
        logger.error(f"Error checking OPTIONS for {endpoint}: {e}")
        return None

def check_get(endpoint):
    """Check GET request for an endpoint"""
    logger.info(f"Checking GET for {endpoint}")
    try:
        start_time = time.time()
        response = requests.get(f"{API_URL}{endpoint}")
        duration = time.time() - start_time
        
        logger.info(f"GET {endpoint} - Status: {response.status_code} in {duration:.4f}s")
        if response.status_code == 200:
            logger.info(f"Content: {response.json()}")
        return response
    except Exception as e:
        logger.error(f"Error checking GET for {endpoint}: {e}")
        return None

def check_post(endpoint, data):
    """Check POST request for an endpoint with data"""
    logger.info(f"Checking POST for {endpoint}")
    logger.info(f"Data: {data}")
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{API_URL}{endpoint}",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        duration = time.time() - start_time
        
        logger.info(f"POST {endpoint} - Status: {response.status_code} in {duration:.4f}s")
        if response.status_code in (200, 201):
            logger.info(f"Response: {response.json()}")
        else:
            logger.error(f"Error response: {response.text}")
        return response
    except Exception as e:
        logger.error(f"Error checking POST for {endpoint}: {e}")
        return None

def main():
    """Check various API endpoints"""
    logger.info("Checking API endpoints...")
    
    # Check root endpoint
    check_get("/")
    
    # First, check OPTIONS for user creation (preflight request)
    check_options("/users/")
    
    # Check user creation
    user_data = {
        "username": f"testuser_{int(time.time())}",
        "email": f"test_{int(time.time())}@example.com",
        "password": "password123"
    }
    check_post("/users", user_data)

if __name__ == "__main__":
    main()
