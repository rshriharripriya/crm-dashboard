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
from .database import close_db


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


# VERCEL FIX: Add global exception handler for event loop issues
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_message = str(exc)

    # Handle specific async/event loop errors
    if "Event loop is closed" in error_message:
        return JSONResponse(
            status_code=500,
            content={"detail": "Database connection error. Please try again."},
        )

    # Handle other database-related errors
    if any(keyword in error_message.lower() for keyword in
           ["connection", "database", "pool", "timeout", "asyncpg"]):
        return JSONResponse(
            status_code=500,
            content={"detail": "Database service temporarily unavailable."},
        )



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


# VERCEL FIX: Add startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize the application"""
    try:
        # Only create tables if needed (be careful in production)
        # await create_db_and_tables()  # Uncomment if needed
        pass
    except Exception as e:
        print(f"Startup error: {e}")
        # Don't crash the app on startup errors


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    try:
        await close_db()
    except Exception:
        pass  # Ignore cleanup errors during shutdown


# VERCEL FIX: Add health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    """Simple health check endpoint"""
    return {"status": "healthy", "message": "API is running"}


# VERCEL FIX: Add root endpoint
@app.get("/", tags=["root"])
async def read_root():
    """Root endpoint"""
    return {"message": "CRM Dashboard API", "status": "running"}