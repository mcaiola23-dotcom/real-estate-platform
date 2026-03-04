"""
Background job for processing search alerts.
Checks which alerts are due for execution, runs searches, and sends notifications.

In production, this would be triggered by a scheduler (APScheduler, Celery beat, etc.)
For now, it can be called manually or via a cron-triggered endpoint.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from ..db import get_db
from ..models.search_alert import SearchAlert
from ..models.user import User, SavedSearch
from ..services.email_service import send_search_alert, AlertEmailData, EmailRecipient

logger = logging.getLogger(__name__)


def should_run_alert(alert: SearchAlert) -> bool:
    """Check if an alert should be run based on frequency and last_sent_at."""
    if not alert.is_active:
        return False
    
    if not alert.last_sent_at:
        return True  # Never sent before
    
    now = datetime.utcnow()
    
    if alert.frequency == "instant":
        # Instant alerts run whenever there are new listings (called separately)
        return False
    elif alert.frequency == "daily":
        return (now - alert.last_sent_at) >= timedelta(hours=23)
    elif alert.frequency == "weekly":
        return (now - alert.last_sent_at) >= timedelta(days=6, hours=23)
    
    return False


def run_search_for_alert(saved_search: SavedSearch, db: Session) -> List[Dict[str, Any]]:
    """
    Execute the saved search and return listing results.
    
    STUB: Returns empty list. In production, would call the actual search service.
    """
    # TODO: Integrate with actual search service
    # from ..services.search_builder import build_search, execute_search
    # results = execute_search(build_search(saved_search.filters))
    
    logger.info(f"[ALERT JOB] Would execute search: {saved_search.name} with filters: {saved_search.filters}")
    
    # Stub: return empty list
    return []


def find_new_listings(
    current_listings: List[Dict[str, Any]], 
    previous_listing_ids: List[int] = None
) -> List[Dict[str, Any]]:
    """Find listings that weren't in the previous batch."""
    if not previous_listing_ids:
        return current_listings
    
    previous_set = set(previous_listing_ids)
    return [l for l in current_listings if l.get('id') not in previous_set]


async def process_single_alert(alert: SearchAlert, db: Session) -> bool:
    """
    Process a single alert: run search, check for new listings, send email if any.
    
    Returns True if email was sent.
    """
    try:
        # Get the saved search
        saved_search = db.query(SavedSearch).filter(
            SavedSearch.id == alert.saved_search_id
        ).first()
        
        if not saved_search:
            logger.warning(f"[ALERT JOB] Saved search {alert.saved_search_id} not found for alert {alert.id}")
            return False
        
        # Get the user
        user = db.query(User).filter(User.user_id == alert.user_id).first()
        if not user or not user.email:
            logger.warning(f"[ALERT JOB] User {alert.user_id} not found or has no email")
            return False
        
        # Run the search
        all_listings = run_search_for_alert(saved_search, db)
        
        # Find new listings since last alert
        previous_ids = alert.last_listing_ids or []
        new_listings = find_new_listings(all_listings, previous_ids)
        
        if not new_listings:
            logger.info(f"[ALERT JOB] No new listings for alert {alert.id}")
            return False
        
        # Prepare email data
        listing_summaries = [
            {
                'address': l.get('address', 'Address N/A'),
                'price': l.get('price', 0),
                'beds': l.get('bedrooms', '?'),
                'baths': l.get('bathrooms', '?'),
            }
            for l in new_listings[:10]  # Max 10 in email
        ]
        
        email_data = AlertEmailData(
            recipient=EmailRecipient(
                email=user.email,
                name=user.full_name
            ),
            search_name=saved_search.name,
            new_listings_count=len(new_listings),
            listing_summaries=listing_summaries,
            search_url=f"https://smartmls.com/properties?savedSearchId={saved_search.id}"
        )
        
        # Send the email
        success = send_search_alert(email_data)
        
        if success:
            # Update the alert
            alert.last_sent_at = datetime.utcnow()
            alert.last_listing_ids = [l.get('id') for l in all_listings if l.get('id')]
            db.commit()
            
            logger.info(f"[ALERT JOB] Sent alert {alert.id} with {len(new_listings)} new listings")
            return True
        
        return False
        
    except Exception as e:
        logger.error(f"[ALERT JOB] Error processing alert {alert.id}: {e}")
        return False


async def run_alert_check():
    """
    Main job function: check all alerts and process those that are due.
    
    Call this from a scheduler or cron job.
    """
    logger.info("[ALERT JOB] Starting alert check...")
    
    # Get a fresh DB session
    db = next(get_db())
    
    try:
        # Get all active alerts
        alerts = db.query(SearchAlert).filter(
            SearchAlert.is_active == True
        ).all()
        
        logger.info(f"[ALERT JOB] Found {len(alerts)} active alerts")
        
        processed = 0
        sent = 0
        
        for alert in alerts:
            if should_run_alert(alert):
                processed += 1
                if await process_single_alert(alert, db):
                    sent += 1
        
        logger.info(f"[ALERT JOB] Completed. Processed: {processed}, Emails sent: {sent}")
        
        return {
            "total_alerts": len(alerts),
            "processed": processed,
            "emails_sent": sent
        }
        
    except Exception as e:
        logger.error(f"[ALERT JOB] Fatal error: {e}")
        raise
    finally:
        db.close()


# Optional: Endpoint to trigger manually (for testing)
async def trigger_alert_check_endpoint():
    """
    This could be mounted as an admin endpoint to manually trigger alert processing.
    Example usage in main.py:
    
    @app.post("/admin/trigger-alerts")
    async def trigger_alerts():
        from app.jobs.alert_job import trigger_alert_check_endpoint
        return await trigger_alert_check_endpoint()
    """
    return await run_alert_check()
