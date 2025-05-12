import logging
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import time
import asyncio

from .database import engine, Base
from . import models
from .api import users, topics, entries, files, links, tags, auth

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

# Add CORS middleware with explicit method configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    
    # Log all registered routes on startup in a cleaner format
    logger.info("Registered routes:")
    for route in app.routes:
        methods = getattr(route, "methods", set())
        method_str = ', '.join(methods) if methods else 'No methods'
        logger.info(f"{method_str} - {route.path}")

    print("Registered routes:")
    for route in app.routes:
        print(f"{route.path} - {route.methods}")