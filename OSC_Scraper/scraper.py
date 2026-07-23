"""
scraper.py
==========

Orquestrador principal da coleta.

Arquitetura produtor/consumidor assíncrona:

  * **Enumerador (produtor)** — percorre a busca avançada da API, particionada
    por UF (ou por filtro único definido pelo usuário), paginando com
    ``limit``/``offset``. Cada resultado vira um ``OSCStub`` e é enfileirado.
    O cursor de cada partição é salvo no SQLite a cada página (resume).

  * **Workers (consumidores)** — um pool de N corrotinas consome os stubs,
    coleta os detalhes completos (``details.DetailFetcher``) e salva cada OSC
    imediatamente no banco (salvamento incremental).

Controle de execução (usado pela interface web): iniciar, pausar, continuar e
parar. O estado e as estatísticas (encontradas, processadas, %, velocidade,
tempo restante) são expostos via ``snapshot()``.

Se o programa for encerrado a qualquer momento, a re-execução continua
exatamente do último registro: OSCs já salvas são puladas e as partições
concluídas não são reprocessadas.
"""

from __future__ import annotations

import asyncio
import json
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from api_client import APIClient
from config import Settings, UFS, settings as default_settings
from database import Database
from details import DetailFetcher
from logger import get_logger
from models import OSCStub
import parser
from utils import format_duration

log = get_logger("scraper")


