"""add crm categories and creator mapping

Revision ID: a1c9e3f7b2d4
Revises: 7d893633ed4d
Create Date: 2026-03-25 11:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1c9e3f7b2d4"
down_revision: Union[str, Sequence[str], None] = "7d893633ed4d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "crm_categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_by_role", sa.String(), nullable=True),
        sa.Column("brand_ids", sa.JSON(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_crm_categories_id"), "crm_categories", ["id"], unique=False)
    op.create_index(op.f("ix_crm_categories_name"), "crm_categories", ["name"], unique=False)
    op.create_index(op.f("ix_crm_categories_user_id"), "crm_categories", ["user_id"], unique=False)
    op.create_index(op.f("ix_crm_categories_created_by_role"), "crm_categories", ["created_by_role"], unique=False)

    op.create_table(
        "creator_categories",
        sa.Column("creator_id", sa.Integer(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["crm_categories.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["creator_id"], ["creators.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("creator_id", "category_id"),
    )


def downgrade() -> None:
    op.drop_table("creator_categories")
    op.drop_index(op.f("ix_crm_categories_created_by_role"), table_name="crm_categories")
    op.drop_index(op.f("ix_crm_categories_user_id"), table_name="crm_categories")
    op.drop_index(op.f("ix_crm_categories_name"), table_name="crm_categories")
    op.drop_index(op.f("ix_crm_categories_id"), table_name="crm_categories")
    op.drop_table("crm_categories")
