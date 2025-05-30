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

def run_migrations():
    """Run alembic migrations to ensure database is up to date"""
    import subprocess
    import time
    
    # Wait for the database to be ready
    logger.info("Waiting for database to be ready...")
    max_retries = 30
    retry_interval = 2
    
    # Get database parameters from DATABASE_URL
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        logger.warning("DATABASE_URL environment variable not set, skipping migrations")
        return
    
    # Extract host from DATABASE_URL (assuming format postgresql+psycopg2://user:pass@host:port/dbname)
    try:
        db_host = db_url.split('@')[1].split(':')[0]
        logger.info(f"Database host: {db_host}")
    except Exception as e:
        logger.error(f"Failed to extract database host from URL: {e}")
        db_host = 'db'  # Default to service name in docker-compose
    
    for i in range(max_retries):
        try:
            # Use pg_isready to check if PostgreSQL is accepting connections
            subprocess.run(
                ["pg_isready", "-h", db_host], 
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            logger.info("Database is ready")
            break
        except (subprocess.SubprocessError, subprocess.CalledProcessError) as e:
            logger.warning(f"Database not ready yet (attempt {i+1}/{max_retries}): {e}")
            if i < max_retries - 1:
                time.sleep(retry_interval)
    else:
        logger.error("Could not connect to database after multiple attempts")
        # Continue anyway, alembic will fail if DB is not available
    
    # Run migrations
    try:
        logger.info("Running database migrations...")
<<<<<<< HEAD
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        logger.info("Database migrations completed successfully")
        if result.stdout:
            logger.info(f"Migration output: {result.stdout}")
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to run migrations: {e}")
        stderr_output = e.stderr if e.stderr else ''
        stdout_output = e.stdout if e.stdout else ''
        logger.error(f"STDOUT: {stdout_output}")
        logger.error(f"STDERR: {stderr_output}")
        
        # Check if it's a revision not found error
        if "Can't locate revision identified by" in stderr_output:
            logger.warning("Detected migration revision mismatch. Attempting to reset migrations...")
            try:
                # Try to reset migrations
                logger.info("Dropping alembic_version table and reinitializing...")
                from sqlalchemy import create_engine, text
                engine = create_engine(db_url)
                
                with engine.connect() as connection:
                    connection.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE;"))
                    connection.commit()
                    logger.info("Dropped alembic_version table")
                
                # Stamp with current head
                logger.info("Stamping database with current revision...")
                subprocess.run(
                    ["alembic", "stamp", "head"],
                    check=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                logger.info("Database stamped successfully. Migrations reset complete.")
                
            except Exception as reset_error:
                logger.error(f"Failed to reset migrations: {reset_error}")
                logger.error("Manual intervention may be required.")
        else:
            logger.error("Migration failed with unknown error. Manual intervention may be required.")
=======
        subprocess.run(
            ["alembic", "upgrade", "head"],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        logger.info("Database migrations completed successfully")
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to run migrations: {e}")
        logger.error(f"STDOUT: {e.stdout.decode() if e.stdout else ''}")
        logger.error(f"STDERR: {e.stderr.decode() if e.stderr else ''}")
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3

def main():
    logger.info("Starting Journal API server...")
    
    # Check for DATABASE_URL
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        logger.warning("DATABASE_URL environment variable not set")
    else:
        logger.info(f"Using database: {db_url.split('@')[-1].split('/')[0]}")
    
    # Run database migrations
    run_migrations()
    
    # Log key information
    logger.info("API will be available at: http://localhost:8000")
    logger.info("API documentation will be available at: http://localhost:8000/docs")
      # Check if running in Docker (reload may cause issues in container)
    is_docker = os.path.exists('/.dockerenv') or os.environ.get('DOCKER_CONTAINER', False)
    
    # Run with more detailed logging to diagnose CORS issues
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0",
        port=8000, 
        reload=not is_docker,  # Disable reload in Docker containers
        log_level="debug",
        forwarded_allow_ips="*",
        proxy_headers=True,
        timeout_keep_alive=120,  # Increase keep-alive timeout
        timeout_graceful_shutdown=30  # Allow more time for graceful shutdown
    )

if __name__ == "__main__":
    main()
