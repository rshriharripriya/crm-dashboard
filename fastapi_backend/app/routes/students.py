# students.py - Updated with event loop protection
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from uuid import UUID
from typing import List
from datetime import datetime, timedelta, UTC
from fastapi import APIRouter, HTTPException, Depends
import asyncio

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


async def execute_with_timeout(session: AsyncSession, query, timeout: float = 10.0):
    """Execute a database query with timeout and event loop protection"""
    try:
        # Check if event loop is running
        loop = asyncio.get_running_loop()
        if loop.is_closed():
            raise HTTPException(status_code=503, detail="Service temporarily unavailable")

        # Execute query with timeout
        task = asyncio.create_task(session.execute(query))
        result = await asyncio.wait_for(task, timeout=timeout)
        return result

    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail=f"Database query timeout after {timeout}s")
    except Exception as e:
        error_msg = str(e)
        if "Event loop is closed" in error_msg:
            raise HTTPException(status_code=503, detail="Service restarting")
        elif "connection" in error_msg.lower():
            raise HTTPException(status_code=503, detail="Database connection error")
        else:
            raise HTTPException(status_code=500, detail="Database operation failed")


@router.get("/stats", response_model=StudentStats)
async def get_student_stats(db: AsyncSession = Depends(get_async_session)):
    """
    Get student statistics with event loop protection
    """
    try:
        # Check event loop health first
        try:
            loop = asyncio.get_running_loop()
            if loop.is_closed():
                raise HTTPException(status_code=503, detail="Service temporarily unavailable")
        except RuntimeError:
            raise HTTPException(status_code=503, detail="No event loop available")

        # Calculate time thresholds
        now = datetime.now(UTC)
        six_months_ago = now - timedelta(days=180)

        # Count active students
        active_query = select(func.count()).where(Student.last_active >= six_months_ago)
        active_result = await execute_with_timeout(db, active_query, timeout=8.0)
        active_students = active_result.scalar() or 0

        # Count students in applying stage
        applying_query = select(func.count()).where(
            Student.last_active >= six_months_ago,
            Student.application_status == "Applying",
        )
        applying_result = await execute_with_timeout(db, applying_query, timeout=8.0)
        applying_stage = applying_result.scalar() or 0

        # Count students needing essay help
        essay_help_query = select(func.count()).where(
            Student.last_active >= six_months_ago,
            Student.tags.any(Tags.NEEDS_ESSAY_HELP.value),
        )
        essay_help_result = await execute_with_timeout(db, essay_help_query, timeout=8.0)
        needs_essay_help = essay_help_result.scalar() or 0

        # Count high intent students
        high_intent_query = select(func.count()).where(
            Student.last_active >= six_months_ago,
            Student.tags.any(Tags.HIGH_INTENT.value),
        )
        high_intent_result = await execute_with_timeout(db, high_intent_query, timeout=8.0)
        high_intent = high_intent_result.scalar() or 0

        # Count not contacted students
        not_contacted_query = select(func.count()).where(
            Student.last_active >= six_months_ago,
            Student.tags.any(Tags.NOT_CONTACTED.value),
        )
        not_contacted_result = await execute_with_timeout(db, not_contacted_query, timeout=8.0)
        not_contacted_recently = not_contacted_result.scalar() or 0

        return StudentStats(
            activeStudents=active_students,
            applyingStage=applying_stage,
            needsEssayHelp=needs_essay_help,
            highIntent=high_intent,
            notContactedRecently=not_contacted_recently,
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Unexpected error in get_student_stats: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Error calculating student statistics"
        )


@router.get("/", response_model=List[StudentRead])
async def get_students(db: AsyncSession = Depends(get_async_session)):
    try:
        query = select(Student)
        result = await execute_with_timeout(db, query, timeout=10.0)
        students = result.scalars().all()
        return students
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting students: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching students")


