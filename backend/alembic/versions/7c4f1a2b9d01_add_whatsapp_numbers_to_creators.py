"""add whatsapp_numbers to creators

Revision ID: 7c4f1a2b9d01
Revises: 3d6a1b2c9f0e
Create Date: 2026-03-18 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7c4f1a2b9d01"
down_revision: Union[str, Sequence[str], None] = "3d6a1b2c9f0e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("creators", sa.Column("whatsapp_numbers", sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("creators", "whatsapp_numbers")
