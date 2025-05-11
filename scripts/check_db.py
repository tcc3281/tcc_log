#!/usr/bin/env python3
import time
import sys
import logging
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger("db-check")

# Load environment variables
load_dotenv()

def main():
    # Get database URL
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        logger.error("DATABASE_URL environment variable not set")
        return
    
    try:
        # Test database connection time
        logger.info("Testing database connection performance...")
        
        start_time = time.time()
        engine = create_engine(db_url)
        engine_creation_time = time.time() - start_time
        logger.info(f"Engine creation took {engine_creation_time:.4f}s")
        
        # Test connection establishment
        start_time = time.time()
        with engine.connect() as connection:
            connection_time = time.time() - start_time
            logger.info(f"Connection establishment took {connection_time:.4f}s")
            
            # Test simple query
            start_time = time.time()
            result = connection.execute(text("SELECT 1"))
            query_time = time.time() - start_time
            logger.info(f"Simple query execution took {query_time:.4f}s")
            
            # Test user table query if it exists
            try:
                start_time = time.time()
                result = connection.execute(text("SELECT COUNT(*) FROM users"))
                for row in result:
                    count = row[0]
                user_query_time = time.time() - start_time
                logger.info(f"User table query took {user_query_time:.4f}s, found {count} users")
            except Exception as e:
                logger.error(f"Error querying users table: {e}")
    
    except Exception as e:
        logger.error(f"Database connection error: {e}")

if __name__ == "__main__":
    main()
