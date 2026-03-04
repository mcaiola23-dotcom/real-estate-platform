"""add search alert constraints and updated timestamp

Revision ID: 20260302_000002
Revises: 20260302_000001
Create Date: 2026-03-02 00:00:02.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20260302_000002"
down_revision: Union[str, None] = "20260302_000001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "search_alerts" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("search_alerts")}
    if "updated_at" not in columns:
        op.add_column(
            "search_alerts",
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        )

    indexes = {index["name"] for index in inspector.get_indexes("search_alerts")}
    if "idx_search_alerts_user_saved_search" not in indexes:
        op.create_index(
            "idx_search_alerts_user_saved_search",
            "search_alerts",
            ["user_id", "saved_search_id"],
            unique=True,
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "search_alerts" not in inspector.get_table_names():
        return

    indexes = {index["name"] for index in inspector.get_indexes("search_alerts")}
    if "idx_search_alerts_user_saved_search" in indexes:
        op.drop_index("idx_search_alerts_user_saved_search", table_name="search_alerts")

    columns = {column["name"] for column in inspector.get_columns("search_alerts")}
    if "updated_at" in columns:
        op.drop_column("search_alerts", "updated_at")
