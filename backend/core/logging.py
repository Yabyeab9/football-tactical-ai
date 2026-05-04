from __future__ import annotations

import logging.config

from backend.core.settings import settings


def configure_logging() -> None:
    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s %(levelname)s [%(name)s] %(message)s",
                }
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "default",
                    "level": settings.log_level,
                }
            },
            "loggers": {
                "": {
                    "handlers": ["console"],
                    "level": settings.log_level,
                },
                "uvicorn.error": {
                    "handlers": ["console"],
                    "level": settings.log_level,
                    "propagate": False,
                },
                "uvicorn.access": {
                    "handlers": ["console"],
                    "level": "WARNING",
                    "propagate": False,
                },
            },
        }
    )