class State(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPING = "stopping"
    STOPPED = "stopped"
    DONE = "done"
    ERROR = "error"


@dataclass
class Stats:
    found: int = 0            # stubs enfileirados (encontrados)
    processed: int = 0        # OSCs coletadas com sucesso
    errors: int = 0
    skipped: int = 0          # já existiam no banco (resume)
    partitions_total: int = 0
    partitions_done: int = 0
    started_at: float = 0.0
    current_partition: str = ""
    last_osc: str = ""
    state: State = State.IDLE
    message: str = ""

    def snapshot(self) -> dict[str, Any]:
        elapsed = (time.monotonic() - self.started_at) if self.started_at else 0.0
        speed = (self.processed / elapsed * 60.0) if elapsed > 0 else 0.0  # osc/min
        remaining = max(self.found - self.processed, 0)
        eta = (remaining / (speed / 60.0)) if speed > 0 else 0.0
        pct = (self.processed / self.found * 100.0) if self.found else 0.0
        return {
            "state": self.state.value,
            "found": self.found,
            "processed": self.processed,
            "errors": self.errors,
            "skipped": self.skipped,
            "percent": round(pct, 2),
            "speed_per_min": round(speed, 1),
            "elapsed": format_duration(elapsed),
            "elapsed_seconds": round(elapsed, 1),
            "eta": format_duration(eta) if speed > 0 else "—",
            "partitions_total": self.partitions_total,
            "partitions_done": self.partitions_done,
            "current_partition": self.current_partition,
            "last_osc": self.last_osc,
            "message": self.message,
        }


class Scraper:
    """Controlador de alto nível do processo de coleta."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.s = settings or default_settings
        self.db = Database(self.s.db_path)
        self.stats = Stats()
        # Eventos de controle.
        self._pause = asyncio.Event()
        self._pause.set()               # começa "não pausado"
        self._stop = asyncio.Event()
        self._task: asyncio.Task[None] | None = None
        self._processed_ids: set[int] = set()

    # ------------------------------------------------------------- controle
    def is_active(self) -> bool:
        return self.stats.state in (State.RUNNING, State.PAUSED, State.STOPPING)

    def start(self) -> bool:
        """Inicia a coleta em background (idempotente enquanto ativa)."""
        if self.is_active():
            return False
        self._stop.clear()
        self._pause.set()
        self.stats = Stats(state=State.RUNNING, started_at=time.monotonic())
        self._task = asyncio.ensure_future(self._run_guarded())
        return True

    def pause(self) -> None:
        if self.stats.state == State.RUNNING:
            self._pause.clear()
            self.stats.state = State.PAUSED
            log.info("Coleta pausada.")

    def resume(self) -> None:
        if self.stats.state == State.PAUSED:
            self._pause.set()
            self.stats.state = State.RUNNING
            log.info("Coleta retomada.")

    def stop(self) -> None:
        if self.is_active():
            self.stats.state = State.STOPPING
            self._stop.set()
            self._pause.set()  # libera quem estava pausado para poder encerrar
            log.info("Encerrando coleta a pedido do usuário…")

    async def wait(self) -> None:
        if self._task is not None:
            await self._task

    def snapshot(self) -> dict[str, Any]:
        snap = self.stats.snapshot()
        snap.update(self.db.stats())
        return snap

    # ------------------------------------------------------------- execução
    async def _run_guarded(self) -> None:
        try:
            await self._run()
        except asyncio.CancelledError:
            self.stats.state = State.STOPPED
            raise
        except Exception as exc:  # noqa: BLE001
            log.exception("Erro fatal na coleta: %s", exc)
            self.stats.state = State.ERROR
            self.stats.message = str(exc)

    async def _run(self) -> None:
        self._processed_ids = self.db.processed_ids()
        self.stats.skipped = len(self._processed_ids)
        log.info("Retomando: %d OSCs já no banco.", self.stats.skipped)

        async with APIClient(self.s) as client:
            await self._ensure_api_base(client)
            fetcher = DetailFetcher(client, self.s)

            queue: asyncio.Queue[OSCStub | None] = asyncio.Queue(
                maxsize=self.s.concurrency * 4
            )

            workers = [
                asyncio.ensure_future(self._worker(queue, fetcher, i))
                for i in range(self.s.concurrency)
            ]
            producer = asyncio.ensure_future(self._enumerate(client, queue))

            await producer
            # Sinaliza fim para os workers.
            for _ in workers:
                await queue.put(None)
            await asyncio.gather(*workers, return_exceptions=True)

        if self.stats.state == State.STOPPING:
            self.stats.state = State.STOPPED
            self.stats.message = "Coleta interrompida pelo usuário."
        elif self.stats.state != State.ERROR:
            self.stats.state = State.DONE
            self.stats.message = "Coleta concluída."
        log.info(
            "Fim da coleta. Processadas=%d Erros=%d Total no banco=%d",
            self.stats.processed, self.stats.errors, self.db.count(),
        )

    async def _ensure_api_base(self, client: APIClient) -> None:
        """Descobre/valida a base da API (auto-discovery opcional via navegador)."""
        if self.s.auto_discover:
            try:
                from browser import discover_api  # import tardio (opcional)

                discovered = await discover_api(self.s)
                if discovered:
                    self.s.api_base = discovered
                    log.info("Base da API descoberta via navegador: %s", discovered)
                    return
            except Exception as exc:  # noqa: BLE001
                log.warning("Auto-discovery falhou (%s). Usando base padrão.", exc)

        base = await client.probe_base(list(self.s.api_base_fallbacks))
        if base:
            self.s.api_base = base
        else:
            log.warning(
                "Nenhuma base de API respondeu (site pode estar bloqueado nesta "
                "rede). Prosseguindo com a base configurada: %s", self.s.api_base
            )

    # ------------------------------------------------------------ enumeração
    def _partition_keys(self) -> list[str]:
        strat = self.s.partition_strategy
        if strat == "single":
            return ["single:0"]
        if strat == "municipio":
            municipios = self._load_municipios()
            if municipios:
                return [f"mun:{c}" for c in municipios]
            log.warning("Lista de municípios ausente; caindo para partição por UF.")
        # padrão: por UF
        return [f"uf:{cod}" for cod in UFS]

    def _partition_filters(self, chave: str) -> dict[str, Any]:
        """Monta o objeto ``dadosGerais`` de filtro para a partição."""
        dados: dict[str, Any] = dict(self.s.user_filters)
        tipo, _, valor = chave.partition(":")
        if tipo == "uf" and valor != "0":
            dados["cd_uf"] = int(valor)
        elif tipo == "mun" and valor != "0":
            dados["cd_municipio"] = int(valor)
        return dados

    def _load_municipios(self) -> list[int]:
        path = self.s.cache_dir.parent / "municipios_ibge.json"
        if path.exists():
            try:
                return list(json.loads(path.read_text(encoding="utf-8")))
            except (ValueError, OSError):
                return []
        return []

    async def _enumerate(
        self, client: APIClient, queue: "asyncio.Queue[OSCStub | None]"
    ) -> None:
        keys = self._partition_keys()
        pending = self.db.pending_partitions(keys)
        self.stats.partitions_total = len(keys)
        self.stats.partitions_done = len(keys) - len(pending)
        log.info(
            "Enumeração: %d partições (%d pendentes).",
            len(keys), len(pending),
        )

        for chave in pending:
            if self._stop.is_set():
                break
            self.stats.current_partition = chave
            await self._enumerate_partition(client, queue, chave)
            self.stats.partitions_done += 1

    async def _enumerate_partition(
        self, client: APIClient, queue: "asyncio.Queue[OSCStub | None]", chave: str
    ) -> None:
        cursor = self.db.get_partition(chave)
        offset = int(cursor["offset"])
        total_visto = int(cursor["total_visto"])
        limit = self.s.page_size
        dados_filtro = self._partition_filters(chave)
        pages = 0

        while not self._stop.is_set():
            await self._pause.wait()
            payload = await self._search_page(client, limit, offset, dados_filtro)
            stubs = list(parser.iter_stubs(payload))
            if not stubs:
                self.db.save_partition(chave, offset, True, total_visto)
                log.info("Partição %s concluída (%d itens).", chave, total_visto)
                return

            for stub in stubs:
                if stub.id_osc in self._processed_ids:
                    continue
                self._processed_ids.add(stub.id_osc)
                self.stats.found += 1
                await queue.put(stub)

            total_visto += len(stubs)
            offset += limit
            pages += 1
            self.db.save_partition(chave, offset, False, total_visto)

            if len(stubs) < limit:
                self.db.save_partition(chave, offset, True, total_visto)
                log.info("Partição %s concluída (%d itens).", chave, total_visto)
                return
            if pages >= self.s.max_pages_per_partition:
                log.warning("Partição %s atingiu o limite de páginas.", chave)
                self.db.save_partition(chave, offset, True, total_visto)
                return

    async def _search_page(
        self, client: APIClient, limit: int, offset: int, dados_filtro: dict[str, Any]
    ) -> Any:
        """Executa uma página da busca avançada, tolerando variações de formato."""
        avancado = {"dadosGerais": dados_filtro} if dados_filtro else {"dadosGerais": {}}
        avancado_json = json.dumps(avancado, ensure_ascii=False)
        url = self.s.endpoint(
            self.s.ep_busca, tipo=self.s.busca_tipo, limit=limit, offset=offset
        )
        # 1) POST form com os campos 'avancado' e 'busca' (cobre variações).
        try:
            payload = await client.post_json(
                url, data={"avancado": avancado_json, "busca": avancado_json}
            )
            if payload not in (None, [], {}):
                return payload
        except Exception as exc:  # noqa: BLE001
            log.debug("POST busca falhou (%s). Tentando GET.", exc)
        # 2) GET com query ?avancado=
        try:
            from urllib.parse import quote

            get_url = f"{url}?avancado={quote(avancado_json)}"
            return await client.get_json(get_url)
        except Exception as exc:  # noqa: BLE001
            log.debug("GET busca falhou (%s).", exc)
            return None

    # --------------------------------------------------------------- workers
    async def _worker(
        self, queue: "asyncio.Queue[OSCStub | None]", fetcher: DetailFetcher, wid: int
    ) -> None:
        while True:
            stub = await queue.get()
            try:
                if stub is None:
                    return
                if self._stop.is_set():
                    continue  # drena a fila sem processar
                await self._pause.wait()
                await self._process_one(stub, fetcher)
            finally:
                queue.task_done()

    async def _process_one(self, stub: OSCStub, fetcher: DetailFetcher) -> None:
        try:
            osc = await fetcher.fetch(stub)
            self.db.upsert_osc(osc)
            self.stats.processed += 1
            self.stats.last_osc = osc.nome or (osc.cnpj or str(osc.id_osc))
            if self.stats.processed % 25 == 0:
                log.info(
                    "%d coletadas | última: %s | %s",
                    self.stats.processed, self.stats.last_osc,
                    self.stats.current_partition,
                )
            if self.s.rate_limit_delay:
                await asyncio.sleep(self.s.rate_limit_delay)
        except Exception as exc:  # noqa: BLE001
            self.stats.errors += 1
            log.warning("Falha ao coletar id=%s: %s", stub.id_osc, exc)
