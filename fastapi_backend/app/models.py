from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Text, CheckConstraint
from sqlalchemy.orm import relationship, DeclarativeBase
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from uuid import uuid4
from datetime import datetime, UTC
from enum import Enum


class Base(DeclarativeBase):
    pass


class User(SQLAlchemyBaseUserTableUUID, Base):
    items = relationship("Item", back_populates="user", cascade="all, delete-orphan")


class Item(Base):
    __tablename__ = "items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    quantity = Column(Integer, nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)

    user = relationship("User", back_populates="items")


class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(Text, nullable=False)
    email = Column(Text, unique=True, nullable=False)
    phone = Column(Text, nullable=True)
    country = Column(Text, nullable=True)
    application_status = Column(Text, CheckConstraint(
        "application_status IN ('Exploring', 'Shortlisting', 'Applying', 'Submitted')"
    ), nullable=False)
    last_active = Column(DateTime(timezone=True), default=datetime.now(UTC))
    created_at = Column(DateTime, default=datetime.now(UTC))
    updated_at = Column(DateTime, default=datetime.now(UTC), onupdate=datetime.now(UTC))    # Changed from ARRAY(String) to ARRAY(Text) to match the database
    tags = Column(ARRAY(Text), nullable=True, server_default="{}")


class Tags(str, Enum):
    NOT_CONTACTED = "Students not contacted in 7 days"
    HIGH_INTENT = "High intent"
    NEEDS_ESSAY_HELP = "Needs essay help"