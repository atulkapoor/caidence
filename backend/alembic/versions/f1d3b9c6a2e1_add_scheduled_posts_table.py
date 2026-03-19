"""add scheduled_posts table

Revision ID: f1d3b9c6a2e1
Revises: 4f1b9d0c2a31
Create Date: 2026-03-02 12:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f1d3b9c6a2e1"
down_revision: Union[str, Sequence[str], None] = "4f1b9d0c2a31"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    insp = sa.inspect(op.get_bind())
    if "scheduled_posts" in insp.get_table_names(schema="public"):
        return

    op.create_table(
        "scheduled_posts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("content_id", sa.Integer(), nullable=True),
        sa.Column("campaign_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column("platform", sa.String(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="scheduled"),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("post_id", sa.String(), nullable=True),
        sa.Column("target_name", sa.String(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"]),
        sa.ForeignKeyConstraint(["content_id"], ["content_generations.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("scheduled_posts", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_scheduled_posts_id"), ["id"], unique=False)
        batch_op.create_index(batch_op.f("ix_scheduled_posts_user_id"), ["user_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_scheduled_posts_content_id"), ["content_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_scheduled_posts_campaign_id"), ["campaign_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_scheduled_posts_platform"), ["platform"], unique=False)
        batch_op.create_index(batch_op.f("ix_scheduled_posts_status"), ["status"], unique=False)
        batch_op.create_index(batch_op.f("ix_scheduled_posts_scheduled_at"), ["scheduled_at"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("scheduled_posts", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_scheduled_posts_scheduled_at"))
        batch_op.drop_index(batch_op.f("ix_scheduled_posts_status"))
        batch_op.drop_index(batch_op.f("ix_scheduled_posts_platform"))
        batch_op.drop_index(batch_op.f("ix_scheduled_posts_campaign_id"))
        batch_op.drop_index(batch_op.f("ix_scheduled_posts_content_id"))
        batch_op.drop_index(batch_op.f("ix_scheduled_posts_user_id"))
        batch_op.drop_index(batch_op.f("ix_scheduled_posts_id"))

    op.drop_table("scheduled_posts")
