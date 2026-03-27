"""add brand id to crm generate posts

Revision ID: e1a7c3d8f5b2
Revises: d9c2e6f4a1bc
Create Date: 2026-03-25 20:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e1a7c3d8f5b2"
down_revision: Union[str, Sequence[str], None] = "d9c2e6f4a1bc"
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
    if not _has_column("crm_generate_posts", "brand_id"):
        op.add_column("crm_generate_posts", sa.Column("brand_id", sa.Integer(), nullable=True))
        op.create_foreign_key(
            "fk_crm_generate_posts_brand_id_brands",
            "crm_generate_posts",
            "brands",
            ["brand_id"],
            ["id"],
        )
        op.create_index("ix_crm_generate_posts_brand_id", "crm_generate_posts", ["brand_id"], unique=False)


def downgrade() -> None:
    if _has_column("crm_generate_posts", "brand_id"):
        op.drop_index("ix_crm_generate_posts_brand_id", table_name="crm_generate_posts")
        op.drop_constraint("fk_crm_generate_posts_brand_id_brands", "crm_generate_posts", type_="foreignkey")
        op.drop_column("crm_generate_posts", "brand_id")
