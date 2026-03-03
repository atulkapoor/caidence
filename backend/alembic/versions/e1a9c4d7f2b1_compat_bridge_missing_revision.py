"""compatibility bridge for missing revision e1a9c4d7f2b1

Revision ID: e1a9c4d7f2b1
Revises: c3a8f1e2d4b6
Create Date: 2026-03-02 10:05:00.000000
"""

from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = "e1a9c4d7f2b1"
down_revision: Union[str, Sequence[str], None] = "c3a8f1e2d4b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    No-op bridge revision.

    This revision restores continuity for environments stamped with
    e1a9c4d7f2b1 so newer migrations can be applied.
    """
    pass


def downgrade() -> None:
    """No-op downgrade for bridge revision."""
    pass

