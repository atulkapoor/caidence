"""add crm generate posts table

Revision ID: b7e4c2d9a1f3
Revises: a1c9e3f7b2d4
Create Date: 2026-03-25 13:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b7e4c2d9a1f3"
down_revision: Union[str, Sequence[str], None] = "a1c9e3f7b2d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "crm_generate_posts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False, server_default=sa.text("'New Post'")),
        sa.Column("platform", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("image_name", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_crm_generate_posts_id"), "crm_generate_posts", ["id"], unique=False)
    op.create_index(op.f("ix_crm_generate_posts_platform"), "crm_generate_posts", ["platform"], unique=False)
    op.create_index(op.f("ix_crm_generate_posts_user_id"), "crm_generate_posts", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_crm_generate_posts_user_id"), table_name="crm_generate_posts")
    op.drop_index(op.f("ix_crm_generate_posts_platform"), table_name="crm_generate_posts")
    op.drop_index(op.f("ix_crm_generate_posts_id"), table_name="crm_generate_posts")
    op.drop_table("crm_generate_posts")
