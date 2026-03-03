"""add design post tracking and scheduled design reference

Revision ID: 9a7c2d1e4f55
Revises: f1d3b9c6a2e1
Create Date: 2026-03-02 15:45:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9a7c2d1e4f55"
down_revision: Union[str, Sequence[str], None] = "f1d3b9c6a2e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _inspector():
    return sa.inspect(op.get_bind())


def _has_table(table_name: str) -> bool:
    return table_name in _inspector().get_table_names(schema="public")


def _has_column(table_name: str, column_name: str) -> bool:
    if not _has_table(table_name):
        return False
    return any(col["name"] == column_name for col in _inspector().get_columns(table_name, schema="public"))


def _has_index(table_name: str, index_name: str) -> bool:
    if not _has_table(table_name):
        return False
    return any(idx["name"] == index_name for idx in _inspector().get_indexes(table_name, schema="public"))


def upgrade() -> None:
    if not _has_column("design_assets", "is_posted"):
        op.add_column("design_assets", sa.Column("is_posted", sa.Boolean(), nullable=False, server_default=sa.false()))
        op.alter_column("design_assets", "is_posted", server_default=None)
    if not _has_column("design_assets", "posted_at"):
        op.add_column("design_assets", sa.Column("posted_at", sa.DateTime(timezone=True), nullable=True))
    if not _has_column("design_assets", "posted_target_name"):
        op.add_column("design_assets", sa.Column("posted_target_name", sa.String(), nullable=True))

    if not _has_column("scheduled_posts", "design_asset_id"):
        op.add_column("scheduled_posts", sa.Column("design_asset_id", sa.Integer(), nullable=True))
        op.create_foreign_key(
            "fk_scheduled_posts_design_asset_id_design_assets",
            "scheduled_posts",
            "design_assets",
            ["design_asset_id"],
            ["id"],
        )
    if not _has_index("scheduled_posts", "ix_scheduled_posts_design_asset_id"):
        op.create_index("ix_scheduled_posts_design_asset_id", "scheduled_posts", ["design_asset_id"], unique=False)


def downgrade() -> None:
    if _has_index("scheduled_posts", "ix_scheduled_posts_design_asset_id"):
        op.drop_index("ix_scheduled_posts_design_asset_id", table_name="scheduled_posts")
    if _has_column("scheduled_posts", "design_asset_id"):
        op.drop_constraint("fk_scheduled_posts_design_asset_id_design_assets", "scheduled_posts", type_="foreignkey")
        op.drop_column("scheduled_posts", "design_asset_id")

    if _has_column("design_assets", "posted_target_name"):
        op.drop_column("design_assets", "posted_target_name")
    if _has_column("design_assets", "posted_at"):
        op.drop_column("design_assets", "posted_at")
    if _has_column("design_assets", "is_posted"):
        op.drop_column("design_assets", "is_posted")
