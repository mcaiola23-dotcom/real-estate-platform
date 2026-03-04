"""baseline existing schema

Revision ID: 20260302_000001
Revises:
Create Date: 2026-03-02 00:00:01.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20260302_000001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Baseline revision for existing schema.
    New schema changes should be introduced in subsequent revisions.
    """
    pass


def downgrade() -> None:
    pass
