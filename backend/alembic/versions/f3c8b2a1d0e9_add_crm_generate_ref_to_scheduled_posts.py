"""add crm generate ref to scheduled posts

Revision ID: f3c8b2a1d0e9
Revises: e1a7c3d8f5b2
Create Date: 2026-03-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f3c8b2a1d0e9"
down_revision: Union[str, Sequence[str], None] = "e1a7c3d8f5b2"
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


def _has_fk(table_name: str, fk_name: str) -> bool:
    if not _has_table(table_name):
        return False
    insp = _inspector()
    return any(fk["name"] == fk_name for fk in insp.get_foreign_keys(table_name, schema="public"))


def upgrade() -> None:
    if not _has_table("scheduled_posts"):
        return
    if not _has_column("scheduled_posts", "crm_generate_post_id"):
        op.add_column("scheduled_posts", sa.Column("crm_generate_post_id", sa.Integer(), nullable=True))
        op.create_foreign_key(
            "fk_scheduled_posts_crm_generate_post_id",
            "scheduled_posts",
            "crm_generate_posts",
            ["crm_generate_post_id"],
            ["id"],
        )
        op.create_index(
            "ix_scheduled_posts_crm_generate_post_id",
            "scheduled_posts",
            ["crm_generate_post_id"],
        )


def downgrade() -> None:
    if not _has_table("scheduled_posts"):
        return
    if _has_column("scheduled_posts", "crm_generate_post_id"):
        if _has_fk("scheduled_posts", "fk_scheduled_posts_crm_generate_post_id"):
            op.drop_constraint(
                "fk_scheduled_posts_crm_generate_post_id",
                "scheduled_posts",
                type_="foreignkey",
            )
        op.drop_index("ix_scheduled_posts_crm_generate_post_id", table_name="scheduled_posts")
        op.drop_column("scheduled_posts", "crm_generate_post_id")
