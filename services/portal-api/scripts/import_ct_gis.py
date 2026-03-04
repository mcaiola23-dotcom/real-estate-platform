"""
CLI script to import CT GIS parcel data from GeoJSON files.
"""

import sys
import argparse
import logging
from pathlib import Path
from typing import Optional, Tuple

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db import SessionLocal
from app.services.gis_import import GISImportService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def import_single_file(
    file_path: Path,
    town_name: Optional[str] = None,
    batch_size: int = 1000,
    dry_run: bool = False
) -> dict:
    """Import a single GeoJSON file."""
    db = SessionLocal()
    try:
        service = GISImportService(db)
        stats = service.import_geojson_file(
            file_path=file_path,
            town_name=town_name,
            batch_size=batch_size,
            dry_run=dry_run
        )
        return stats
    finally:
        db.close()


def get_imported_towns(db) -> set:
    """Get set of town names that already have parcels in the database."""
    try:
        from sqlalchemy import text
        result = db.execute(text("SELECT DISTINCT town_name FROM parcels;"))
        return {row[0] for row in result.fetchall()}
    except Exception as e:
        logger.warning(f"Could not check imported towns: {e}")
        return set()


def get_parcel_count_by_town(db, town_name: str) -> int:
    """Get count of parcels for a specific town."""
    try:
        from sqlalchemy import text
        result = db.execute(
            text("SELECT COUNT(*) FROM parcels WHERE town_name = :town_name;"),
            {"town_name": town_name}
        )
        return result.fetchone()[0]
    except Exception as e:
        logger.warning(f"Could not get parcel count for {town_name}: {e}")
        return 0


def verify_import_completeness(
    db,
    file_path: Path,
    expected_count: int,
    town_name: str,
    tolerance: float = 0.95
) -> Tuple[bool, int]:
    """
    Verify that import was complete.
    
    Args:
        db: Database session
        file_path: Path to GeoJSON file
        expected_count: Expected number of parcels from file
        town_name: Town name
        tolerance: Tolerance for completeness (default 95%)
        
    Returns:
        Tuple of (is_complete, actual_count)
    """
    actual_count = get_parcel_count_by_town(db, town_name)
    
    if expected_count == 0:
        return True, actual_count
    
    completeness_ratio = actual_count / expected_count if expected_count > 0 else 0
    
    if completeness_ratio >= tolerance:
        print(f"[COMPLETE] {town_name}: Import complete ({actual_count:,}/{expected_count:,} = {completeness_ratio:.1%})")
        logger.info(f"✅ {town_name}: Import complete ({actual_count:,}/{expected_count:,} = {completeness_ratio:.1%})")
        return True, actual_count
    else:
        print(f"[INCOMPLETE] {town_name}: Import incomplete ({actual_count:,}/{expected_count:,} = {completeness_ratio:.1%}). Expected at least {tolerance:.0%} completeness.")
        logger.warning(
            f"⚠️  {town_name}: Import incomplete ({actual_count:,}/{expected_count:,} = {completeness_ratio:.1%}). "
            f"Expected at least {tolerance:.0%} completeness."
        )
        return False, actual_count


