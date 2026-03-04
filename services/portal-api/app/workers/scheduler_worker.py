"""
Dedicated worker entrypoint for the MLS scheduler loop.
Run separately from the web API process.
"""

import asyncio

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.sentry import init_sentry
from app.services.scheduler import run_scheduler_loop


def main() -> None:
    settings.validate_runtime_settings()
    setup_logging()
    init_sentry()
    asyncio.run(run_scheduler_loop())


if __name__ == "__main__":
    main()
