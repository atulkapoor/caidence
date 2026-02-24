"""vscode auto schema sync 20260224_065017

Revision ID: b2cee76a0915
Revises: c3a8f1e2d4b6
Create Date: 2026-02-24 12:20:18.272086

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2cee76a0915'
down_revision: Union[str, Sequence[str], None] = 'c3a8f1e2d4b6'
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
    if not _has_table("social_accounts"):
        op.create_table(
            "social_accounts",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=True),
            sa.Column(
                "platform",
                sa.Enum("linkedin", "instagram", "facebook", "twitter", name="social_platform"),
                nullable=False,
            ),
            sa.Column("client_id", sa.String(), nullable=False),
            sa.Column("client_secret", sa.Text(), nullable=False),
            sa.Column("access_token", sa.Text(), nullable=True),
            sa.Column("expires_at", sa.DateTime(), nullable=True),
            sa.Column("account_id", sa.String(), nullable=True),
            sa.Column("account_name", sa.String(), nullable=True),
            sa.Column("account_email", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    op.execute("CREATE INDEX IF NOT EXISTS ix_social_accounts_id ON social_accounts (id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_social_accounts_platform ON social_accounts (platform)")

    if not _has_column("content_generations", "is_posted"):
        op.add_column(
            "content_generations",
            sa.Column("is_posted", sa.Boolean(), nullable=False, server_default=sa.false()),
        )
        op.alter_column("content_generations", "is_posted", server_default=None)
    if not _has_column("content_generations", "posted_at"):
        op.add_column("content_generations", sa.Column("posted_at", sa.DateTime(timezone=True), nullable=True))
    if not _has_column("content_generations", "posted_target_name"):
        op.add_column("content_generations", sa.Column("posted_target_name", sa.String(), nullable=True))

    if _has_column("creators", "is_blacklisted"):
        op.drop_column("creators", "is_blacklisted")
    if _has_column("creators", "is_verified"):
        op.drop_column("creators", "is_verified")


def downgrade() -> None:
    """Downgrade schema."""
    if not _has_column("creators", "is_verified"):
        op.add_column("creators", sa.Column("is_verified", sa.BOOLEAN(), autoincrement=False, nullable=True))
    if not _has_column("creators", "is_blacklisted"):
        op.add_column("creators", sa.Column("is_blacklisted", sa.BOOLEAN(), autoincrement=False, nullable=True))

    if _has_column("content_generations", "posted_target_name"):
        op.drop_column("content_generations", "posted_target_name")
    if _has_column("content_generations", "posted_at"):
        op.drop_column("content_generations", "posted_at")
    if _has_column("content_generations", "is_posted"):
        op.drop_column("content_generations", "is_posted")

    op.execute("DROP INDEX IF EXISTS ix_social_accounts_platform")
    op.execute("DROP INDEX IF EXISTS ix_social_accounts_id")
    if _has_table("social_accounts"):
        op.drop_table("social_accounts")