def import_all_towns(
    data_directory: Path,
    batch_size: int = 500,  # Reduced batch size to prevent timeouts
    dry_run: bool = False,
    skip_imported: bool = True
) -> dict:
    """Import all GeoJSON files from the data directory."""
    if not data_directory.exists():
        raise FileNotFoundError(f"Data directory not found: {data_directory}")
    
    geojson_files = list(data_directory.glob("*.geojson"))
    
    if not geojson_files:
        raise ValueError(f"No GeoJSON files found in {data_directory}")
    
    print(f"Found {len(geojson_files)} GeoJSON files to import")
    logger.info(f"Found {len(geojson_files)} GeoJSON files to import")
    
    # Check which towns are already imported
    imported_towns = set()
    if skip_imported and not dry_run:
        print("Checking which towns are already imported...")
        try:
            db = SessionLocal()
            imported_towns = get_imported_towns(db)
            if imported_towns:
                print(f"Towns already imported: {', '.join(sorted(imported_towns))}")
                print("Skipping already-imported towns. Use --force to re-import.")
            db.close()
        except Exception as e:
            print(f"Warning: Could not check imported towns: {e}")
            print("Proceeding with import anyway...")
    
    total_stats = {
        'files_processed': 0,
        'files_skipped': 0,
        'total_parcels': 0,
        'total_imported': 0,
        'total_skipped': 0,
        'total_errors': 0,
        'town_stats': {}
    }
    
    for file_path in sorted(geojson_files):
        # Extract town name and normalize (handle "New_Canaan" -> "New Canaan")
        town_name = file_path.stem.replace('_parcels', '').replace('_', ' ').title()
        
        # Skip if already imported
        if skip_imported and town_name in imported_towns and not dry_run:
            print(f"[SKIP] Skipping {file_path.name} - {town_name} already imported")
            logger.info(f"⏭️  Skipping {file_path.name} - {town_name} already imported")
            total_stats['files_skipped'] += 1
            continue
        
        print(f"\n{'='*80}")
        print(f"Processing: {file_path.name} ({town_name})")
        print(f"{'='*80}")
        logger.info(f"\n{'='*80}")
        logger.info(f"Processing: {file_path.name} ({town_name})")
        logger.info(f"{'='*80}")
        
        db = SessionLocal()
        try:
            stats = import_single_file(
                file_path=file_path,
                batch_size=batch_size,
                dry_run=dry_run
            )
            
            # Verify completeness
            if not dry_run:
                is_complete, actual_count = verify_import_completeness(
                    db, file_path, stats['total'], town_name, tolerance=0.95
                )
                if not is_complete:
                    print(f"[WARNING] {town_name} import may be incomplete. Expected {stats['total']:,} parcels, found {actual_count:,} in database. Consider re-importing with --force flag.")
                    logger.warning(
                        f"⚠️  {town_name} import may be incomplete. "
                        f"Expected {stats['total']:,} parcels, found {actual_count:,} in database. "
                        f"Consider re-importing with --force flag."
                    )
            
            total_stats['files_processed'] += 1
            total_stats['total_parcels'] += stats['total']
            total_stats['total_imported'] += stats['imported']
            total_stats['total_skipped'] += stats['skipped']
            total_stats['total_errors'] += stats['errors']
            total_stats['town_stats'][town_name] = stats
            
            print(f"[OK] {town_name}: {stats['imported']}/{stats['total']} parcels imported")
            logger.info(f"✅ {town_name}: {stats['imported']}/{stats['total']} parcels imported")
            if stats['errors'] > 0:
                print(f"[WARNING] {town_name}: {stats['errors']} errors")
                logger.warning(f"⚠️  {town_name}: {stats['errors']} errors")
                
        except Exception as e:
            print(f"[ERROR] Error processing {file_path.name}: {e}")
            logger.error(f"❌ Error processing {file_path.name}: {e}")
            import traceback
            print(traceback.format_exc())
            logger.error(traceback.format_exc())
            total_stats['total_errors'] += 1
        finally:
            db.close()
    
    return total_stats


def print_summary(stats: dict) -> None:
    """Print import summary."""
    print("\n" + "="*80)
    print("IMPORT SUMMARY")
    print("="*80)
    print(f"Files processed: {stats['files_processed']}")
    if stats.get('files_skipped', 0) > 0:
        print(f"Files skipped (already imported): {stats['files_skipped']}")
    print(f"Total parcels: {stats['total_parcels']}")
    print(f"Total imported: {stats['total_imported']}")
    print(f"Total skipped: {stats['total_skipped']}")
    print(f"Total errors: {stats['total_errors']}")
    
    if stats['town_stats']:
        print("\nTown-by-town breakdown:")
        for town, town_stats in sorted(stats['town_stats'].items()):
            print(f"  {town:20s} - {town_stats['imported']:6d}/{town_stats['total']:6d} imported "
                  f"({town_stats['errors']:3d} errors)")


def main():
    """Main CLI entry point."""
    print("="*80)
    print("CT GIS PARCEL IMPORT SCRIPT")
    print("="*80)
    print("Starting import process...\n")
    
    parser = argparse.ArgumentParser(
        description="Import CT GIS parcel data from GeoJSON files"
    )
    parser.add_argument(
        '--file',
        type=Path,
        help='Path to single GeoJSON file to import'
    )
    parser.add_argument(
        '--directory',
        type=Path,
        default=Path(r'C:\Users\19143\Projects\fairfield-realestate\backend\data\chunks'),
        help='Directory containing GeoJSON files (default: CT GIS data directory)'
    )
    parser.add_argument(
        '--town',
        type=str,
        help='Town name override (if not provided, extracted from filename)'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=500,
        help='Number of parcels to process per batch (default: 500)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Validate data but do not import (dry run mode)'
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Re-import towns that are already in the database'
    )
    
    args = parser.parse_args()
    
    if args.dry_run:
        print("[DRY RUN] DRY RUN MODE - No data will be imported")
        logger.info("🔍 DRY RUN MODE - No data will be imported")
    
    try:
        if args.file:
            # Import single file
            print(f"Importing single file: {args.file}")
            logger.info(f"Importing single file: {args.file}")
            stats = import_single_file(
                file_path=args.file,
                town_name=args.town,
                batch_size=args.batch_size,
                dry_run=args.dry_run
            )
            print_summary({'files_processed': 1, 'total_parcels': stats['total'], 
                         'total_imported': stats['imported'], 'total_skipped': stats['skipped'],
                         'total_errors': stats['errors'], 'town_stats': {}})
        else:
            # Import all files from directory
            print(f"Importing all files from: {args.directory}")
            logger.info(f"Importing all files from: {args.directory}")
            stats = import_all_towns(
                data_directory=args.directory,
                batch_size=args.batch_size,
                dry_run=args.dry_run,
                skip_imported=not args.force
            )
            print_summary(stats)
            
    except KeyboardInterrupt:
        print("\n[INTERRUPTED] Import interrupted by user")
        logger.info("\n❌ Import interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Import failed: {e}")
        logger.error(f"❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

