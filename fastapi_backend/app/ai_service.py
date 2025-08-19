# ai_service.py
import os

from typing import List
from datetime import datetime
from .models import Student, CommunicationLog
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


class AIService:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable not set")

        self.client = Groq(api_key=api_key)
        self.model = "llama3-70b-8192"  # Using Llama 3 70B for better analysis

    async def generate_student_summary(
        self, student: Student, communication_logs: List[CommunicationLog] = None
    ) -> str:
        """
        Generate an AI summary for a student based on their profile and communication history.

        Args:
            student: SQLAlchemy Student model instance
            communication_logs: List of SQLAlchemy CommunicationLog model instances

        Returns:
            str: AI-generated summary
        """
        try:
            # Prepare the context for the AI
            context = self._prepare_student_context(student, communication_logs)

            # Create the prompt
            prompt = f"""
You are an AI assistant helping university admissions staff understand students better. 
Analyze the following student profile and communication history to provide insights.

Student Profile:
{context}

Please provide a comprehensive summary that includes:


## Engagement Analysis for {student.name}
Level of interaction, responsiveness, and communication patterns

## Application Status
Progress assessment and potential areas of concern

## Recommendations
Specific actions or follow-ups suggested for admissions staff

## Risk Assessment
Any flags or areas requiring immediate attention

Keep the summary professional, concise, and actionable for admissions staff.
Focus on insights that would help staff better support this student's application journey.
Use clear headings and bullet points where appropriate.
"""

            # Generate the summary using Groq/Llama
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert university admissions consultant with 15+ years of experience in student assessment and application management. 

                        Your expertise includes:
                        - Identifying at-risk students who need additional support
                        - Recognizing high-potential applicants 
                        - Understanding communication patterns and engagement levels
                        - Providing actionable recommendations for admissions staff

                        Always provide clear, actionable insights that help staff make informed decisions about student support and follow-up actions.""",
                    },
                    {"role": "user", "content": prompt},
                ],
                model=self.model,
                temperature=0.3,  # Lower temperature for more focused, consistent responses
                max_tokens=1200,  # Increased for comprehensive analysis
                top_p=0.9,
                stream=False,
            )

            return chat_completion.choices[0].message.content.strip()

        except Exception as e:
            print(f"Error generating AI summary: {str(e)}")
            # Return a helpful error message instead of technical details
            return """## AI Summary Unavailable
            
            The creator of this application is too broke to buy api credits, please try again later.
