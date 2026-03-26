"""add crm generate posted recipients

Revision ID: d9c2e6f4a1bc
Revises: c4f8d1a2b9e7
Create Date: 2026-03-25 19:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d9c2e6f4a1bc"
down_revision: Union[str, Sequence[str], None] = "c4f8d1a2b9e7"
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
    if not _has_column("crm_generate_posts", "posted_recipients"):
        op.add_column("crm_generate_posts", sa.Column("posted_recipients", sa.JSON(), nullable=True))


def downgrade() -> None:
    if _has_column("crm_generate_posts", "posted_recipients"):
        op.drop_column("crm_generate_posts", "posted_recipients")
