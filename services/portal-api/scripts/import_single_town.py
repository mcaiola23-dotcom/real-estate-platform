"""
Script to import a single town's CT GIS data.
Useful for debugging and completing specific towns.
"""

import sys
import argparse
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db import SessionLocal
from app.services.gis_import import GISImportService

def import_town(town_file: Path, batch_size: int = 500):
    """Import a single town's data."""
    print(f"Importing: {town_file.name}")
    print("="*80)
    
    db = SessionLocal()
    try:
        service = GISImportService(db)
        stats = service.import_geojson_file(
            file_path=town_file,
            batch_size=batch_size,
            dry_run=False
        )
        
        print("\n" + "="*80)
        print("IMPORT RESULTS")
        print("="*80)
        print(f"Total parcels in file: {stats['total']:,}")
        print(f"Imported: {stats['imported']:,}")
        print(f"Skipped: {stats['skipped']:,}")
        print(f"Errors: {stats['errors']:,}")
        
        if stats['errors'] > 0 and stats['errors_detail']:
            print(f"\nFirst 10 errors:")
            for error in stats['errors_detail'][:10]:
                print(f"  - {error}")
        
        return stats
    finally:
        db.close()

def main():
    parser = argparse.ArgumentParser(description="Import single town CT GIS data")
    parser.add_argument('town', help='Town name (e.g., "darien", "brookfield", "new_canaan")')
    parser.add_argument('--batch-size', type=int, default=500, help='Batch size')
    parser.add_argument('--data-dir', type=Path, 
                       default=Path(r'C:\Users\19143\Projects\fairfield-realestate\backend\data\chunks'),
                       help='Data directory')
    
    args = parser.parse_args()
    
    # Find the file
    town_lower = args.town.lower().replace(' ', '_')
    file_path = args.data_dir / f"{town_lower}_parcels.geojson"
    
    if not file_path.exists():
        # Try alternative naming
        alternatives = [
            args.data_dir / f"{args.town}_parcels.geojson",
            args.data_dir / f"{town_lower.replace('_', '')}_parcels.geojson",
        ]
        for alt in alternatives:
            if alt.exists():
                file_path = alt
                break
        else:
            print(f"Error: Could not find file for town '{args.town}'")
            print(f"Looked for: {file_path}")
            print(f"Available files:")
            for f in sorted(args.data_dir.glob("*.geojson")):
                print(f"  - {f.name}")
            sys.exit(1)
    
    import_town(file_path, args.batch_size)

if __name__ == '__main__':
    main()


