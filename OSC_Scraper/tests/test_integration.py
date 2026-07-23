"""
Teste de integração offline do orquestrador (scraper).

Como o site do IPEA é inacessível a partir do ambiente de testes, substituímos
a camada de rede (``APIClient``) por um duplo que devolve respostas canônicas.
Isso exercita, de ponta a ponta e sem rede, toda a orquestração assíncrona:
enumeração paginada, pool de workers, salvamento incremental, resume a partir
do banco e o encerramento limpo.
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config import Settings  # noqa: E402
import scraper as scraper_mod  # noqa: E402
from scraper import Scraper, State  # noqa: E402


class FakeAPIClient:
    """Duplo de APIClient: enumera 3 UFs com alguns registros cada."""

    # Quantidade de OSCs por UF (código IBGE -> total).
    UF_TOTAIS = {11: 5, 12: 3, 13: 0}

    def __init__(self, settings):
        self.s = settings

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return None

    async def open(self):
        pass

    async def close(self):
        pass

    async def probe_base(self, bases, test_id=1):
        return bases[0] if bases else None

    def _uf_from_filtro(self, data):
        import json
        avancado = json.loads(data["avancado"])
        return int(avancado["dadosGerais"].get("cd_uf", 0))

    async def post_json(self, url, *, data=None, json_body=None, use_cache=True):
        # url: .../osc/busca_avancada/lista/{limit}/{offset}
        parts = url.rstrip("/").split("/")
        offset = int(parts[-1])
        limit = int(parts[-2])
        cod_uf = self._uf_from_filtro(data)
        total = self.UF_TOTAIS.get(cod_uf, 0)
        page = []
        for i in range(offset, min(offset + limit, total)):
            oid = cod_uf * 1000 + i
            page.append({
                "id_osc": oid,
                "tx_nome_osc": f"OSC {oid}",
                "cd_identificador_osc": str(oid).zfill(14),
            })
        return page

    async def get_json(self, url, *, use_cache=True):
        # Detalhe: extrai o id do fim da URL.
        oid = int(url.rstrip("/").split("/")[-1])
        if "dados_gerais" in url:
            return {
                "id_osc": oid,
                "cd_identificador_osc": str(oid).zfill(14),
                "tx_nome_osc": f"OSC {oid}",
                "tx_razao_social_osc": f"Razão Social {oid}",
                "tx_nome_municipio": "Cidade Teste",
                "tx_sigla_uf": "DF",
                "tx_email": f"osc{oid}@exemplo.org",
            }
        return []


def _make_settings(tmp_path) -> Settings:
    s = Settings()
    s.db_path = tmp_path / "osc.sqlite"
    s.cache_dir = tmp_path / "cache"
    s.use_cache = False
    s.partition_strategy = "uf"
    s.page_size = 2          # força múltiplas páginas por UF
    s.concurrency = 3
    s.rate_limit_delay = 0
    s.auto_discover = False
    return s


def test_full_crawl_offline(tmp_path, monkeypatch):
    # Restringe as UFs do crawl às três do duplo.
    monkeypatch.setattr(scraper_mod, "UFS", {11: "RO", 12: "AC", 13: "AM"})
    monkeypatch.setattr(scraper_mod, "APIClient", FakeAPIClient)

    s = _make_settings(tmp_path)
    sc = Scraper(s)

    async def drive():
        sc.start()
        await sc.wait()

    asyncio.run(drive())

    snap = sc.snapshot()
    assert snap["state"] == State.DONE.value
    # 5 + 3 + 0 = 8 OSCs
    assert sc.db.count() == 8
    assert snap["processed"] == 8
    assert snap["partitions_done"] == 3

    # Verifica um registro coletado
    ids = sc.db.processed_ids()
    assert 11000 in ids and 12000 in ids
    sc.db.close()


def test_resume_skips_processed(tmp_path, monkeypatch):
    """Segunda execução não reprocessa: partições concluídas são puladas."""
    monkeypatch.setattr(scraper_mod, "UFS", {11: "RO", 12: "AC", 13: "AM"})
    monkeypatch.setattr(scraper_mod, "APIClient", FakeAPIClient)

    s = _make_settings(tmp_path)

    async def run_once():
        sc = Scraper(s)
        sc.start()
        await sc.wait()
        return sc

    sc1 = asyncio.run(run_once())
    assert sc1.db.count() == 8
    sc1.db.close()

    # Reexecuta: tudo já está no banco e as partições concluídas.
    sc2 = asyncio.run(run_once())
    snap = sc2.snapshot()
    assert sc2.db.count() == 8            # nada duplicado
    assert snap["processed"] == 0         # nenhum novo processamento
    assert snap["skipped"] == 8           # todos pulados
    sc2.db.close()


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