@router.get("/{student_id}", response_model=StudentRead)
async def get_student(student_id: str, db: AsyncSession = Depends(get_async_session)):
    try:
        try:
            student_uuid = UUID(student_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid student ID format")

        query = select(Student).where(Student.id == student_uuid)
        result = await execute_with_timeout(db, query, timeout=5.0)
        student = result.scalar_one_or_none()

        if student is None:
            raise HTTPException(status_code=404, detail="Student not found")

        # Refresh with timeout protection
        refresh_task = asyncio.create_task(db.refresh(student))
        await asyncio.wait_for(refresh_task, timeout=3.0)
        return student

    except HTTPException:
        raise
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Database operation timeout")
    except Exception as e:
        print(f"Error getting student {student_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching student")


@router.post("/", response_model=StudentRead)
async def create_student(
        student: StudentCreate, db: AsyncSession = Depends(get_async_session)
):
    try:
        db_student = Student(**student.model_dump())
        db.add(db_student)

        # Commit with timeout
        commit_task = asyncio.create_task(db.commit())
        await asyncio.wait_for(commit_task, timeout=5.0)

        # Refresh with timeout
        refresh_task = asyncio.create_task(db.refresh(db_student))
        await asyncio.wait_for(refresh_task, timeout=3.0)

        return db_student

    except asyncio.TimeoutError:
        await db.rollback()
        raise HTTPException(status_code=504, detail="Create operation timeout")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error creating student: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating student")


@router.patch("/{student_id}", response_model=StudentRead)
async def update_student(
        student_id: str,
        student_update: StudentBase,
        db: AsyncSession = Depends(get_async_session),
):
    try:
        try:
            student_uuid = UUID(student_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid student ID format")

        query = select(Student).where(Student.id == student_uuid)
        result = await execute_with_timeout(db, query, timeout=5.0)
        student = result.scalar_one_or_none()

        if student is None:
            raise HTTPException(status_code=404, detail="Student not found")

        # Update student fields
        for field, value in student_update.model_dump(exclude_unset=True).items():
            setattr(student, field, value)

        student.updated_at = datetime.now(UTC)

        # Commit with timeout
        commit_task = asyncio.create_task(db.commit())
        await asyncio.wait_for(commit_task, timeout=5.0)

        # Refresh with timeout
        refresh_task = asyncio.create_task(db.refresh(student))
        await asyncio.wait_for(refresh_task, timeout=3.0)

        return student

    except HTTPException:
        raise
    except asyncio.TimeoutError:
        await db.rollback()
        raise HTTPException(status_code=504, detail="Update operation timeout")
    except Exception as e:
        await db.rollback()
        print(f"Error updating student {student_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating student")


@router.patch("/{student_id}/internal_notes", response_model=StudentRead)
async def update_student_internal_notes(
        student_id: str,
        notes_update: InternalNotesUpdate,
        db: AsyncSession = Depends(get_async_session),
):
    try:
        try:
            student_uuid = UUID(student_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid student ID format")

        query = select(Student).where(Student.id == student_uuid)
        result = await execute_with_timeout(db, query, timeout=5.0)
        student = result.scalar_one_or_none()

        if student is None:
            raise HTTPException(status_code=404, detail="Student not found")

        # Update safely
        student.internal_notes = notes_update.internal_notes
        student.updated_at = datetime.now(UTC)

        # Commit with timeout
        commit_task = asyncio.create_task(db.commit())
        await asyncio.wait_for(commit_task, timeout=5.0)

        # Refresh with timeout
        refresh_task = asyncio.create_task(db.refresh(student))
        await asyncio.wait_for(refresh_task, timeout=3.0)

        return student

    except HTTPException:
        raise
    except asyncio.TimeoutError:
        await db.rollback()
        raise HTTPException(status_code=504, detail="Update operation timeout")
    except Exception as e:
        await db.rollback()
        print(f"Error updating notes for student {student_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating internal notes")


@router.patch("/{student_id}/tags", response_model=StudentRead)
async def update_student_tags(
        student_id: UUID,
        tags_update: StudentTagsUpdate,
        db: AsyncSession = Depends(get_async_session),
):
    """Update student tags with event loop protection"""
    try:
        # Method 1: Using SQLAlchemy ORM update (RECOMMENDED)
        update_query = (
            update(Student)
            .where(Student.id == student_id)
            .values(
                tags=tags_update.tags,
                updated_at=datetime.now(UTC),
            )
            .returning(Student)
        )

        result = await execute_with_timeout(db, update_query, timeout=8.0)
        updated_student = result.fetchone()

        if not updated_student:
            raise HTTPException(status_code=404, detail="Student not found")

        # Commit with timeout
        commit_task = asyncio.create_task(db.commit())
        await asyncio.wait_for(commit_task, timeout=5.0)

        return updated_student[0]  # Return the Student object

    except HTTPException:
        raise
    except asyncio.TimeoutError:
        await db.rollback()
        raise HTTPException(status_code=504, detail="Update tags timeout")
    except Exception as e:
        await db.rollback()
        print(f"Update tags error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update tags")


@router.post("/{student_id}/email")
async def send_follow_up_email(
        student_id: str, db: AsyncSession = Depends(get_async_session)
):
    try:
        try:
            student_uuid = UUID(student_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid student ID format")

        query = select(Student).where(Student.id == student_uuid)
        result = await execute_with_timeout(db, query, timeout=5.0)
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

        # Commit with timeout
        commit_task = asyncio.create_task(db.commit())
        await asyncio.wait_for(commit_task, timeout=5.0)

        # Refresh with timeout
        refresh_task = asyncio.create_task(db.refresh(communication_log))
        await asyncio.wait_for(refresh_task, timeout=3.0)

        # Mock email sending
        return {"message": f"Follow-up email sent to {student.email}"}

    except HTTPException:
        raise
    except asyncio.TimeoutError:
        await db.rollback()
        raise HTTPException(status_code=504, detail="Email operation timeout")
    except Exception as e:
        await db.rollback()
        print(f"Error sending email to student {student_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error sending follow-up email")


@router.post("/{student_id}/communication", response_model=CommunicationLogRead)
async def add_communication_log(
        student_id: str,
        communication: CommunicationLogCreate,
        db: AsyncSession = Depends(get_async_session),
):
    """Add a communication log entry for a student"""
    try:
        try:
            student_uuid = UUID(student_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid student ID format")

        # Verify student exists
        query = select(Student).where(Student.id == student_uuid)
        result = await execute_with_timeout(db, query, timeout=5.0)
        student = result.scalar_one_or_none()

        if student is None:
            raise HTTPException(status_code=404, detail="Student not found")

        # Create communication log entry
        communication_log = CommunicationLog(
            student_id=student_uuid,
            type=communication.type,
            content=communication.content
        )
        db.add(communication_log)

        # Commit with timeout
        commit_task = asyncio.create_task(db.commit())
        await asyncio.wait_for(commit_task, timeout=5.0)

        # Refresh with timeout
        refresh_task = asyncio.create_task(db.refresh(communication_log))
        await asyncio.wait_for(refresh_task, timeout=3.0)

        return communication_log

    except HTTPException:
        raise
    except asyncio.TimeoutError:
        await db.rollback()
        raise HTTPException(status_code=504, detail="Communication log timeout")
    except Exception as e:
        await db.rollback()
        print(f"Error adding communication log for student {student_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error adding communication log")


@router.get("/{student_id}/communications", response_model=List[CommunicationLogRead])
async def get_student_communications(
        student_id: str,
        limit: int = 3,  # Default to last 3 entries
        db: AsyncSession = Depends(get_async_session),
):
    """Get communication logs for a student, limited to last N entries"""
    try:
        try:
            student_uuid = UUID(student_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid student ID format")

        # Verify student exists
        student_query = select(Student).where(Student.id == student_uuid)
        student_result = await execute_with_timeout(db, student_query, timeout=5.0)
        student = student_result.scalar_one_or_none()

        if student is None:
            raise HTTPException(status_code=404, detail="Student not found")

        # Get communication logs, ordered by timestamp descending (newest first)
        comm_query = (
            select(CommunicationLog)
            .where(CommunicationLog.student_id == student_uuid)
            .order_by(CommunicationLog.timestamp.desc())
            .limit(limit)
        )
        result = await execute_with_timeout(db, comm_query, timeout=8.0)
        communications = result.scalars().all()

        return communications

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting communications for student {student_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching communications")


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
        student_query = select(Student).where(Student.id == student_uuid)
        result = await execute_with_timeout(db, student_query, timeout=5.0)
        student = result.scalar_one_or_none()

        if student is None:
            raise HTTPException(status_code=404, detail="Student not found")

        # Fetch communication logs (last 10 for context)
        comm_query = (
            select(CommunicationLog)
            .where(CommunicationLog.student_id == student_uuid)
            .order_by(CommunicationLog.timestamp.desc())
            .limit(10)
        )
        comm_result = await execute_with_timeout(db, comm_query, timeout=8.0)
        communication_logs = comm_result.scalars().all()

        # Generate AI summary with timeout protection
        ai_service = AIService()

        async def generate_summary():
            return await ai_service.generate_student_summary(
                student=student, communication_logs=list(communication_logs)
            )

        # Apply timeout to AI service call
        summary_task = asyncio.create_task(generate_summary())
        summary = await asyncio.wait_for(summary_task, timeout=30.0)  # Longer timeout for AI

        return {"summary": summary}

    except HTTPException:
        raise
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="AI summary generation timeout")
    except Exception as e:
        print(f"Error generating AI summary for student {student_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate AI summary")


# Health check endpoint
@router.get("/health")
async def students_health():
    """Health check for students service"""
    try:
        # Check event loop
        loop = asyncio.get_running_loop()
        loop_healthy = not loop.is_closed()

        return {
            "status": "healthy" if loop_healthy else "unhealthy",
            "event_loop_healthy": loop_healthy,
            "service": "students"
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "service": "students"
        }


# Simple ping endpoint that doesn't require database
@router.get("/ping")
async def ping():
    """Simple ping endpoint"""
    try:
        loop = asyncio.get_running_loop()
        return {
            "message": "pong",
            "event_loop_running": not loop.is_closed(),
            "timestamp": loop.time()
        }
    except Exception as e:
        return {
            "message": "pong",
            "error": str(e)
        }