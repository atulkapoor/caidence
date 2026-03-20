"""add whatsapp fields to scheduled_posts

Revision ID: d7f4a2b9c1e3
Revises: c9b2e5f8a1d4
Create Date: 2026-03-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d7f4a2b9c1e3"
down_revision: Union[str, Sequence[str], None] = "c9b2e5f8a1d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _inspector():
    return sa.inspect(op.get_bind())


def _has_table(table_name: str) -> bool:
    return table_name in _inspector().get_table_names()


def _has_column(table_name: str, column_name: str) -> bool:
    if not _has_table(table_name):
        return False
    return any(col["name"] == column_name for col in _inspector().get_columns(table_name))


def upgrade() -> None:
    """Upgrade schema."""
    if _has_table("scheduled_posts") and not _has_column("scheduled_posts", "to_numbers"):
        op.add_column("scheduled_posts", sa.Column("to_numbers", sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    if _has_table("scheduled_posts") and _has_column("scheduled_posts", "to_numbers"):
        op.drop_column("scheduled_posts", "to_numbers")
