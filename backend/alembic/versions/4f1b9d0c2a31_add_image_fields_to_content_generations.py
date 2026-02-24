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


def upgrade() -> None:
    with op.batch_alter_table("content_generations", schema=None) as batch_op:
        batch_op.add_column(sa.Column("image_url", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("brand_colors", sa.String(), nullable=True))
        batch_op.add_column(
            sa.Column("generate_with_image", sa.Boolean(), nullable=False, server_default=sa.false())
        )
    with op.batch_alter_table("content_generations", schema=None) as batch_op:
        batch_op.alter_column("generate_with_image", server_default=None)


def downgrade() -> None:
    with op.batch_alter_table("content_generations", schema=None) as batch_op:
        batch_op.drop_column("generate_with_image")
        batch_op.drop_column("brand_colors")
        batch_op.drop_column("image_url")