"""

    def _prepare_student_context(
        self, student: Student, communication_logs: List[CommunicationLog] = None
    ) -> str:
        """
        Prepare student context for AI analysis using SQLAlchemy models

        Args:
            student: SQLAlchemy Student model instance
            communication_logs: List of SQLAlchemy CommunicationLog model instances

        Returns:
            str: Formatted context string for AI analysis
        """
        context_parts = []

        # Basic student information
        context_parts.append("=== BASIC INFORMATION ===")
        context_parts.append(f"Name: {student.name}")
        context_parts.append(f"Email: {student.email}")
        context_parts.append(f"Phone: {student.phone or 'Not provided'}")
        context_parts.append(f"Country: {student.country or 'Not provided'}")
        context_parts.append(f"Application Status: {student.application_status}")

        # Format timestamps properly
        if student.last_active:
            if isinstance(student.last_active, datetime):
                last_active_str = student.last_active.strftime("%Y-%m-%d %H:%M:%S UTC")
            else:
                last_active_str = str(student.last_active)
            context_parts.append(f"Last Active: {last_active_str}")
        else:
            context_parts.append("Last Active: Never recorded")

        # Created and updated timestamps for engagement analysis
        if hasattr(student, "created_at") and student.created_at:
            created_str = (
                student.created_at.strftime("%Y-%m-%d")
                if isinstance(student.created_at, datetime)
                else str(student.created_at)
            )
            context_parts.append(f"Account Created: {created_str}")

        if hasattr(student, "updated_at") and student.updated_at:
            updated_str = (
                student.updated_at.strftime("%Y-%m-%d")
                if isinstance(student.updated_at, datetime)
                else str(student.updated_at)
            )
            context_parts.append(f"Profile Last Updated: {updated_str}")

        # Tags - important for categorization
        if student.tags and len(student.tags) > 0:
            context_parts.append(f"Tags: {', '.join(student.tags)}")
            context_parts.append("")  # Empty line for readability

            # Provide context for important tags
            tag_explanations = []
            if "Students not contacted in 7 days" in student.tags:
                tag_explanations.append(
                    "- NOT CONTACTED: Student hasn't been reached out to in over a week"
                )
            if "High intent" in student.tags:
                tag_explanations.append(
                    "- HIGH INTENT: Student shows strong interest and engagement"
                )
            if "Needs essay help" in student.tags:
                tag_explanations.append(
                    "- ESSAY HELP: Student requires assistance with application essays"
                )

            if tag_explanations:
                context_parts.append("Tag Context:")
                context_parts.extend(tag_explanations)
        else:
            context_parts.append("Tags: None assigned")

        context_parts.append("")  # Empty line

        # Internal notes - critical for understanding staff insights
        if student.internal_notes and student.internal_notes.strip():
            context_parts.append("=== INTERNAL STAFF NOTES ===")
            context_parts.append(student.internal_notes)
            context_parts.append("")  # Empty line
        else:
            context_parts.append("=== INTERNAL STAFF NOTES ===")
            context_parts.append("No internal notes recorded")
            context_parts.append("")  # Empty line

        # Communication history - shows engagement patterns
        if communication_logs and len(communication_logs) > 0:
            context_parts.append("=== RECENT COMMUNICATION HISTORY ===")
            context_parts.append(
                f"Total communications logged: {len(communication_logs)}"
            )
            context_parts.append("")  # Empty line

            # Sort by timestamp descending (newest first) and limit to last 10
            sorted_logs = sorted(
                communication_logs,
                key=lambda x: x.timestamp if x.timestamp else datetime.min,
                reverse=True,
            )[:10]

            for i, log in enumerate(sorted_logs, 1):
                if log.timestamp:
                    timestamp = (
                        log.timestamp.strftime("%Y-%m-%d %H:%M UTC")
                        if isinstance(log.timestamp, datetime)
                        else str(log.timestamp)
                    )
                else:
                    timestamp = "Unknown time"

                comm_type = log.type or "Unknown type"
                content = log.content or "No description provided"

                context_parts.append(f"{i}. [{timestamp}] {comm_type}")
                context_parts.append(f"   Content: {content}")

                # Add spacing between entries for readability
                if i < len(sorted_logs):
                    context_parts.append("")

            # Analyze communication patterns
            context_parts.append("")  # Empty line
            context_parts.append("Communication Pattern Analysis:")

            # Count communication types
            type_counts = {}
            for log in communication_logs:
                comm_type = log.type or "Unknown"
                type_counts[comm_type] = type_counts.get(comm_type, 0) + 1

            for comm_type, count in type_counts.items():
                context_parts.append(f"- {comm_type}: {count} interactions")

            # Time-based analysis
            if communication_logs:
                latest_comm = max(
                    communication_logs,
                    key=lambda x: x.timestamp if x.timestamp else datetime.min,
                )
                if latest_comm.timestamp:
                    days_since_last = (
                        datetime.now() - latest_comm.timestamp.replace(tzinfo=None)
                    ).days
                    context_parts.append(
                        f"- Last communication: {days_since_last} days ago"
                    )
        else:
            context_parts.append("=== RECENT COMMUNICATION HISTORY ===")
            context_parts.append("No communication logs available")
            context_parts.append(
                "⚠️  This student has no recorded interactions with admissions staff"
            )

        return "\n".join(context_parts)

    def _calculate_engagement_score(
        self, student: Student, communication_logs: List[CommunicationLog] = None
    ) -> dict:
        """
        Calculate engagement metrics for more detailed analysis

        Returns:
            dict: Engagement metrics and insights
        """
        metrics = {
            "last_active_days": None,
            "communication_frequency": "Unknown",
            "response_pattern": "No data",
            "risk_level": "Medium",
        }

        try:
            # Calculate days since last active
            if student.last_active:
                last_active = (
                    student.last_active.replace(tzinfo=None)
                    if hasattr(student.last_active, "tzinfo")
                    else student.last_active
                )
                days_since_active = (datetime.now() - last_active).days
                metrics["last_active_days"] = days_since_active

                # Determine risk level based on activity
                if days_since_active <= 7:
                    metrics["risk_level"] = "Low"
                elif days_since_active <= 30:
                    metrics["risk_level"] = "Medium"
                else:
                    metrics["risk_level"] = "High"

            # Analyze communication patterns
            if communication_logs:
                comm_count = len(communication_logs)
                if comm_count >= 5:
                    metrics["communication_frequency"] = "High"
                elif comm_count >= 2:
                    metrics["communication_frequency"] = "Medium"
                else:
                    metrics["communication_frequency"] = "Low"

                # Check for recent communications
                recent_comms = [
                    log
                    for log in communication_logs
                    if log.timestamp
                    and (datetime.now() - log.timestamp.replace(tzinfo=None)).days <= 14
                ]

                if len(recent_comms) >= 2:
                    metrics["response_pattern"] = "Actively engaged"
                elif len(recent_comms) == 1:
                    metrics["response_pattern"] = "Moderately engaged"
                else:
                    metrics["response_pattern"] = "Limited recent engagement"

        except Exception as e:
            print(f"Error calculating engagement metrics: {str(e)}")

        return metrics
