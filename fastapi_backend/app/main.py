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
from .database import get_user_db
from fastapi_users import InvalidPasswordException

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

# Include authentication and user management routes
app.include_router(
    fastapi_users.get_auth_router(auth_backend, get_user_db=get_user_db),
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
