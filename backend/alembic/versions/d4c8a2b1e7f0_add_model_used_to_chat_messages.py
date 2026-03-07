"""add model_used to chat_messages

Revision ID: d4c8a2b1e7f0
Revises: 9a7c2d1e4f55
Create Date: 2026-03-05 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d4c8a2b1e7f0"
down_revision: Union[str, Sequence[str], None] = "9a7c2d1e4f55"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(table_name: str, column_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    try:
        columns = inspector.get_columns(table_name)
    except Exception:
        return False
    return any(col.get("name") == column_name for col in columns)


def upgrade() -> None:
    if not _has_column("chat_messages", "model_used"):
        op.add_column("chat_messages", sa.Column("model_used", sa.String(), nullable=True))


def downgrade() -> None:
    if _has_column("chat_messages", "model_used"):
        op.drop_column("chat_messages", "model_used")
