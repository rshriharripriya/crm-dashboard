"""add communication_logs table

Revision ID: 987654321def
Revises: 123456789abc
Create Date: 2025-08-18 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "987654321def"
down_revision = "123456789abc"
branch_labels = None
depends_on = None


def upgrade():
    # Create communication_logs table
    op.create_table(
        "communication_logs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("student_id", sa.UUID(), nullable=False),
        sa.Column("type", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["student_id"],
            ["students.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    # Drop communication_logs table
    op.drop_table("communication_logs")
