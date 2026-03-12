"""add created_by fields to brands

Revision ID: 2f7a9c1d8e4b
Revises: 1b2c3d4e5f6a
Create Date: 2026-03-12 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2f7a9c1d8e4b"
down_revision: Union[str, Sequence[str], None] = "1b2c3d4e5f6a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _inspector():
    return sa.inspect(op.get_bind())


def _has_table(table_name: str) -> bool:
    insp = _inspector()
    return table_name in insp.get_table_names(schema="public")


def _has_column(table_name: str, column_name: str) -> bool:
    if not _has_table(table_name):
        return False
    insp = _inspector()
    return any(col["name"] == column_name for col in insp.get_columns(table_name, schema="public"))


def upgrade() -> None:
    """Upgrade schema."""
    if _has_table("brands") and not _has_column("brands", "created_by_user_id"):
        op.add_column("brands", sa.Column("created_by_user_id", sa.Integer(), nullable=True))
        op.create_foreign_key(
            "fk_brands_created_by_user_id_users",
            "brands",
            "users",
            ["created_by_user_id"],
            ["id"],
        )
        op.create_index("ix_brands_created_by_user_id", "brands", ["created_by_user_id"], unique=False)

    if _has_table("brands") and not _has_column("brands", "created_by_role"):
        op.add_column("brands", sa.Column("created_by_role", sa.String(), nullable=True))
        op.create_index("ix_brands_created_by_role", "brands", ["created_by_role"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    if _has_table("brands") and _has_column("brands", "created_by_role"):
        op.drop_index("ix_brands_created_by_role", table_name="brands")
        op.drop_column("brands", "created_by_role")

    if _has_table("brands") and _has_column("brands", "created_by_user_id"):
        op.drop_index("ix_brands_created_by_user_id", table_name="brands")
        op.drop_constraint("fk_brands_created_by_user_id_users", "brands", type_="foreignkey")
        op.drop_column("brands", "created_by_user_id")
