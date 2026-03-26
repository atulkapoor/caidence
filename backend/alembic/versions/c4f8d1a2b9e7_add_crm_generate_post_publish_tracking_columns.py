"""add crm generate post publish tracking columns

Revision ID: c4f8d1a2b9e7
Revises: b7e4c2d9a1f3
Create Date: 2026-03-25 18:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c4f8d1a2b9e7"
down_revision: Union[str, Sequence[str], None] = "b7e4c2d9a1f3"
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
    if not _has_column("crm_generate_posts", "is_posted"):
        op.add_column(
            "crm_generate_posts",
            sa.Column("is_posted", sa.Boolean(), nullable=False, server_default=sa.false()),
        )
        op.alter_column("crm_generate_posts", "is_posted", server_default=None)

    if not _has_column("crm_generate_posts", "posted_at"):
        op.add_column("crm_generate_posts", sa.Column("posted_at", sa.DateTime(timezone=True), nullable=True))

    if not _has_column("crm_generate_posts", "posted_target_name"):
        op.add_column("crm_generate_posts", sa.Column("posted_target_name", sa.String(), nullable=True))


def downgrade() -> None:
    if _has_column("crm_generate_posts", "posted_target_name"):
        op.drop_column("crm_generate_posts", "posted_target_name")

    if _has_column("crm_generate_posts", "posted_at"):
        op.drop_column("crm_generate_posts", "posted_at")

    if _has_column("crm_generate_posts", "is_posted"):
        op.drop_column("crm_generate_posts", "is_posted")
