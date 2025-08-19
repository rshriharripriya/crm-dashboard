# students.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from uuid import UUID
from typing import List
from datetime import datetime, timedelta, UTC
from fastapi import APIRouter, HTTPException, Depends

# Your existing imports
from ..database import get_async_session
from ..models import Student, Tags, CommunicationLog, CommunicationType
from ..schemas import (
    StudentRead,
    StudentCreate,
    StudentBase,
    StudentTagsUpdate,
    StudentStats,
    CommunicationLogRead,
    CommunicationLogCreate,
    InternalNotesUpdate,
)

# AI Service import
from ..ai_service import AIService


router = APIRouter(tags=["students"])





@router.get("/stats", response_model=StudentStats)
async def get_student_stats(db: AsyncSession = Depends(get_async_session)):
    """
    Get student statistics with:
    - Active students = last_active within 6 months
    - All counts based on active students only
    - Exact tag matching from enum values
    - Proper application status matching
    """
    try:
        # Calculate time thresholds
        now = datetime.now(UTC)
        six_months_ago = now - timedelta(days=180)

        # Count active students
        active_result = await db.execute(
            select(func.count()).where(Student.last_active >= six_months_ago)
        )
        active_students = active_result.scalar() or 0

        # Count students in applying stage
        applying_result = await db.execute(
            select(func.count()).where(
                Student.last_active >= six_months_ago,
                Student.application_status == "Applying",
            )
        )
        applying_stage = applying_result.scalar() or 0

        # Count students needing essay help - FIXED array query
        essay_help_result = await db.execute(
            select(func.count()).where(
                Student.last_active >= six_months_ago,
                Student.tags.any(Tags.NEEDS_ESSAY_HELP.value),  # Changed from contains
            )
        )
        needs_essay_help = essay_help_result.scalar() or 0

        # Count high intent students - FIXED array query
        high_intent_result = await db.execute(
            select(func.count()).where(
                Student.last_active >= six_months_ago,
                Student.tags.any(Tags.HIGH_INTENT.value),  # Changed from contains
            )
        )
        high_intent = high_intent_result.scalar() or 0

        not_contacted_result = await db.execute(
            select(func.count()).where(
                Student.last_active >= six_months_ago,
                Student.tags.any(Tags.NOT_CONTACTED.value),
            )
        )
        not_contacted_recently = not_contacted_result.scalar() or 0

        return StudentStats(
            activeStudents=active_students,
            applyingStage=applying_stage,
            needsEssayHelp=needs_essay_help,
            highIntent=high_intent,
            notContactedRecently=not_contacted_recently,
        )

    except Exception as e:
        # Add proper logging to see the actual error
        print(f"Database error: {str(e)}")  # Add proper logging here
        raise HTTPException(
            status_code=500, detail=f"Error calculating student statistics: {str(e)}"
        )


@router.get("/", response_model=List[StudentRead])
async def get_students(db: AsyncSession = Depends(get_async_session)):
    result = await db.execute(select(Student))
    students = result.scalars().all()
    return students


@router.get("/{student_id}", response_model=StudentRead)
async def get_student(student_id: str, db: AsyncSession = Depends(get_async_session)):
    try:
        student_uuid = UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student ID format")

    result = await db.execute(select(Student).where(Student.id == student_uuid))
    student = result.scalar_one_or_none()

    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    # Ensure updated_at is not None before returning
    await db.refresh(student)
    return student


@router.post("/", response_model=StudentRead)
async def create_student(
    student: StudentCreate, db: AsyncSession = Depends(get_async_session)
):
    db_student = Student(**student.model_dump())
    db.add(db_student)
    await db.commit()
    await db.refresh(db_student)
    return db_student


@router.patch("/{student_id}", response_model=StudentRead)
async def update_student(
    student_id: str,
    student_update: StudentBase,
    db: AsyncSession = Depends(get_async_session),
):
    try:
        student_uuid = UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student ID format")

    result = await db.execute(select(Student).where(Student.id == student_uuid))
    student = result.scalar_one_or_none()

    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    # Update student fields
    for field, value in student_update.model_dump(exclude_unset=True).items():
        setattr(student, field, value)

    student.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(student)
    return student


