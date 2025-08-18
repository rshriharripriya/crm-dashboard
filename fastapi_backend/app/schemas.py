import uuid
from datetime import datetime

from fastapi_users import schemas
from pydantic import BaseModel
from uuid import UUID
from typing import List, Optional
from enum import Enum


class UserRead(schemas.BaseUser[uuid.UUID]):
    pass


class UserCreate(schemas.BaseUserCreate):
    pass


class UserUpdate(schemas.BaseUserUpdate):
    pass


class ItemBase(BaseModel):
    name: str
    description: str | None = None
    quantity: int | None = None


class ItemCreate(ItemBase):
    pass


class ItemRead(ItemBase):
    id: UUID
    user_id: UUID

    model_config = {"from_attributes": True}


# Student Schemas
class StudentBase(BaseModel):
    name: str
    email: str
    phone: str | None = None
    country: str | None = None
    application_status: str
    last_active: datetime | None = None
    tags: Optional[List[str]] = []


class StudentCreate(StudentBase):
    pass


class StudentRead(StudentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# Schema for updating tags only
class StudentTagsUpdate(BaseModel):
    tags: Optional[List[str]] = []

class StudentStats(BaseModel):
    """Schema for student statistics response"""
    activeStudents: int
    applyingStage: int
    needsEssayHelp: int
    highIntent: int
    notContactedRecently: int

    class Config:
        from_attributes = True
