import logging
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.services.simplyrets import SimplyRETSService
from app.services.address_matching import AddressMatchingService
from app.models.listing import Listing
from app.models.agent import Agent
from app.models.office import Office
from app.models.import_audit import ImportAudit
from app.core.cache import invalidate_all_caches

logger = logging.getLogger(__name__)

def get_last_successful_import(db: Session) -> Optional[ImportAudit]:
    return (
        db.query(ImportAudit)
        .filter(ImportAudit.source == "simplyrets", ImportAudit.status == "success")
        .order_by(ImportAudit.completed_at.desc())
        .first()
    )

async def import_listings(
    db: Session,
    limit: int = 50,
    offset: int = 0,
    match_only: bool = False,
    since: datetime = None,
    run_type: str = "full"
) -> Dict[str, Any]:
    """
    Import listings from SimplyRETS and optionally match to parcels.
    
    Args:
        db: Database session
        limit: Maximum number of listings to fetch
        offset: Number of listings to skip
        match_only: If True, only match existing listings; don't fetch new ones
        since: Only import listings modified since this time
        run_type: Type of run (full, delta, match-only) for audit logging
        
    Returns:
        Statistics dictionary
    """
    stats = {
        "fetched": 0,
        "imported": 0,
        "updated": 0,
        "matched": 0,
        "skipped": 0,
        "errors": 0
    }

    audit = ImportAudit(
        source="simplyrets",
        run_type=run_type,
        status="started",
        started_at=datetime.utcnow(),
        since=since,
    )
    db.add(audit)
    db.commit()
    
    service = SimplyRETSService()
    
    audit_status = "success"
    audit_message = None
    try:
        if not match_only:
            # Fetch listings from SimplyRETS
            logger.info(f"Fetching up to {limit} listings from SimplyRETS (offset: {offset})...")

            try:
                # Try without state filter first (demo data may not have CT)
                result = await service.get_properties(
                    limit=limit,
                    offset=offset
                )

                listings_data = result.get("properties", [])
                stats["fetched"] = len(listings_data)

                logger.info(f"Fetched {stats['fetched']} listings from SimplyRETS")

                # Import/update listings (data is already transformed by get_properties)
                for listing_data in listings_data:
                    try:
                        listing_id_str = listing_data.get("listing_id_str")
                        if not listing_id_str:
                            logger.warning("Skipping listing without listing_id_str")
                            stats["errors"] += 1
                            continue

                        incoming_modified = listing_data.get("modified")
                        if since and incoming_modified and incoming_modified <= since:
                            stats["skipped"] += 1
                            continue

                        # Handle agent/office data FIRST (before creating listing)
                        agent_data = listing_data.get("_agent_data")
                        office_data = listing_data.get("_office_data")
                        listing_agent_id = listing_data.get("listing_agent_id")
                        listing_office_id = listing_data.get("listing_office_id")

                        # Create agent if needed
                        if agent_data and listing_agent_id:
                            try:
                                agent = db.query(Agent).filter(
                                    Agent.agent_id == listing_agent_id
                                ).first()
                                if not agent:
                                    agent = Agent(
                                        agent_id=listing_agent_id,
                                        first_name=agent_data.get("firstName"),
                                        last_name=agent_data.get("lastName"),
                                        email=agent_data.get("contact", {}).get("email"),
                                        office_phone=agent_data.get("contact", {}).get("office"),
                                        cell_phone=agent_data.get("contact", {}).get("cell"),
                                        address=agent_data.get("address")
                                    )
                                    db.add(agent)
                                    db.commit()
                            except Exception as e:
                                db.rollback()
                                logger.warning(f"Error importing agent for listing {listing_id_str}: {e}")

                        # Create office if needed
                        if office_data and listing_office_id:
                            try:
                                office = db.query(Office).filter(
                                    Office.office_id == listing_office_id
                                ).first()
                                if not office:
                                    office = Office(
                                        office_id=listing_office_id,
                                        name=office_data.get("name"),
                                        serving_name=office_data.get("servingName"),
                                        email=office_data.get("contact", {}).get("email"),
                                        office_phone=office_data.get("contact", {}).get("office"),
                                        cell_phone=office_data.get("contact", {}).get("cell")
                                    )
                                    db.add(office)
                                    db.commit()
                            except Exception as e:
                                db.rollback()
                                logger.warning(f"Error importing office for listing {listing_id_str}: {e}")

                        # Check if listing already exists
                        existing = db.query(Listing).filter(
                            Listing.listing_id_str == listing_id_str
                        ).first()

                        if existing:
                            if incoming_modified and existing.modified and incoming_modified <= existing.modified:
                                stats["skipped"] += 1
                                continue

                            # Update existing listing
                            for key, value in listing_data.items():
                                # Skip internal fields and agent/office data
                                if not key.startswith("_") and hasattr(existing, key):
                                    setattr(existing, key, value)
                            stats["updated"] += 1
                        else:
                            # Create new listing
                            listing = Listing(**{
                                k: v for k, v in listing_data.items()
                                if not k.startswith("_") and hasattr(Listing, k)
                            })
                            db.add(listing)
                            stats["imported"] += 1

                        # Commit listing
                        try:
                            db.commit()
                        except Exception as e:
                            db.rollback()
                            logger.error(f"Error committing listing {listing_id_str}: {e}")
                            stats["errors"] += 1
                            continue

                    except Exception as e:
                        db.rollback()
                        logger.error(f"Error importing listing: {e}")
                        stats["errors"] += 1
                        continue

                logger.info(
                    "Imported %s new listings, updated %s existing, skipped %s",
                    stats["imported"],
                    stats["updated"],
                    stats["skipped"],
                )

            except Exception as e:
                logger.error(f"Error fetching from SimplyRETS: {e}")
                db.rollback()
                stats["errors"] += 1
                audit_status = "error"
                audit_message = str(e)
                return stats
    
        # Match listings to parcels
        logger.info("Matching listings to parcels...")

        # We match UNMATCHED listings (parcel_id is None)
        # But maybe we should also re-match updated listings? 
        # For now, let's stick to unmatched to save compute
        unmatched_listings = db.query(Listing).filter(
            Listing.parcel_id.is_(None)
        ).limit(limit).all()

        if unmatched_listings:
            matcher = AddressMatchingService(db)
            match_stats = matcher.batch_match_listings(
                unmatched_listings,
                min_confidence=0.7,
                create_match_records=True
            )
            stats["matched"] = match_stats["matched"]
            logger.info(f"Matched {stats['matched']} listings to parcels")
        else:
            logger.info("No unmatched listings found")

        # Invalidate caches after successful import
        invalidated = invalidate_all_caches()
        logger.info(f"Cache invalidation complete: {invalidated} keys cleared")

        return stats
    except Exception as e:
        audit_status = "error"
        audit_message = str(e)
        raise
    finally:
        audit.status = audit_status
        audit.message = audit_message
        audit.completed_at = datetime.utcnow()
        audit.fetched = stats["fetched"]
        audit.imported = stats["imported"]
        audit.updated = stats["updated"]
        audit.matched = stats["matched"]
        audit.skipped = stats["skipped"]
        audit.errors = stats["errors"]
        db.add(audit)
        db.commit()
