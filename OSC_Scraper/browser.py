"""
browser.py
==========

Motor baseado em Playwright — usado para (a) descoberta automática da base da
API e (b) coleta de fallback quando o acesso HTTP direto à API não é possível
(por exemplo, quando há proteção de origem/Referer ou a rede exige um navegador
real).

Estratégia de robustez: em vez de depender de seletores frágeis do DOM, abrimos
o SPA real do Mapa das OSCs e **reaproveitamos as próprias chamadas de API do
site**. A partir do contexto da página (base correta, cookies e cabeçalhos
válidos), executamos ``fetch`` para os mesmos endpoints REST usados pela
aplicação e coletamos o JSON — que é então normalizado pelo mesmo ``parser`` do
modo API. Isso funciona mesmo que o layout visual mude.

O import de Playwright é tardio: o restante da ferramenta funciona sem ele.
"""

from __future__ import annotations

import asyncio
import glob
import json
import os
import re
from typing import Any, Callable

from config import Settings, UFS
from database import Database
from logger import get_logger
from models import OSCStub
import parser

log = get_logger("browser")

_API_RE = re.compile(r"https?://[^/]+/(?:novomapaosc/)?api")


def _detect_chromium() -> str | None:
    """Localiza um executável Chromium pré-instalado (ambientes gerenciados).

    A versão do pacote ``playwright`` pode esperar um build de navegador
    diferente do que está instalado em ``PLAYWRIGHT_BROWSERS_PATH``. Nesses
    casos o launch padrão falha; detectamos o binário real por varredura.
    """
    roots = [
        os.environ.get("PLAYWRIGHT_BROWSERS_PATH", ""),
        "/opt/pw-browsers",
        os.path.expanduser("~/.cache/ms-playwright"),
    ]
    patterns = (
        "chromium-*/chrome-linux/chrome",
        "chromium_headless_shell-*/chrome-linux/headless_shell",
        "chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell",
        "chrome-linux/chrome",
    )
    for root in roots:
        if not root:
            continue
        for pat in patterns:
            matches = sorted(glob.glob(os.path.join(root, pat)))
            for m in matches:
                if os.path.exists(m) and os.access(m, os.X_OK):
                    return m
    return None


async def _launch(settings: Settings):
    """Lança o navegador (Chromium). Retorna (playwright, browser, context)."""
    from playwright.async_api import async_playwright  # import tardio

    pw = await async_playwright().start()
    launch_kwargs: dict[str, Any] = {"headless": settings.headless}
    executable = settings.browser_executable or _detect_chromium()
    if executable:
        launch_kwargs["executable_path"] = executable
        log.info("Usando Chromium em: %s", executable)
    try:
        browser = await pw.chromium.launch(**launch_kwargs)
    except Exception as exc:  # noqa: BLE001
        # Fallback final: tenta o launch padrão sem executable_path.
        log.warning("Launch com executable_path falhou (%s). Tentando padrão.", exc)
        launch_kwargs.pop("executable_path", None)
        browser = await pw.chromium.launch(**launch_kwargs)
    context = await browser.new_context(
        user_agent=settings.user_agent,
        locale="pt-BR",
        ignore_https_errors=True,
    )
    context.set_default_timeout(settings.nav_timeout * 1000)
    return pw, browser, context


async def discover_api(settings: Settings) -> str | None:
    """Abre o site e captura a base real da API observando o tráfego XHR."""
    captured: list[str] = []
    pw = browser = context = None
    try:
        pw, browser, context = await _launch(settings)
        page = await context.new_page()

        def on_request(request: Any) -> None:
            url = request.url
            if "/api/" in url and _API_RE.search(url):
                captured.append(url)

        page.on("request", on_request)
        await page.goto(settings.site_url, wait_until="networkidle")
        # Dá tempo para o SPA disparar as chamadas iniciais do mapa.
        await asyncio.sleep(5)
        for url in captured:
            m = _API_RE.search(url)
            if m:
                return m.group(0)
        return None
    except Exception as exc:  # noqa: BLE001
        log.warning("discover_api falhou: %s", exc)
        return None
    finally:
        for closer in (context, browser):
            if closer is not None:
                try:
                    await closer.close()
                except Exception:  # noqa: BLE001
                    pass
        if pw is not None:
            await pw.stop()


