#!/usr/bin/env python3
import uvicorn
import os
import logging
from dotenv import load_dotenv
import sys

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,  # Set to DEBUG for more verbose output
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

# Create logger
logger = logging.getLogger("backend")

# Load environment variables
load_dotenv()

def main():
    logger.info("Starting Journal API server...")
    
    # Check for DATABASE_URL
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        logger.warning("DATABASE_URL environment variable not set")
    else:
        logger.info(f"Using database: {db_url.split('@')[-1].split('/')[0]}")
    
    # Log key information
    logger.info("API will be available at: http://localhost:8000")
    logger.info("API documentation will be available at: http://localhost:8000/docs")
    
    # Run with more detailed logging to diagnose CORS issues
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0",
        port=8000, 
        reload=True,
        log_level="debug",
        forwarded_allow_ips="*",
        proxy_headers=True,
        timeout_keep_alive=120,  # Increase keep-alive timeout
        timeout_graceful_shutdown=30  # Allow more time for graceful shutdown
    )

if __name__ == "__main__":
    main()
