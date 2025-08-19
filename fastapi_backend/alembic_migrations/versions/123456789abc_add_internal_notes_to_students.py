"""add internal_notes to students table

Revision ID: 123456789abc
Revises: fc00fee8709d
Create Date: 2025-08-18 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "123456789abc"
down_revision = "fc00fee8709d"
branch_labels = None
depends_on = None


def upgrade():
    # Add internal_notes column to students table
    op.add_column("students", sa.Column("internal_notes", sa.Text(), nullable=True))


def downgrade():
    # Remove internal_notes column from students table
    op.drop_column("students", "internal_notes")
