"""
webapp.py
=========

Interface web (painel de controle) do OSC Scraper.

Servidor FastAPI que serve a página HTML estática e expõe uma API de controle
usada pelos botões da interface:

  POST /api/start     -> inicia a coleta
  POST /api/pause     -> pausa
  POST /api/resume    -> continua
  POST /api/stop      -> para
  POST /api/export    -> gera Excel/CSV/JSON (?fmt=xlsx|csv|json|all)
  GET  /api/status    -> estatísticas em tempo real (JSON)
  GET  /api/stream    -> Server-Sent Events com o status (atualização contínua)

A coleta roda como tarefa asyncio dentro do mesmo event loop do servidor, de
modo que o painel permanece responsivo enquanto o robô trabalha.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any

from fastapi import FastAPI, Query
from fastapi.responses import (
    FileResponse,
    HTMLResponse,
    JSONResponse,
    StreamingResponse,
)
from fastapi.staticfiles import StaticFiles

from config import STATIC_DIR, Settings, settings as default_settings
from database import Database
import excel as excel_export
from logger import get_logger
from scraper import Scraper

log = get_logger("webapp")


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or default_settings
    app = FastAPI(title="OSC Scraper — Mapa das OSCs (IPEA)", version="1.0.0")
    scraper = Scraper(settings)

    # -------------------------------------------------------------- páginas
    @app.get("/", response_class=HTMLResponse)
    async def index() -> Any:
        index_file = STATIC_DIR / "index.html"
        if index_file.exists():
            return HTMLResponse(index_file.read_text(encoding="utf-8"))
        return HTMLResponse("<h1>OSC Scraper</h1><p>index.html não encontrado.</p>")

    # -------------------------------------------------------------- controle
    @app.post("/api/start")
    async def start() -> Any:
        started = scraper.start()
        return {"ok": started, "state": scraper.stats.state.value}

    @app.post("/api/pause")
    async def pause() -> Any:
        scraper.pause()
        return {"ok": True, "state": scraper.stats.state.value}

    @app.post("/api/resume")
    async def resume() -> Any:
        scraper.resume()
        return {"ok": True, "state": scraper.stats.state.value}

    @app.post("/api/stop")
    async def stop() -> Any:
        scraper.stop()
        return {"ok": True, "state": scraper.stats.state.value}

    @app.get("/api/status")
    async def status() -> Any:
        return JSONResponse(scraper.snapshot())

    @app.get("/api/stream")
    async def stream() -> Any:
        async def event_gen() -> Any:
            while True:
                data = json.dumps(scraper.snapshot(), ensure_ascii=False)
                yield f"data: {data}\n\n"
                await asyncio.sleep(1.0)

        return StreamingResponse(event_gen(), media_type="text/event-stream")

    # -------------------------------------------------------------- export
    @app.post("/api/export")
    async def export(fmt: str = Query("all", pattern="^(all|xlsx|csv|json)$")) -> Any:
        db = Database(settings.db_path)
        try:
            result: dict[str, Any] = {}
            if fmt in ("all", "xlsx"):
                result["xlsx"] = excel_export.export_excel(db, settings.xlsx_path)
            if fmt in ("all", "csv"):
                result["csv"] = excel_export.export_csv(db, settings.csv_path)
            if fmt in ("all", "json"):
                result["json"] = excel_export.export_json(db, settings.json_path)
        finally:
            db.close()
        return {"ok": True, "exported": result}

    @app.get("/api/download/{fmt}")
    async def download(fmt: str) -> Any:
        mapping = {
            "xlsx": (settings.xlsx_path,
                     "application/vnd.openxmlformats-officedocument."
                     "spreadsheetml.sheet"),
            "csv": (settings.csv_path, "text/csv"),
            "json": (settings.json_path, "application/json"),
        }
        if fmt not in mapping:
            return JSONResponse({"ok": False, "error": "formato inválido"}, 400)
        path, media = mapping[fmt]
        if not path.exists():
            return JSONResponse({"ok": False, "error": "arquivo ainda não gerado"}, 404)
        return FileResponse(path, media_type=media, filename=path.name)

    # Arquivos estáticos adicionais (css/js), se houver.
    if STATIC_DIR.exists():
        app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

    app.state.scraper = scraper
    return app


def run(settings: Settings | None = None) -> None:
    """Sobe o servidor Uvicorn com o painel de controle."""
    import uvicorn

    settings = settings or default_settings
    app = create_app(settings)
    log.info(
        "Painel disponível em http://%s:%d", settings.web_host, settings.web_port
    )
    uvicorn.run(app, host=settings.web_host, port=settings.web_port,
                log_level=settings.log_level.lower())
