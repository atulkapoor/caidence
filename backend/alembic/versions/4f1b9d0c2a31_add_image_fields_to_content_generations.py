"""add image fields to content_generations

Revision ID: 4f1b9d0c2a31
Revises: b2cee76a0915
Create Date: 2026-02-24 13:40:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "4f1b9d0c2a31"
down_revision: Union[str, Sequence[str], None] = "b2cee76a0915"
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
    if not _has_column("content_generations", "image_url"):
        with op.batch_alter_table("content_generations", schema=None) as batch_op:
            batch_op.add_column(sa.Column("image_url", sa.Text(), nullable=True))

    if not _has_column("content_generations", "brand_colors"):
        with op.batch_alter_table("content_generations", schema=None) as batch_op:
            batch_op.add_column(sa.Column("brand_colors", sa.String(), nullable=True))

    if not _has_column("content_generations", "generate_with_image"):
        with op.batch_alter_table("content_generations", schema=None) as batch_op:
            batch_op.add_column(
                sa.Column("generate_with_image", sa.Boolean(), nullable=False, server_default=sa.false())
            )
        with op.batch_alter_table("content_generations", schema=None) as batch_op:
            batch_op.alter_column("generate_with_image", server_default=None)


def downgrade() -> None:
    if _has_column("content_generations", "generate_with_image"):
        with op.batch_alter_table("content_generations", schema=None) as batch_op:
            batch_op.drop_column("generate_with_image")
    if _has_column("content_generations", "brand_colors"):
        with op.batch_alter_table("content_generations", schema=None) as batch_op:
            batch_op.drop_column("brand_colors")
    if _has_column("content_generations", "image_url"):
        with op.batch_alter_table("content_generations", schema=None) as batch_op:
            batch_op.drop_column("image_url")
