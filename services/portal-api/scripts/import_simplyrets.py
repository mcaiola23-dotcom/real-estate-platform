"""
Script to import listings from SimplyRETS API and match them to parcels.

Usage:
    python scripts/import_simplyrets.py [--limit N] [--offset N] [--match-only]
"""

import sys
import asyncio
import argparse
import logging
from datetime import datetime
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db import SessionLocal
from app.services.mls_import import import_listings, get_last_successful_import
from app.models.import_audit import ImportAudit

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def _parse_since(value: str):
    try:
        return datetime.fromisoformat(value)
    except Exception:
        raise ValueError("Invalid --since format. Use ISO 8601, e.g. 2026-01-16T00:00:00")


async def main():
    parser = argparse.ArgumentParser(description="Import SimplyRETS listings and match to parcels")
    parser.add_argument(
        "--limit",
        type=int,
        default=50,
        help="Maximum number of listings to fetch (default: 50)"
    )
    parser.add_argument(
        "--offset",
        type=int,
        default=0,
        help="Number of listings to skip (default: 0)"
    )
    parser.add_argument(
        "--match-only",
        action="store_true",
        help="Only match existing listings; don't fetch new ones"
    )
    parser.add_argument(
        "--since",
        type=str,
        default=None,
        help="Only update listings modified since this ISO timestamp (delta mode)."
    )
    parser.add_argument(
        "--run-type",
        choices=["full", "delta", "match-only"],
        default=None,
        help="Override run type for audit logging."
    )
    
    args = parser.parse_args()
    
    db = SessionLocal()
    try:
        ImportAudit.__table__.create(bind=db.bind, checkfirst=True)
        since = _parse_since(args.since) if args.since else None
        run_type = args.run_type
        if args.match_only:
            run_type = "match-only"
        elif not run_type:
            run_type = "delta" if since else "full"

        if run_type == "delta" and since is None:
            last_success = get_last_successful_import(db)
            since = last_success.completed_at if last_success else None
            if since:
                logger.info("Delta mode: using last successful import time %s", since.isoformat())
            else:
                logger.info("Delta mode: no prior successful import found; running as full import")

        stats = await import_listings(
            db,
            limit=args.limit,
            offset=args.offset,
            match_only=(run_type == "match-only"),
            since=since,
            run_type=run_type
        )
        
        print("\n" + "="*60)
        print("IMPORT SUMMARY")
        print("="*60)
        print(f"Listings fetched: {stats['fetched']}")
        print(f"Listings imported: {stats['imported']}")
        print(f"Listings updated: {stats['updated']}")
        print(f"Listings matched: {stats['matched']}")
        print(f"Listings skipped: {stats['skipped']}")
        print(f"Errors: {stats['errors']}")
        print(f"Run type: {run_type}")
        print(f"Since: {since.isoformat() if since else 'N/A'}")
        print("="*60)
        
    except Exception as e:
        logger.error(f"Import failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
