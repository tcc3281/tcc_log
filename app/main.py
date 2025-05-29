import logging
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.staticfiles import StaticFiles
import time
import asyncio
import os

from .database import engine, Base
from . import models
from .api import users, topics, entries, files, links, tags, auth, gallery, ai

# Tạo thư mục uploads nếu chưa tồn tại
uploads_dir = "uploads"
os.makedirs(uploads_dir, exist_ok=True)

# Import seed data module
from . import seed_data

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create a middleware to log request details including method
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Log detailed request information
        logger.info(f"Request: {request.method} {request.url}")
        logger.debug(f"Request headers: {request.headers}")
        
        # Process the request
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            response.headers["X-Process-Time"] = str(process_time)
            
            # Log response details
            logger.info(f"Response: {request.method} {request.url.path} - Status {response.status_code}")
            logger.debug(f"Response headers: {response.headers}")
            
            # Log slow responses
            if process_time > 1.0:
                logger.warning(f"Slow response for {request.method} {request.url.path}: {process_time:.2f}s")
            
            return response
        except Exception as e:
            logger.error(f"Error processing request {request.method} {request.url.path}: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": f"Internal server error: {str(e)}"}
            )

# Create FastAPI app with explicit configuration
app = FastAPI(
    title="Journal API",
    redirect_slashes=False,  # Important to avoid redirects that cause CORS issues
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Add request logging middleware first
app.add_middleware(RequestLoggingMiddleware)

# Define allowed origins
allowed_origins = [
    "http://localhost:3000",      # Local development
    "http://frontend:3000",       # Docker container to container
    "http://127.0.0.1:3000",      # Alternative local address
    "http://localhost:3001",      # In case of alternate port
]

# Check for additional allowed origins from environment variables
if os.getenv('ADDITIONAL_CORS_ORIGINS'):
    try:
        # Split by comma and strip whitespace
        additional_origins = [origin.strip() for origin in os.getenv('ADDITIONAL_CORS_ORIGINS').split(',')]
        allowed_origins.extend(additional_origins)
        logger.info(f"Added additional CORS origins: {additional_origins}")
    except Exception as e:
        logger.error(f"Error parsing ADDITIONAL_CORS_ORIGINS: {e}")

logger.info(f"CORS allowed origins: {allowed_origins}")

# Add CORS middleware with explicit method configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory to serve static files
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Global handler for all OPTIONS requests - FIX: change the path to avoid conflicts
@app.options("/api-options/{path:path}")
async def global_options_handler(request: Request, path: str = ""):
    logger.info(f"Global OPTIONS request received for path: /{path}")
    
    # Get the Origin of the request
    origin = request.headers.get("Origin", "*")
    
    # Return a response with appropriate CORS headers
    response = Response(content="")
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Max-Age"] = "86400"
    response.status_code = 200
    
    return response

# Add a test endpoint
@app.post("/test-post")
async def test_post_endpoint():
    """Test endpoint to verify POST method works"""
    return {"message": "POST method works!"}

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to the Journal API"}

# Add debug endpoint to list all routes
@app.get("/debug/routes")
async def debug_routes():
    """Debug endpoint to list all registered routes"""
    routes = []
    for route in app.routes:
        routes.append({
            "path": route.path,
            "name": route.name,
            "methods": getattr(route, "methods", None)
        })
    return {"routes": routes}

# IMPORTANT: Include API routers with explicit prefixes
app.include_router(auth.router)
app.include_router(users.router, prefix="/users")  # Add explicit prefix
app.include_router(topics.router, prefix="/topics")  # Add explicit prefix
app.include_router(entries.router, prefix="/entries")  # Ensure this line exists
app.include_router(files.router, prefix="/files")  # Add explicit prefix
app.include_router(links.router, prefix="/links")  # Add explicit prefix
app.include_router(tags.router, prefix="/tags")  # Add explicit prefix
app.include_router(gallery.router, prefix="/gallery")  # Gallery router
app.include_router(ai.router, prefix="/ai")  # AI functionality

# Add global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

# Initialize database tables
@app.on_event("startup")
async def startup_event():
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialization complete")
    
    # Seed database with initial data
    try:
        seed_data.seed_data()
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
    
    # Log all registered routes on startup in a cleaner format
    logger.info("Registered routes:")
    for route in app.routes:
        methods = getattr(route, "methods", set())
        method_str = ', '.join(methods) if methods else 'No methods'
        logger.info(f"{method_str} - {route.path}")

    print("Registered routes:")
    for route in app.routes:
        # Check if route has a path and methods attributes
        if hasattr(route, "path"):
            methods = getattr(route, "methods", "No methods")
            methods_str = methods if isinstance(methods, str) else str(methods)
            print(f"{route.path} - {methods_str}")
        else:
            # For Mount objects or other special routes
            name = getattr(route, "name", "Unknown")
            print(f"Special route: {name}")