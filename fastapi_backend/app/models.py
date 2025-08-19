from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy import (
    Column,
    String,
    Integer,
    ForeignKey,
    DateTime,
    Text,
    CheckConstraint,
)
from sqlalchemy.orm import relationship, DeclarativeBase
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from uuid import uuid4
from enum import Enum
from datetime import datetime, timezone


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
    application_status = Column(
        Text,
        CheckConstraint(
            "application_status IN ('Exploring', 'Shortlisting', 'Applying', 'Submitted')"
        ),
        nullable=False,
    )
    last_active = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        onupdate=datetime.now(timezone.utc),
    )
    tags = Column(ARRAY(Text), nullable=True, server_default="{}")
    internal_notes = Column(Text, nullable=True)


class Tags(str, Enum):
    NOT_CONTACTED = "Students not contacted in 7 days"
    HIGH_INTENT = "High intent"
    NEEDS_ESSAY_HELP = "Needs essay help"


class CommunicationType(str, Enum):
    EMAIL = "Email"
    SMS = "SMS"


class CommunicationLog(Base):
    __tablename__ = "communication_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    type = Column(Text, nullable=False)  # Email, SMS, etc.
    content = Column(Text, nullable=True)  # Description of the communication
    timestamp = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    # Relationship to Student
    student = relationship("Student", backref="communications")
