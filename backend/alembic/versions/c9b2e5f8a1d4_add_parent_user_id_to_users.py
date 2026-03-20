"""add parent_user_id to users

Revision ID: c9b2e5f8a1d4
Revises: d4c8a2b1e7f0
Create Date: 2026-03-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c9b2e5f8a1d4"
down_revision: Union[str, Sequence[str], None] = "d4c8a2b1e7f0"
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


def _has_index(table_name: str, index_name: str) -> bool:
    if not _has_table(table_name):
        return False
    return any(idx["name"] == index_name for idx in _inspector().get_indexes(table_name))


def _has_fk(table_name: str, fk_name: str) -> bool:
    if not _has_table(table_name):
        return False
    return any(fk.get("name") == fk_name for fk in _inspector().get_foreign_keys(table_name))


def upgrade() -> None:
    """Upgrade schema."""
    if not _has_column("users", "parent_user_id"):
        op.add_column("users", sa.Column("parent_user_id", sa.Integer(), nullable=True))

    if _has_column("users", "parent_user_id") and not _has_fk("users", "fk_users_parent_user_id_users"):
        with op.batch_alter_table("users") as batch_op:
            try:
                batch_op.create_foreign_key(
                    "fk_users_parent_user_id_users",
                    "users",
                    ["parent_user_id"],
                    ["id"],
                )
            except Exception:
                pass

    if not _has_index("users", "ix_users_parent_user_id"):
        op.create_index("ix_users_parent_user_id", "users", ["parent_user_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    if _has_index("users", "ix_users_parent_user_id"):
        op.drop_index("ix_users_parent_user_id", table_name="users")

    if _has_column("users", "parent_user_id"):
        with op.batch_alter_table("users") as batch_op:
            try:
                batch_op.drop_constraint("fk_users_parent_user_id_users", type_="foreignkey")
            except Exception:
                pass
        op.drop_column("users", "parent_user_id")
