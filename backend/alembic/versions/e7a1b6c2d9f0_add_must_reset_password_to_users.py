"""add must_reset_password to users

Revision ID: e7a1b6c2d9f0
Revises: c9b2e5f8a1d4
Create Date: 2026-03-07 00:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e7a1b6c2d9f0"
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
    if not _has_column("users", "must_reset_password"):
        op.add_column(
            "users",
            sa.Column("must_reset_password", sa.Boolean(), nullable=False, server_default=sa.false()),
        )
        op.alter_column("users", "must_reset_password", server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    if _has_column("users", "must_reset_password"):
        op.drop_column("users", "must_reset_password")
