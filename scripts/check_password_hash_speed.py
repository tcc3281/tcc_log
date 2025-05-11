#!/usr/bin/env python3
import time
import logging
import sys
from passlib.context import CryptContext

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger("password-hash-check")

def main():
    # Create password hasher with default settings
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Test password hashing time
    logger.info("Testing password hashing performance...")
    
    test_password = "test_password123"
    
    # Test hashing
    start_time = time.time()
    hashed_password = pwd_context.hash(test_password)
    hash_time = time.time() - start_time
    logger.info(f"Password hashing took {hash_time:.4f}s")
    
    # Test verification
    start_time = time.time()
    is_verified = pwd_context.verify(test_password, hashed_password)
    verify_time = time.time() - start_time
    logger.info(f"Password verification took {verify_time:.4f}s, result: {is_verified}")
    
    # If hashing takes more than 0.5 seconds, it might be too slow for web usage
    if hash_time > 0.5:
        logger.warning("Password hashing seems slow. Consider adjusting bcrypt parameters.")
    
if __name__ == "__main__":
    main()
