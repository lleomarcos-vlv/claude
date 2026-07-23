"""
utils.py
========

Funções utilitárias compartilhadas: retry assíncrono com backoff exponencial,
formatação de CNPJ, limpeza de texto, extração flexível de campos (por lista de
aliases), detecção de redes sociais/WhatsApp e formatação de tempo/ETA.
"""

from __future__ import annotations

import asyncio
import functools
import random
import re
from typing import Any, Awaitable, Callable, Iterable, Sequence, TypeVar

T = TypeVar("T")


# ---------------------------------------------------------------------------
# Retry assíncrono com backoff exponencial + jitter
# ---------------------------------------------------------------------------
def async_retry(
    retries: int = 5,
    backoff_base: float = 1.5,
    backoff_max: float = 30.0,
    exceptions: tuple[type[BaseException], ...] = (Exception,),
    logger: Any | None = None,
) -> Callable[[Callable[..., Awaitable[T]]], Callable[..., Awaitable[T]]]:
    """Decorator que reexecuta uma corrotina em caso de falha transitória.

    Espera ``backoff_base ** tentativa`` segundos (limitado a ``backoff_max``),
    com jitter aleatório para evitar thundering herd.
    """

    def decorator(func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> T:
            last_exc: BaseException | None = None
            for attempt in range(1, retries + 1):
                try:
                    return await func(*args, **kwargs)
                except exceptions as exc:  # noqa: BLE001 - retry intencional
                    last_exc = exc
                    if attempt >= retries:
                        break
                    delay = min(backoff_base ** attempt, backoff_max)
                    delay += random.uniform(0, delay * 0.25)
                    if logger:
                        logger.warning(
                            "Tentativa %d/%d falhou (%s: %s). Aguardando %.1fs.",
                            attempt, retries, type(exc).__name__, exc, delay,
                        )
                    await asyncio.sleep(delay)
            assert last_exc is not None
            raise last_exc

        return wrapper

    return decorator


# ---------------------------------------------------------------------------
# Extração flexível de campos
# ---------------------------------------------------------------------------
def deep_get(data: Any, key: str) -> Any:
    """Busca ``key`` recursivamente em dicts/listas aninhados (primeira ocorrência)."""
    if isinstance(data, dict):
        if key in data and data[key] not in (None, ""):
            return data[key]
        for value in data.values():
            found = deep_get(value, key)
            if found not in (None, "", []):
                return found
    elif isinstance(data, list):
        for item in data:
            found = deep_get(item, key)
            if found not in (None, "", []):
                return found
    return None


def extract(data: Any, aliases: Sequence[str], default: Any = "") -> Any:
    """Retorna o primeiro valor não-vazio dentre os ``aliases`` em ``data``.

    Primeiro tenta chaves de topo (rápido); depois busca em profundidade.
    """
    if isinstance(data, dict):
        for alias in aliases:
            if alias in data and data[alias] not in (None, ""):
                return data[alias]
    for alias in aliases:
        found = deep_get(data, alias)
        if found not in (None, "", []):
            return found
    return default


# ---------------------------------------------------------------------------
# Limpeza / formatação de texto
# ---------------------------------------------------------------------------
_WS_RE = re.compile(r"\s+")


def clean_text(value: Any) -> str:
    """Normaliza espaços, remove HTML simples e devolve string limpa."""
    if value is None:
        return ""
    text = str(value)
    text = re.sub(r"<[^>]+>", " ", text)          # remove tags HTML
    text = text.replace("\xa0", " ").replace("\r", " ").replace("\n", " ")
    text = _WS_RE.sub(" ", text).strip()
    if text.lower() in {"none", "null", "undefined", "nan"}:
        return ""
    return text


def format_cnpj(value: Any) -> str:
    """Formata um CNPJ para ``00.000.000/0000-00`` quando possível."""
    if value in (None, ""):
        return ""
    digits = re.sub(r"\D", "", str(value))
    if not digits:
        return ""
    digits = digits.zfill(14)[-14:]
    return f"{digits[0:2]}.{digits[2:5]}.{digits[5:8]}/{digits[8:12]}-{digits[12:14]}"


def format_cep(value: Any) -> str:
    if value in (None, ""):
        return ""
    digits = re.sub(r"\D", "", str(value))
    if len(digits) == 8:
        return f"{digits[0:5]}-{digits[5:8]}"
    return clean_text(value)


def only_digits(value: Any) -> str:
    return re.sub(r"\D", "", str(value)) if value not in (None, "") else ""


# ---------------------------------------------------------------------------
# Detecção de redes sociais e WhatsApp
# ---------------------------------------------------------------------------
_SOCIAL_PATTERNS: dict[str, re.Pattern[str]] = {
    "facebook": re.compile(r"(?:https?://)?(?:www\.)?(?:facebook|fb)\.com/[\w.\-/]+", re.I),
    "instagram": re.compile(r"(?:https?://)?(?:www\.)?instagram\.com/[\w.\-/]+", re.I),
    "linkedin": re.compile(r"(?:https?://)?(?:www\.)?linkedin\.com/[\w.\-/]+", re.I),
    "youtube": re.compile(r"(?:https?://)?(?:www\.)?(?:youtube\.com|youtu\.be)/[\w.\-/?=]+", re.I),
}
_WHATSAPP_RE = re.compile(r"(?:wa\.me/|api\.whatsapp\.com|whatsapp)[\w./?=]*", re.I)
_EMAIL_RE = re.compile(r"[\w.\-+]+@[\w.\-]+\.\w+")


def detect_social_links(*texts: str) -> dict[str, str]:
    """Extrai links de redes sociais de um conjunto de textos livres."""
    blob = " ".join(t for t in texts if t)
    result: dict[str, str] = {}
    for network, pattern in _SOCIAL_PATTERNS.items():
        m = pattern.search(blob)
        if m:
            result[network] = m.group(0)
    if _WHATSAPP_RE.search(blob):
        result["whatsapp"] = _WHATSAPP_RE.search(blob).group(0)  # type: ignore[union-attr]
    return result


def extract_email(*texts: str) -> str:
    for t in texts:
        if not t:
            continue
        m = _EMAIL_RE.search(t)
        if m:
            return m.group(0)
    return ""


def is_mobile_phone(value: str) -> bool:
    """Heurística: celular brasileiro tem 11 dígitos com o 9º dígito = 9."""
    d = only_digits(value)
    if len(d) == 11 and d[2] == "9":
        return True
    if len(d) == 9 and d[0] == "9":
        return True
    return False


# ---------------------------------------------------------------------------
# Formatação de tempo / ETA
# ---------------------------------------------------------------------------
def format_duration(seconds: float) -> str:
    seconds = int(max(0, seconds))
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    if h:
        return f"{h}h{m:02d}m{s:02d}s"
    if m:
        return f"{m}m{s:02d}s"
    return f"{s}s"


def chunked(iterable: Iterable[T], size: int) -> Iterable[list[T]]:
    """Divide um iterável em lotes de tamanho ``size``."""
    batch: list[T] = []
    for item in iterable:
        batch.append(item)
        if len(batch) >= size:
            yield batch
            batch = []
    if batch:
        yield batch
