"""compatibility bridge for missing revision 5f9c1a7b2d6e

Revision ID: 5f9c1a7b2d6e
Revises: e1a9c4d7f2b1
Create Date: 2026-03-18 16:15:00.000000
"""

from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = "5f9c1a7b2d6e"
down_revision: Union[str, Sequence[str], None] = "e1a9c4d7f2b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    No-op bridge revision.

    This revision restores continuity for environments stamped with
    5f9c1a7b2d6e so newer migrations can be applied.
    """
    pass


def downgrade() -> None:
    """No-op downgrade for bridge revision."""
    pass
