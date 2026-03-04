"""
Utility script to report current parcel and listing counts in the database.

Usage:
    python backend/scripts/check_db_counts.py
"""

from pathlib import Path
import sys

# Ensure backend package is on path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.db import SessionLocal  # type: ignore  # pylint: disable=import-error
from app.models.parcel import Parcel  # type: ignore  # pylint: disable=import-error
from app.models.listing import Listing  # type: ignore  # pylint: disable=import-error


def main() -> None:
    session = SessionLocal()
    try:
        parcel_count = session.query(Parcel).count()
        listing_count = session.query(Listing).count()
        print(f"Parcel count: {parcel_count}")
        print(f"Listing count: {listing_count}")
    finally:
        session.close()


if __name__ == "__main__":
    main()










