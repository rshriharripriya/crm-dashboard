# main.py
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from .schemas import UserCreate, UserRead, UserUpdate
from .users import auth_backend, fastapi_users, AUTH_URL_PATH, UserManager
from fastapi.middleware.cors import CORSMiddleware
from .utils import simple_generate_unique_route_id
from app.routes.items import router as items_router
from app.routes.students import router as students_router
from app.config import settings
from fastapi_users import InvalidPasswordException
from .database import check_database_health
import logging

# Set up logging for better debugging in serverless
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    generate_unique_id_function=simple_generate_unique_route_id,
    openapi_url=settings.OPENAPI_URL,
)

# Middleware for CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.exception_handler(InvalidPasswordException)
async def invalid_password_exception_handler(
        request: Request, exc: InvalidPasswordException
):
    return JSONResponse(
        status_code=400,
        content={"detail": exc.reason},
    )


# Enhanced exception handler for serverless database issues
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_message = str(exc)

    # Log the error for debugging
    logger.error(f"Unhandled exception on {request.url}: {error_message}")

    # Handle specific serverless/database errors
    if "Event loop is closed" in error_message:
        return JSONResponse(
            status_code=503,  # Service Unavailable
            content={"detail": "Service temporarily unavailable. Please retry."},
        )

    # Handle connection timeouts specifically
    if any(keyword in error_message.lower() for keyword in
           ["timeout", "timed out", "connection timeout"]):
        return JSONResponse(
            status_code=504,  # Gateway Timeout
            content={"detail": "Database request timed out. Please try again."},
        )

    # Handle other database-related errors
    if any(keyword in error_message.lower() for keyword in
           ["connection", "database", "pool", "asyncpg", "postgresql"]):
        return JSONResponse(
            status_code=503,  # Service Unavailable
            content={"detail": "Database service temporarily unavailable."},
        )

    # Handle serverless function limits
    if "execution time limit" in error_message.lower():
        return JSONResponse(
            status_code=504,
            content={"detail": "Request processing time exceeded. Please try a simpler request."},
        )

    # Generic server error
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# Include authentication and user management routes
app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix=f"/{AUTH_URL_PATH}/jwt",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix=f"/{AUTH_URL_PATH}",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_reset_password_router(),
    prefix=f"/{AUTH_URL_PATH}",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix=f"/{AUTH_URL_PATH}",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)

# Include items routes
app.include_router(items_router, prefix="/items")

# Include students routes
app.include_router(students_router, prefix="/students")


# Serverless-optimized startup - NO database calls for speed
@app.on_event("startup")
async def startup_event():
    """
    Minimal startup for serverless - avoid any database calls for speed
    """
    try:
        logger.info("FastAPI application starting up...")

        # NO database health check on startup - it slows everything down
        # Database connections are tested on first actual request

        logger.info("Application startup completed")

    except Exception as e:
        logger.error(f"Startup error: {e}")
        # Don't crash the app on startup errors in serverless


# No shutdown event needed for NullPool serverless setup
# Vercel may not reliably call shutdown events anyway

# Enhanced health check with database status
@app.get("/health", tags=["health"])
async def health_check():
    """Enhanced health check with database connectivity"""
    try:
        # Quick database check
        db_healthy = await check_database_health()

        return {
            "status": "healthy" if db_healthy else "degraded",
            "api": "running",
            "database": "connected" if db_healthy else "disconnected",
            "message": "API is running with NullPool serverless database configuration"
        }
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "unhealthy",
            "api": "running",
            "database": "error",
            "message": f"Health check failed: {str(e)}"
        }


# Root endpoint
@app.get("/", tags=["root"])
async def read_root():
    """Root endpoint with system info"""
    return {
        "message": "CRM Dashboard API",
        "status": "running",
        "environment": "serverless",
        "database": "NullPool configuration"
    }


# Additional endpoint for database diagnostics (useful for debugging)
@app.get("/db-status", tags=["diagnostics"])
async def database_status():
    """Database diagnostic endpoint"""
    try:
        is_healthy = await check_database_health()
        return {
            "database_healthy": is_healthy,
            "connection_type": "NullPool (serverless)",
            "note": "Each request creates a fresh database connection"
        }
    except Exception as e:
        return {
            "database_healthy": False,
            "error": str(e),
            "connection_type": "NullPool (serverless)"
        }