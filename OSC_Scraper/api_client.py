"""
api_client.py
=============

Cliente HTTP assíncrono para a API pública do Mapa das OSCs (IPEA).

Encapsula ``httpx.AsyncClient`` com:
  * retry automático + backoff exponencial (via utils.async_retry);
  * respeito ao proxy corporativo e ao bundle de CA quando presentes;
  * cache em disco opcional das respostas (evita rebuscar em re-execuções);
  * rate limiting simples entre requisições.

A API é um app Laravel; endpoints públicos relevantes (ver config.py):
  GET  /osc/dados_gerais/{id}      -> dados cadastrais completos
  GET  /osc/certificados/{id}      -> certificações (OSCIP, CEBAS, Util. Pública)
  GET  /osc/rel_trabalho_e_governanca/{id} -> vínculos de trabalho/voluntários
  ...
  POST /osc/busca_avancada/{tipo}/{limit}/{offset}  -> enumeração paginada
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import httpx

from config import Settings
from logger import get_logger
from utils import async_retry

log = get_logger("api")


class APIClient:
    """Cliente assíncrono de alto nível para a API do portal."""

    def __init__(self, settings: Settings) -> None:
        self.s = settings
        self._client: httpx.AsyncClient | None = None
        self._cache_dir: Path = settings.cache_dir
        if settings.use_cache:
            self._cache_dir.mkdir(parents=True, exist_ok=True)

    # ---------------------------------------------------------------- ciclo
    async def __aenter__(self) -> "APIClient":
        await self.open()
        return self

    async def __aexit__(self, *exc: Any) -> None:
        await self.close()

    async def open(self) -> None:
        if self._client is not None:
            return
        verify: Any = True
        if self.s.ca_bundle:
            verify = self.s.ca_bundle
        headers = {
            "User-Agent": self.s.user_agent,
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "pt-BR,pt;q=0.9",
            "X-Requested-With": "XMLHttpRequest",
        }
        self._client = httpx.AsyncClient(
            headers=headers,
            timeout=httpx.Timeout(self.s.request_timeout),
            verify=verify,
            proxy=self.s.http_proxy,
            follow_redirects=True,
            limits=httpx.Limits(
                max_connections=self.s.concurrency * 2,
                max_keepalive_connections=self.s.concurrency,
            ),
        )

    async def close(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    # ---------------------------------------------------------------- cache
    def _cache_path(self, key: str) -> Path:
        digest = hashlib.sha1(key.encode("utf-8")).hexdigest()
        return self._cache_dir / f"{digest}.json"

    def _cache_read(self, key: str) -> Any | None:
        if not self.s.use_cache:
            return None
        path = self._cache_path(key)
        if path.exists():
            try:
                return json.loads(path.read_text(encoding="utf-8"))
            except (ValueError, OSError):
                return None
        return None

    def _cache_write(self, key: str, value: Any) -> None:
        if not self.s.use_cache:
            return
        try:
            self._cache_path(key).write_text(
                json.dumps(value, ensure_ascii=False), encoding="utf-8"
            )
        except (OSError, TypeError):
            pass

    # ---------------------------------------------------------------- verbos
    async def get_json(self, url: str, *, use_cache: bool = True) -> Any:
        """GET com retry, backoff e cache. Retorna o JSON decodificado."""
        cache_key = f"GET {url}"
        if use_cache:
            cached = self._cache_read(cache_key)
            if cached is not None:
                return cached
        data = await self._get_json_retry(url)
        if use_cache and data is not None:
            self._cache_write(cache_key, data)
        return data

    @async_retry(retries=5, exceptions=(httpx.HTTPError,), logger=log)
    async def _get_json_retry(self, url: str) -> Any:
        assert self._client is not None
        resp = await self._client.get(url)
        resp.raise_for_status()
        return self._safe_json(resp)

    async def post_json(
        self, url: str, *, data: dict[str, Any] | None = None,
        json_body: Any | None = None, use_cache: bool = True,
    ) -> Any:
        """POST (form ou JSON) com retry e cache."""
        cache_key = f"POST {url} {json.dumps(data or json_body, sort_keys=True, default=str)}"
        if use_cache:
            cached = self._cache_read(cache_key)
            if cached is not None:
                return cached
        result = await self._post_json_retry(url, data, json_body)
        if use_cache and result is not None:
            self._cache_write(cache_key, result)
        return result

    @async_retry(retries=5, exceptions=(httpx.HTTPError,), logger=log)
    async def _post_json_retry(
        self, url: str, data: dict[str, Any] | None, json_body: Any | None
    ) -> Any:
        assert self._client is not None
        resp = await self._client.post(url, data=data, json=json_body)
        resp.raise_for_status()
        return self._safe_json(resp)

    @staticmethod
    def _safe_json(resp: httpx.Response) -> Any:
        try:
            return resp.json()
        except ValueError:
            text = resp.text.strip()
            # Alguns endpoints Laravel envolvem o JSON; tenta recuperar.
            if text.startswith("{") or text.startswith("["):
                try:
                    return json.loads(text)
                except ValueError:
                    return None
            return None

    async def probe_base(self, candidate_bases: list[str], test_id: int = 1) -> str | None:
        """Testa bases de API candidatas e retorna a primeira que responde JSON."""
        assert self._client is not None
        for base in candidate_bases:
            url = base.rstrip("/") + self.s.ep_dados_gerais.format(id=test_id)
            try:
                resp = await self._client.get(url)
                if resp.status_code < 500 and self._safe_json(resp) is not None:
                    log.info("Base de API respondendo: %s", base)
                    return base
            except httpx.HTTPError as exc:
                log.debug("Base %s não respondeu: %s", base, exc)
        return None
