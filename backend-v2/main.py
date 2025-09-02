"""
FastAPI E-commerce Order System
Main application entry point
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator
import time
import os
from datetime import datetime
import pytz

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.database import engine, Base
from app.core.logging import setup_logging, get_logger
from app.api.routes import auth_router, orders_router, users_router, health_router, background_router
from app.background_jobs import job_manager

# Setup logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan events"""
    # Startup
    logger.info("Starting E-commerce Order System API", version="2.0.0")
    
    # Set timezone to IST
    os.environ['TZ'] = 'Asia/Kolkata'
    time.tzset()
    logger.info(f"Timezone set to IST: {datetime.now().strftime('%Y-%m-%d %H:%M:%S %Z')}")
    
    # Create database tables
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error("Failed to create database tables", error=str(e))
        raise
    
    # Start background job manager
    try:
        await job_manager.start()
        logger.info("Background job manager started successfully")
    except Exception as e:
        logger.error("Failed to start background job manager", error=str(e))
    
    yield
    
    # Shutdown
    logger.info("Shutting down E-commerce Order System API")
    await job_manager.stop()


# Create FastAPI application
app = FastAPI(
    title="E-commerce Order System API",
    description="Professional e-commerce order management system with user isolation and role-based access control",
    version="2.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan
)


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for debugging
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)


# Custom exception handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions"""
    logger.warning(
        "HTTP exception occurred",
        status_code=exc.status_code,
        detail=exc.detail,
        path=request.url.path
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors"""
    logger.warning(
        "Validation error occurred",
        errors=exc.errors(),
        path=request.url.path
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "Validation error",
            "details": exc.errors()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(
        "Unhandled exception occurred",
        error=str(exc),
        path=request.url.path,
        exc_info=True
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal server error"
        }
    )


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests"""
    start_time = time.time()
    
    # Log request
    logger.info(
        "Request started",
        method=request.method,
        url=str(request.url),
        client=request.client.host if request.client else None
    )
    
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    logger.info(
        "Request completed",
        method=request.method,
        url=str(request.url),
        status_code=response.status_code,
        process_time=round(process_time, 4)
    )
    
    return response


# Include routers
app.include_router(health_router)
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(orders_router, prefix="/api")
app.include_router(background_router, prefix="/api")


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "E-commerce Order System API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs" if settings.debug else None
    }


if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"Starting server on {settings.host}:{settings.port}")
    logger.info(f"Debug mode: {settings.debug}")
    logger.info(f"API Documentation: http://{settings.host}:{settings.port}/docs")
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_config=None,
        access_log=False  # Use our custom logging middleware instead
    )
