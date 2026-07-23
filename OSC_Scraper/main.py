#!/usr/bin/env python3
"""
main.py
=======

Ponto de entrada do OSC Scraper.

Modos de uso:

  # 1) Interface web (padrão) — abre o painel de controle em http://127.0.0.1:8000
  python main.py

  # 2) Coleta headless via linha de comando (sem interface)
  python main.py --cli

  # 3) Coleta apenas de uma UF, com concorrência maior
  python main.py --cli --uf SP --concurrency 12

  # 4) Coleta usando o navegador (fallback Playwright)
  python main.py --cli --browser

  # 5) Apenas exportar o que já foi coletado
  python main.py --export all

Opções principais (todas têm defaults sensatos em config.py):
  --cli                Executa a coleta no terminal (sem servidor web).
  --browser            Usa o motor Playwright (navegador) em vez da API direta.
  --uf SIGLA           Restringe a coleta a uma UF (ex.: SP, RJ, MG).
  --municipio COD      Restringe a um município (código IBGE de 7 dígitos).
  --concurrency N      Número de coletas de detalhe em paralelo.
  --page-size N        Tamanho da página de enumeração.
  --auto-discover      Descobre a base da API abrindo o site no navegador.
  --export FMT         Gera arquivos (all|xlsx|csv|json) e encerra.
  --host / --port      Endereço do painel web.
"""

from __future__ import annotations

import argparse
import asyncio
import sys

from config import UFS, settings
from logger import get_logger, setup_logging

log = get_logger("main")

_UF_SIGLA_TO_COD = {sigla: cod for cod, sigla in UFS.items()}


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="OSC Scraper — coleta de dados públicos do Mapa das OSCs (IPEA)."
    )
    p.add_argument("--cli", action="store_true", help="Executa no terminal (headless).")
    p.add_argument("--browser", action="store_true",
                   help="Usa o motor Playwright (navegador).")
    p.add_argument("--uf", type=str, default=None,
                   help="Restringe a coleta a uma UF (sigla, ex.: SP).")
    p.add_argument("--municipio", type=int, default=None,
                   help="Restringe a um município (código IBGE).")
    p.add_argument("--concurrency", type=int, default=None,
                   help="Coletas de detalhe em paralelo.")
    p.add_argument("--page-size", type=int, default=None,
                   help="Tamanho da página de enumeração.")
    p.add_argument("--auto-discover", action="store_true",
                   help="Descobre a base da API via navegador.")
    p.add_argument("--no-cache", action="store_true",
                   help="Desabilita o cache de respostas em disco.")
    p.add_argument("--export", type=str, default=None,
                   choices=["all", "xlsx", "csv", "json"],
                   help="Apenas exporta o que já foi coletado e encerra.")
    p.add_argument("--host", type=str, default=None, help="Host do painel web.")
    p.add_argument("--port", type=int, default=None, help="Porta do painel web.")
    return p


def apply_args(args: argparse.Namespace) -> None:
    """Aplica os argumentos de CLI sobre as configurações globais."""
    if args.concurrency:
        settings.concurrency = args.concurrency
    if args.page_size:
        settings.page_size = args.page_size
    if args.auto_discover:
        settings.auto_discover = True
    if args.no_cache:
        settings.use_cache = False
    if args.host:
        settings.web_host = args.host
    if args.port:
        settings.web_port = args.port

    if args.municipio:
        settings.partition_strategy = "single"
        settings.user_filters["cd_municipio"] = args.municipio
    elif args.uf:
        sigla = args.uf.strip().upper()
        cod = _UF_SIGLA_TO_COD.get(sigla)
        if cod is None:
            log.error("UF inválida: %s. Válidas: %s", sigla,
                      ", ".join(sorted(_UF_SIGLA_TO_COD)))
            sys.exit(2)
        settings.partition_strategy = "single"
        settings.user_filters["cd_uf"] = cod


async def run_cli(use_browser: bool) -> None:
    """Executa a coleta no terminal até a conclusão."""
    from database import Database
    from excel import export_all

    if use_browser:
        from browser import BrowserScraper

        db = Database(settings.db_path)
        try:
            scraper = BrowserScraper(
                settings, db,
                on_progress=lambda nome, n: log.info("%d coletadas | %s", n, nome),
            )
            total = await scraper.run()
            log.info("Coleta (navegador) concluída: %d OSCs.", total)
        finally:
            db.close()
    else:
        from scraper import Scraper

        scraper = Scraper(settings)
        scraper.start()
        # Loop de acompanhamento no terminal.
        while scraper.is_active():
            await asyncio.sleep(5)
            snap = scraper.snapshot()
            log.info(
                "[%s] proc=%d/%d (%.1f%%) | %s/min | ETA %s | %s",
                snap["state"], snap["processed"], snap["found"],
                snap["percent"], snap["speed_per_min"], snap["eta"],
                snap["current_partition"],
            )
        await scraper.wait()

    log.info("Gerando arquivos de saída…")
    counts = export_all(settings)
    log.info("Exportado: %s", counts)


def main() -> None:
    setup_logging()
    args = build_parser().parse_args()
    apply_args(args)

    if args.export:
        from excel import export_all

        log.info("Exportando dados já coletados (%s)…", args.export)
        if args.export == "all":
            print(export_all(settings))
        else:
            from database import Database
            import excel as ex

            db = Database(settings.db_path)
            try:
                fn = {"xlsx": ex.export_excel, "csv": ex.export_csv,
                      "json": ex.export_json}[args.export]
                path = {"xlsx": settings.xlsx_path, "csv": settings.csv_path,
                        "json": settings.json_path}[args.export]
                print(f"{args.export}: {fn(db, path)} registros")
            finally:
                db.close()
        return

    if args.cli or args.browser:
        try:
            asyncio.run(run_cli(use_browser=args.browser))
        except KeyboardInterrupt:
            log.warning("Interrompido pelo usuário (Ctrl+C). Dados preservados.")
        return

    # Modo padrão: interface web.
    from webapp import run as run_web

    run_web(settings)


if __name__ == "__main__":
    main()
