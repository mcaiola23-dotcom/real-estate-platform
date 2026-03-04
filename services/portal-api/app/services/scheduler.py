import asyncio
import logging
from datetime import datetime, timedelta

from app.core.config import settings
from app.db import SessionLocal
from app.services.mls_import import get_last_successful_import, import_listings

logger = logging.getLogger(__name__)


async def run_scheduler_iteration() -> None:
    """
    Run one scheduler cycle and trigger import if refresh window has elapsed.
    """
    try:
        logger.info("Scheduler: Checking if import is needed...")

        db = SessionLocal()
        try:
            last_success = get_last_successful_import(db)
            now = datetime.utcnow()
            refresh_interval = timedelta(hours=settings.scheduler_refresh_interval_hours)

            should_run = False
            since = None

            if not last_success:
                logger.info("Scheduler: No previous successful import found. Running full import.")
                should_run = True
            else:
                elapsed = now - last_success.completed_at.replace(tzinfo=None)
                if elapsed > refresh_interval:
                    logger.info("Scheduler: %s elapsed since last import. Running delta import.", elapsed)
                    should_run = True
                    since = last_success.completed_at
                else:
                    logger.info("Scheduler: %s elapsed. Import not needed yet.", elapsed)

            if should_run:
                run_type = "delta" if since else "full"
                await import_listings(
                    db,
                    limit=500,
                    offset=0,
                    match_only=False,
                    since=since,
                    run_type=run_type,
                )
                logger.info("Scheduler: Import completed successfully.")
        finally:
            db.close()
    except Exception:
        logger.exception("Scheduler iteration failed")


async def run_scheduler_loop() -> None:
    """Run scheduler forever for dedicated worker process."""
    logger.info(
        "Starting MLS scheduler worker (refresh interval=%sh, poll=%ss)",
        settings.scheduler_refresh_interval_hours,
        settings.scheduler_poll_interval_seconds,
    )
    while True:
        await run_scheduler_iteration()
        await asyncio.sleep(settings.scheduler_poll_interval_seconds)
