"""add brand scoping to social connections and studio assets

Revision ID: 1b2c3d4e5f6a
Revises: e7a1b6c2d9f0
Create Date: 2026-03-10 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "1b2c3d4e5f6a"
down_revision: Union[str, Sequence[str], None] = "e7a1b6c2d9f0"
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


def _has_index(table_name: str, index_name: str) -> bool:
    if not _has_table(table_name):
        return False
    insp = _inspector()
    return any(idx["name"] == index_name for idx in insp.get_indexes(table_name, schema="public"))


def upgrade() -> None:
    if _has_table("social_connections") and not _has_column("social_connections", "brand_id"):
        with op.batch_alter_table("social_connections", schema=None) as batch_op:
            batch_op.add_column(sa.Column("brand_id", sa.Integer(), nullable=True))
        op.create_foreign_key(
            "fk_social_connections_brand_id",
            "social_connections",
            "brands",
            ["brand_id"],
            ["id"],
        )
        if not _has_index("social_connections", "ix_social_connections_brand_id"):
            op.create_index("ix_social_connections_brand_id", "social_connections", ["brand_id"], unique=False)

    if _has_table("content_generations") and not _has_column("content_generations", "brand_id"):
        with op.batch_alter_table("content_generations", schema=None) as batch_op:
            batch_op.add_column(sa.Column("brand_id", sa.Integer(), nullable=True))
        op.create_foreign_key(
            "fk_content_generations_brand_id",
            "content_generations",
            "brands",
            ["brand_id"],
            ["id"],
        )
        if not _has_index("content_generations", "ix_content_generations_brand_id"):
            op.create_index("ix_content_generations_brand_id", "content_generations", ["brand_id"], unique=False)

    if _has_table("design_assets") and not _has_column("design_assets", "brand_id"):
        with op.batch_alter_table("design_assets", schema=None) as batch_op:
            batch_op.add_column(sa.Column("brand_id", sa.Integer(), nullable=True))
        op.create_foreign_key(
            "fk_design_assets_brand_id",
            "design_assets",
            "brands",
            ["brand_id"],
            ["id"],
        )
        if not _has_index("design_assets", "ix_design_assets_brand_id"):
            op.create_index("ix_design_assets_brand_id", "design_assets", ["brand_id"], unique=False)

    if _has_table("scheduled_posts") and not _has_column("scheduled_posts", "brand_id"):
        with op.batch_alter_table("scheduled_posts", schema=None) as batch_op:
            batch_op.add_column(sa.Column("brand_id", sa.Integer(), nullable=True))
        op.create_foreign_key(
            "fk_scheduled_posts_brand_id",
            "scheduled_posts",
            "brands",
            ["brand_id"],
            ["id"],
        )
        if not _has_index("scheduled_posts", "ix_scheduled_posts_brand_id"):
            op.create_index("ix_scheduled_posts_brand_id", "scheduled_posts", ["brand_id"], unique=False)


def downgrade() -> None:
    if _has_table("scheduled_posts") and _has_column("scheduled_posts", "brand_id"):
        op.drop_index("ix_scheduled_posts_brand_id", table_name="scheduled_posts")
        op.drop_constraint("fk_scheduled_posts_brand_id", "scheduled_posts", type_="foreignkey")
        with op.batch_alter_table("scheduled_posts", schema=None) as batch_op:
            batch_op.drop_column("brand_id")

    if _has_table("design_assets") and _has_column("design_assets", "brand_id"):
        op.drop_index("ix_design_assets_brand_id", table_name="design_assets")
        op.drop_constraint("fk_design_assets_brand_id", "design_assets", type_="foreignkey")
        with op.batch_alter_table("design_assets", schema=None) as batch_op:
            batch_op.drop_column("brand_id")

    if _has_table("content_generations") and _has_column("content_generations", "brand_id"):
        op.drop_index("ix_content_generations_brand_id", table_name="content_generations")
        op.drop_constraint("fk_content_generations_brand_id", "content_generations", type_="foreignkey")
        with op.batch_alter_table("content_generations", schema=None) as batch_op:
            batch_op.drop_column("brand_id")

    if _has_table("social_connections") and _has_column("social_connections", "brand_id"):
        op.drop_index("ix_social_connections_brand_id", table_name="social_connections")
        op.drop_constraint("fk_social_connections_brand_id", "social_connections", type_="foreignkey")
        with op.batch_alter_table("social_connections", schema=None) as batch_op:
            batch_op.drop_column("brand_id")
