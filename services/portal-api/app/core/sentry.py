"""
Sentry error tracking initialization for the SmartMLS AI Platform.
"""

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

from .config import settings


def init_sentry() -> None:
    """
    Initialize Sentry SDK with FastAPI integration.
    Only initializes if SENTRY_DSN is configured.
    """
    if not settings.sentry_dsn:
        return
    
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.sentry_environment,
        traces_sample_rate=settings.sentry_traces_sample_rate,
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            SqlalchemyIntegration(),
            LoggingIntegration(
                level=None,  # Capture all log levels as breadcrumbs
                event_level=None,  # Don't create events from logs
            ),
        ],
        # Set release version for tracking deployments
        release=f"smartmls-backend@{settings.api_version}",
        # Don't send PII by default
        send_default_pii=False,
    )
