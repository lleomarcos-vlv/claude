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

    async def probe_base(
        self, candidate_bases: list[str], sample_uf: int = 35
    ) -> str | None:
        """Retorna a primeira base cujo endpoint de **busca** devolve resultados.

        Estratégia anterior (frágil): checar ``/osc/dados_gerais/1``. Um id
        inexistente devolve ``null`` (JSON válido!), o que fazia a base correta
        ser rejeitada e uma base errada — que respondia a *outros* caminhos mas
        dava 404 na busca — ser aceita. O sintoma era exatamente ``0 OSCs
        encontradas`` com 404 em ``…/osc/busca_avancada/…``.

        Aqui validamos a base contra o **próprio endpoint de enumeração** — o
        que o crawler realmente usa. Uma base só é aceita se a busca responder
        com uma lista de OSCs (``sample_uf`` = SP, que sempre tem resultados).
        """
        assert self._client is not None
        avancado_json = json.dumps(
            {"dadosGerais": {"cd_uf": sample_uf}}, ensure_ascii=False
        )
        for base in candidate_bases:
            url = base.rstrip("/") + self.s.ep_busca.format(
                tipo=self.s.busca_tipo, limit=1, offset=0
            )
            if await self._base_search_ok(url, avancado_json):
                log.info("Base de API validada pela busca: %s", base)
                return base
            log.debug("Base %s não respondeu à busca; tentando a próxima.", base)
        return None

    async def _base_search_ok(self, url: str, avancado_json: str) -> bool:
        """Testa uma URL de busca (POST e depois GET) e diz se veio resultado."""
        assert self._client is not None
        # 1) POST (form) — mesmo formato usado pelo próprio portal.
        try:
            resp = await self._client.post(
                url, data={"avancado": avancado_json, "busca": avancado_json}
            )
            if resp.status_code < 400 and self._has_results(self._safe_json(resp)):
                return True
        except httpx.HTTPError:
            pass
        # 2) GET com ?avancado= (algumas implantações aceitam via query).
        try:
            from urllib.parse import quote

            resp = await self._client.get(f"{url}?avancado={quote(avancado_json)}")
            if resp.status_code < 400 and self._has_results(self._safe_json(resp)):
                return True
        except httpx.HTTPError:
            pass
        return False

    @staticmethod
    def _has_results(payload: Any) -> bool:
        """Diz se um payload de busca contém ao menos uma OSC."""
        if isinstance(payload, list):
            return len(payload) > 0
        if isinstance(payload, dict):
            for key in ("data", "resultado", "oscs", "results", "rows", "items"):
                value = payload.get(key)
                if isinstance(value, list) and value:
                    return True
        return False
