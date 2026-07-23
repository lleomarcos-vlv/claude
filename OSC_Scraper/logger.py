"""
logger.py
=========

Configuração de logging do projeto.

Fornece um logger único, com saída simultânea para console (colorida via
``rich`` quando disponível) e para arquivo rotativo em ``logs/``. Registra
horário, OSC processada, erros, páginas visitadas e demais eventos.
"""

from __future__ import annotations

import logging
import sys
from datetime import datetime
from logging.handlers import RotatingFileHandler
from pathlib import Path

from config import LOGS_DIR, settings

_CONFIGURED = False


def _build_file_handler() -> logging.Handler:
    ts = datetime.now().strftime("%Y%m%d")
    log_file: Path = LOGS_DIR / f"osc_scraper_{ts}.log"
    handler = RotatingFileHandler(
        log_file, maxBytes=10 * 1024 * 1024, backupCount=5, encoding="utf-8"
    )
    handler.setFormatter(
        logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    )
    return handler


def _build_console_handler() -> logging.Handler:
    try:
        from rich.logging import RichHandler  # type: ignore

        return RichHandler(
            rich_tracebacks=True, show_path=False, markup=False, show_time=True
        )
    except Exception:  # rich ausente — fallback para stream padrão
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s | %(levelname)-8s | %(message)s",
                datefmt="%H:%M:%S",
            )
        )
        return handler


def setup_logging(level: str | None = None) -> None:
    """Configura o logging global (idempotente)."""
    global _CONFIGURED
    if _CONFIGURED:
        return
    root = logging.getLogger()
    root.setLevel(getattr(logging, (level or settings.log_level).upper(), logging.INFO))
    root.handlers.clear()
    root.addHandler(_build_console_handler())
    root.addHandler(_build_file_handler())
    # Silencia bibliotecas verbosas.
    for noisy in ("httpx", "httpcore", "asyncio", "urllib3"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
    _CONFIGURED = True


def get_logger(name: str = "osc") -> logging.Logger:
    """Retorna um logger nomeado, garantindo a configuração global."""
    if not _CONFIGURED:
        setup_logging()
    return logging.getLogger(name)
