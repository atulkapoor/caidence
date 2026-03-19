"""merge heads

Revision ID: 7d893633ed4d
Revises: 7c4f1a2b9d01, d7f4a2b9c1e3
Create Date: 2026-03-19 16:02:56.360433

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7d893633ed4d'
down_revision: Union[str, Sequence[str], None] = ('7c4f1a2b9d01', 'd7f4a2b9c1e3')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
