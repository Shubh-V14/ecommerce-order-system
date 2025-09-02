"""
Professional Logging Configuration
Date-based rotating logs with structured logging using structlog
"""

import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

import structlog
from rich.console import Console
from rich.logging import RichHandler

from app.core.config import settings


def setup_logging() -> None:
    """Configure structured logging with date-based rotation"""
    
    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Date-based log file
    today = datetime.now().strftime("%Y-%m-%d")
    log_file = log_dir / f"ecommerce-api-{today}.log"
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.dev.ConsoleRenderer(colors=True),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Setup file handler for date-based logging
    import logging
    import logging.handlers
    
    # Root logger configuration
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # File handler with date-based rotation
    file_handler = logging.handlers.TimedRotatingFileHandler(
        filename=str(log_file),
        when='midnight',
        interval=1,
        backupCount=30,  # Keep 30 days of logs
        encoding='utf-8'
    )
    file_handler.suffix = "%Y-%m-%d"
    
    # Console handler with Rich formatting
    console_handler = RichHandler(
        console=Console(stderr=True),
        show_time=True,
        show_path=True,
        markup=True,
        rich_tracebacks=True
    )
    
    # Set formatters
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # Add handlers
    root_logger.addHandler(file_handler)
    if settings.debug:
        root_logger.addHandler(console_handler)


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a structured logger instance"""
    return structlog.get_logger(name)


class LoggerMixin:
    """Mixin to add logging capabilities to classes"""
    
    @property
    def logger(self) -> structlog.stdlib.BoundLogger:
        return get_logger(self.__class__.__name__)


# Application logger
app_logger = get_logger("ecommerce_api")
