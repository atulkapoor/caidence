"""backfill created_by_role for super admin brands

Revision ID: 3d6a1b2c9f0e
Revises: 2f7a9c1d8e4b
Create Date: 2026-03-12 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "3d6a1b2c9f0e"
down_revision: Union[str, Sequence[str], None] = "2f7a9c1d8e4b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            UPDATE brands
            SET created_by_role = 'super_admin'
            WHERE created_by_role IS NULL
              AND (name ILIKE 'myntra' OR name ILIKE 'zara');
            """
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            UPDATE brands
            SET created_by_role = NULL
            WHERE created_by_role = 'super_admin'
              AND (name ILIKE 'myntra' OR name ILIKE 'zara');
            """
        )
    )
