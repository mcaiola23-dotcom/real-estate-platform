"""
Structured logging configuration for the SmartMLS AI Platform.
Provides request ID tracking and timing instrumentation.
"""

import logging
import sys
import time
import uuid
from contextvars import ContextVar
from functools import wraps
from typing import Callable, Any

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from .config import settings


# Context variable for request ID propagation
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware to generate and propagate request IDs.
    Adds X-Request-ID header to responses.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
        request_id_ctx.set(request_id)
        
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class StructuredFormatter(logging.Formatter):
    """
    Formatter that includes request_id and structured fields.
    Uses JSON-like format for easier parsing.
    """
    
    def format(self, record: logging.LogRecord) -> str:
        request_id = request_id_ctx.get()
        
        # Add request_id to the log record
        record.request_id = request_id if request_id else "-"
        
        # Add any extra fields
        extra_fields = ""
        if hasattr(record, "extra_data") and record.extra_data:
            extra_fields = " | " + " ".join(
                f"{k}={v}" for k, v in record.extra_data.items()
            )
        record.extra_fields = extra_fields
        
        return super().format(record)


def setup_logging() -> None:
    """
    Configure structured logging based on settings.
    """
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)
    
    # Create formatter
    if settings.log_format == "json":
        format_str = (
            '{"time":"%(asctime)s","level":"%(levelname)s",'
            '"request_id":"%(request_id)s","name":"%(name)s",'
            '"message":"%(message)s"%(extra_fields)s}'
        )
    else:
        format_str = (
            "%(asctime)s | %(levelname)-8s | %(request_id)s | "
            "%(name)s | %(message)s%(extra_fields)s"
        )
    
    formatter = StructuredFormatter(format_str, datefmt="%Y-%m-%d %H:%M:%S")
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Add stdout handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    root_logger.addHandler(handler)
    
    # Suppress noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the given name.
    """
    return logging.getLogger(name)


def log_with_context(logger: logging.Logger, level: int, message: str, **kwargs: Any) -> None:
    """
    Log a message with extra context data.
    """
    record = logger.makeRecord(
        logger.name, level, "", 0, message, (), None
    )
    record.extra_data = kwargs
    logger.handle(record)


def timed_endpoint(logger: logging.Logger):
    """
    Decorator to log endpoint timing and basic info.
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                duration_ms = (time.time() - start_time) * 1000
                log_with_context(
                    logger, logging.INFO,
                    f"{func.__name__} completed",
                    duration_ms=f"{duration_ms:.2f}",
                    status="success"
                )
                return result
            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000
                log_with_context(
                    logger, logging.ERROR,
                    f"{func.__name__} failed: {str(e)}",
                    duration_ms=f"{duration_ms:.2f}",
                    status="error"
                )
                raise
        return wrapper
    return decorator