@router.patch("/{student_id}/internal_notes", response_model=StudentRead)
async def update_student_internal_notes(
    student_id: str,
    notes_update: InternalNotesUpdate,
    db: AsyncSession = Depends(get_async_session),
):
    try:
        student_uuid = UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student ID format")

    result = await db.execute(select(Student).where(Student.id == student_uuid))
    student = result.scalar_one_or_none()

    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    # Update safely
    student.internal_notes = notes_update.internal_notes
    student.updated_at = datetime.now(UTC)

    await db.commit()
    await db.refresh(student)
    return student


@router.patch("/{student_id}/tags", response_model=StudentRead)
async def update_student_tags(
    student_id: UUID,
    tags_update: StudentTagsUpdate,
    db: AsyncSession = Depends(get_async_session),
):
    """Update student tags"""
    try:
        # Method 1: Using SQLAlchemy ORM update (RECOMMENDED)
        result = await db.execute(
            update(Student)
            .where(Student.id == student_id)
            .values(
                tags=tags_update.tags,
                updated_at=datetime.now(UTC),
            )
            .returning(Student)
        )

        updated_student = result.fetchone()
        if not updated_student:
            raise HTTPException(status_code=404, detail="Student not found")

        await db.commit()
        return updated_student[0]  # Return the Student object

    except Exception as e:
        await db.rollback()
        print(f"Update tags error: {str(e)}")  # Add proper logging
        raise HTTPException(status_code=500, detail=f"Failed to update tags: {str(e)}")


@router.post("/{student_id}/email")
async def send_follow_up_email(
    student_id: str, db: AsyncSession = Depends(get_async_session)
):
    try:
        student_uuid = UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student ID format")

    result = await db.execute(select(Student).where(Student.id == student_uuid))
    student = result.scalar_one_or_none()

    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    # Create communication log entry
    communication_log = CommunicationLog(
        student_id=student_uuid,
        type=CommunicationType.EMAIL.value,
        content="Follow-up email sent",
    )
    db.add(communication_log)

    await db.commit()
    await db.refresh(communication_log)

    # Mock email sending
    return {"message": f"Follow-up email sent to {student.email}"}


@router.post("/{student_id}/communication", response_model=CommunicationLogRead)
async def add_communication_log(
    student_id: str,
    communication: CommunicationLogCreate,
    db: AsyncSession = Depends(get_async_session),
):
    """Add a communication log entry for a student"""
    try:
        student_uuid = UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student ID format")

    # Verify student exists
    result = await db.execute(select(Student).where(Student.id == student_uuid))
    student = result.scalar_one_or_none()

    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    # Create communication log entry
    communication_log = CommunicationLog(
        student_id=student_uuid, type=communication.type, content=communication.content
    )
    db.add(communication_log)

    await db.commit()
    await db.refresh(communication_log)

    return communication_log


@router.get("/{student_id}/communications", response_model=List[CommunicationLogRead])
async def get_student_communications(
    student_id: str,
    limit: int = 3,  # Default to last 3 entries
    db: AsyncSession = Depends(get_async_session),
):
    """Get communication logs for a student, limited to last N entries"""
    try:
        student_uuid = UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student ID format")

    # Verify student exists
    result = await db.execute(select(Student).where(Student.id == student_uuid))
    student = result.scalar_one_or_none()

    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    # Get communication logs, ordered by timestamp descending (newest first)
    result = await db.execute(
        select(CommunicationLog)
        .where(CommunicationLog.student_id == student_uuid)
        .order_by(CommunicationLog.timestamp.desc())
        .limit(limit)
    )
    communications = result.scalars().all()

    return communications


# NEW AI SUMMARY ENDPOINT
@router.get("/{student_id}/ai-summary")
async def get_student_ai_summary(
    student_id: str, db: AsyncSession = Depends(get_async_session)
):
    """
    Generate an AI summary for a specific student using Groq/Llama
    """
    try:
        # Parse student UUID
        try:
            student_uuid = UUID(student_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid student ID format")

        # Fetch student from database
        result = await db.execute(select(Student).where(Student.id == student_uuid))
        student = result.scalar_one_or_none()

        if student is None:
            raise HTTPException(status_code=404, detail="Student not found")

        # Fetch communication logs (last 10 for context)
        comm_result = await db.execute(
            select(CommunicationLog)
            .where(CommunicationLog.student_id == student_uuid)
            .order_by(CommunicationLog.timestamp.desc())
            .limit(10)
        )
        communication_logs = comm_result.scalars().all()

        # Generate AI summary
        ai_service = AIService()
        summary = await ai_service.generate_student_summary(
            student=student, communication_logs=list(communication_logs)
        )

        return {"summary": summary}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating AI summary for student {student_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate AI summary")
