"""
details.py
==========

Coleta e montagem do registro completo de uma OSC.

Dado um ``id_osc``, dispara em paralelo as chamadas aos vários endpoints de
detalhe da API (dados gerais, certificações, vínculos de trabalho, áreas de
atuação, projetos e descrição) e consolida tudo em um único objeto ``OSC``,
usando o ``parser``. Falhas em sub-recursos não abortam a coleta do registro:
o campo correspondente simplesmente fica vazio (robustez).
"""

from __future__ import annotations

import asyncio
from typing import Any

from api_client import APIClient
from config import Settings
from logger import get_logger
from models import OSC, OSCStub
import parser

log = get_logger("details")


class DetailFetcher:
    """Reúne todos os detalhes públicos de uma OSC a partir da API."""

    def __init__(self, client: APIClient, settings: Settings) -> None:
        self.client = client
        self.s = settings

    async def fetch(self, stub: OSCStub) -> OSC:
        """Coleta o registro completo da OSC identificada por ``stub``."""
        _id = stub.id_osc
        s = self.s

        async def safe(coro_url: str, label: str) -> Any:
            try:
                return await self.client.get_json(coro_url)
            except Exception as exc:  # noqa: BLE001 - resiliência por sub-recurso
                log.debug("Sub-recurso '%s' falhou p/ id=%s: %s", label, _id, exc)
                return None

        # Dispara todas as chamadas concorrentemente.
        dados_gerais, certificados, rel_trab, areas, projetos, descricao = (
            await asyncio.gather(
                safe(s.endpoint(s.ep_dados_gerais, id=_id), "dados_gerais"),
                safe(s.endpoint(s.ep_certificados, id=_id), "certificados"),
                safe(s.endpoint(s.ep_rel_trabalho, id=_id), "rel_trabalho"),
                safe(s.endpoint(s.ep_areas_atuacao, id=_id), "areas_atuacao"),
                safe(s.endpoint(s.ep_projetos, id=_id), "projetos"),
                safe(s.endpoint(s.ep_descricao, id=_id), "descricao"),
            )
        )

        # Monta o registro principal.
        if dados_gerais is not None:
            osc = parser.parse_dados_gerais(dados_gerais)
        else:
            osc = stub.to_osc()

        # Garante o id e preenche lacunas com o stub da enumeração.
        osc.id_osc = _id
        osc.merge(stub.to_osc())

        # Consolida sub-recursos.
        if areas is not None:
            parser.apply_areas(osc, areas)
        if certificados is not None:
            parser.apply_certificacoes(osc, certificados)
        if rel_trab is not None:
            parser.apply_rel_trabalho(osc, rel_trab)
        if projetos is not None:
            parser.apply_projetos(osc, projetos)
        if descricao is not None:
            parser.apply_descricao(osc, descricao)

        # Rastreabilidade: guarda os payloads brutos agregados.
        osc.dumps_raw(
            {
                "dados_gerais": dados_gerais,
                "certificados": certificados,
                "rel_trabalho": rel_trab,
                "areas_atuacao": areas,
                "projetos": projetos,
                "descricao": descricao,
            }
        )
        osc.fonte = "api"
        return osc