class BrowserScraper:
    """Coletor de fallback que executa as chamadas de API dentro do navegador."""

    def __init__(self, settings: Settings, db: Database,
                 on_progress: Callable[[str, int], None] | None = None) -> None:
        self.s = settings
        self.db = db
        self.on_progress = on_progress or (lambda _msg, _n: None)
        self._processed = 0

    async def _api_base(self, page: Any) -> str:
        """Determina a base da API a partir do contexto da página."""
        origin = await page.evaluate("() => window.location.origin")
        # Tenta os caminhos conhecidos; retorna o primeiro que responde JSON.
        # A API oficial fica sob ``/api`` (sem duplicar o segmento).
        for suffix in ("/api", "/novomapaosc/api"):
            base = origin + suffix
            ok = await self._probe(page, base)
            if ok:
                return base
        return origin + "/api"

    async def _probe(self, page: Any, base: str) -> bool:
        script = """
        async (url) => {
            try {
                const r = await fetch(url, {headers: {'Accept': 'application/json'}});
                return r.ok;
            } catch (e) { return false; }
        }
        """
        try:
            return bool(await page.evaluate(script, base + "/osc/dados_gerais/1"))
        except Exception:  # noqa: BLE001
            return False

    async def _fetch_json(self, page: Any, url: str,
                          method: str = "GET", body: str | None = None) -> Any:
        """Executa fetch() no contexto da página e retorna o JSON."""
        script = """
        async ({url, method, body}) => {
            const opts = {method, headers: {'Accept': 'application/json',
                         'X-Requested-With': 'XMLHttpRequest'}};
            if (body) {
                opts.headers['Content-Type'] =
                    'application/x-www-form-urlencoded; charset=UTF-8';
                opts.body = body;
            }
            try {
                const r = await fetch(url, opts);
                const t = await r.text();
                try { return JSON.parse(t); } catch (e) { return null; }
            } catch (e) { return null; }
        }
        """
        try:
            return await page.evaluate(script, {"url": url, "method": method,
                                                "body": body})
        except Exception as exc:  # noqa: BLE001
            log.debug("fetch no navegador falhou (%s): %s", url, exc)
            return None

    async def run(self, stop_flag: Callable[[], bool] | None = None) -> int:
        """Percorre todas as UFs coletando via navegador. Retorna nº coletado."""
        stop_flag = stop_flag or (lambda: False)
        pw = browser = context = None
        try:
            pw, browser, context = await _launch(self.s)
            page = await context.new_page()
            log.info("Abrindo %s no navegador…", self.s.site_url)
            await page.goto(self.s.site_url, wait_until="domcontentloaded")
            await asyncio.sleep(3)
            base = await self._api_base(page)
            log.info("Base de API no navegador: %s", base)

            processed_ids = self.db.processed_ids()

            for cod_uf in UFS:
                if stop_flag():
                    break
                await self._crawl_uf(page, base, cod_uf, processed_ids, stop_flag)
            return self._processed
        finally:
            for closer in (context, browser):
                if closer is not None:
                    try:
                        await closer.close()
                    except Exception:  # noqa: BLE001
                        pass
            if pw is not None:
                await pw.stop()

    async def _crawl_uf(self, page: Any, base: str, cod_uf: int,
                        processed_ids: set[int],
                        stop_flag: Callable[[], bool]) -> None:
        limit = self.s.page_size
        offset = 0
        chave = f"uf:{cod_uf}"
        cursor = self.db.get_partition(chave)
        offset = int(cursor["offset"])
        if cursor.get("concluida"):
            return

        while not stop_flag():
            avancado = json.dumps({"dadosGerais": {"cd_uf": cod_uf}})
            from urllib.parse import quote

            url = (f"{base}/osc/busca_avancada/{self.s.busca_tipo}/"
                   f"{limit}/{offset}?avancado={quote(avancado)}")
            payload = await self._fetch_json(page, url)
            stubs = list(parser.iter_stubs(payload))
            if not stubs:
                self.db.save_partition(chave, offset, True, 0)
                return

            for stub in stubs:
                if stop_flag():
                    return
                if stub.id_osc in processed_ids:
                    continue
                processed_ids.add(stub.id_osc)
                await self._collect_detail(page, base, stub)

            offset += limit
            self.db.save_partition(chave, offset, False, 0)
            if len(stubs) < limit:
                self.db.save_partition(chave, offset, True, 0)
                return

    async def _collect_detail(self, page: Any, base: str, stub: OSCStub) -> None:
        _id = stub.id_osc

        async def g(suffix: str) -> Any:
            return await self._fetch_json(page, f"{base}{suffix.format(id=_id)}")

        dados, certs, rel, areas, projs, desc = await asyncio.gather(
            g(self.s.ep_dados_gerais), g(self.s.ep_certificados),
            g(self.s.ep_rel_trabalho), g(self.s.ep_areas_atuacao),
            g(self.s.ep_projetos), g(self.s.ep_descricao),
        )
        osc = parser.parse_dados_gerais(dados) if dados else stub.to_osc()
        osc.id_osc = _id
        osc.merge(stub.to_osc())
        if areas:
            parser.apply_areas(osc, areas)
        if certs:
            parser.apply_certificacoes(osc, certs)
        if rel:
            parser.apply_rel_trabalho(osc, rel)
        if projs:
            parser.apply_projetos(osc, projs)
        if desc:
            parser.apply_descricao(osc, desc)
        osc.fonte = "browser"
        self.db.upsert_osc(osc)
        self._processed += 1
        if self._processed % 20 == 0:
            self.on_progress(osc.nome or str(_id), self._processed)
