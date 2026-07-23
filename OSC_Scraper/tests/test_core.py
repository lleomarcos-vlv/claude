"""
Testes básicos do OSC Scraper.

Cobrem a lógica que não depende de rede (a única limitação externa é o acesso
ao site do IPEA). Os payloads de exemplo reproduzem os nomes de campo reais da
API (colunas da view ``portal.vw_osc_dados_gerais``), validando o pipeline
completo de normalização, persistência e exportação.
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import pytest

# Garante que os módulos do projeto (layout plano) sejam importáveis.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import parser  # noqa: E402
import utils  # noqa: E402
from config import Settings  # noqa: E402
from database import Database  # noqa: E402
from excel import export_csv, export_excel, export_json  # noqa: E402
from models import OSC, OSCStub  # noqa: E402


# --------------------------------------------------------------------- utils
def test_format_cnpj():
    assert utils.format_cnpj("12345678000199") == "12.345.678/0001-99"
    assert utils.format_cnpj(12345678000199) == "12.345.678/0001-99"
    assert utils.format_cnpj("") == ""


def test_format_cep():
    assert utils.format_cep("70040010") == "70040-010"
    assert utils.format_cep("70040-010") == "70040-010"


def test_clean_text():
    assert utils.clean_text("  <b>Olá</b>\n mundo ") == "Olá mundo"
    assert utils.clean_text(None) == ""
    assert utils.clean_text("null") == ""


def test_extract_aliases():
    data = {"tx_nome_osc": "Instituto X", "nested": {"tx_email": "a@b.org"}}
    assert utils.extract(data, ["nome", "tx_nome_osc"]) == "Instituto X"
    assert utils.extract(data, ["tx_email"]) == "a@b.org"
    assert utils.extract(data, ["inexistente"], "def") == "def"


def test_detect_social_links():
    txt = "Siga em https://instagram.com/inst_x e fb.com/instx e wa.me/5561999998888"
    links = utils.detect_social_links(txt)
    assert "instagram" in links and "facebook" in links and "whatsapp" in links


def test_is_mobile_phone():
    assert utils.is_mobile_phone("61999998888") is True
    assert utils.is_mobile_phone("6133334444") is False


def test_async_retry_recovers():
    calls = {"n": 0}

    @utils.async_retry(retries=4, backoff_base=1.0, backoff_max=0.01)
    async def flaky():
        calls["n"] += 1
        if calls["n"] < 3:
            raise ValueError("falha transitória")
        return "ok"

    result = asyncio.run(flaky())
    assert result == "ok" and calls["n"] == 3


# -------------------------------------------------------- payloads de exemplo
DADOS_GERAIS = {
    "id_osc": 42,
    "cd_identificador_osc": "12345678000199",
    "tx_razao_social_osc": "Instituto Exemplo de Solidariedade",
    "tx_nome_fantasia_osc": "Instituto Exemplo",
    "tx_nome_osc": "Instituto Exemplo",
    "tx_nome_natureza_juridica_osc": "Associação Privada",
    "tx_nome_situacao_imovel_osc": "Alugado",
    "tx_endereco": "Rua das Flores",
    "nr_localizacao": "123",
    "tx_endereco_complemento": "Sala 4",
    "tx_bairro": "Centro",
    "tx_nome_municipio": "Brasília",
    "cd_municipio": "5300108",
    "tx_sigla_uf": "DF",
    "tx_nome_uf": "Distrito Federal",
    "nr_cep": "70040010",
    "geo_lat": "-15.79",
    "geo_lng": "-47.88",
    "tx_email": "contato@exemplo.org",
    "tx_site": "https://exemplo.org",
    "tx_telefone": "61999998888",
    "dt_fundacao_osc": "10-05-2001",
    "tx_nome_responsavel_legal": "Maria Silva",
    "tx_nome_atividade_economica_osc": "Assistência social",
    "tx_resumo_osc": "Atua com crianças. Instagram: instagram.com/instexemplo",
}


def test_parse_dados_gerais():
    osc = parser.parse_dados_gerais(DADOS_GERAIS)
    assert osc.id_osc == 42
    assert osc.cnpj == "12.345.678/0001-99"
    assert osc.nome == "Instituto Exemplo"
    assert osc.razao_social == "Instituto Exemplo de Solidariedade"
    assert osc.natureza_juridica == "Associação Privada"
    assert osc.cidade == "Brasília"
    assert osc.uf == "DF"
    assert osc.cep == "70040-010"
    assert osc.email == "contato@exemplo.org"
    assert osc.responsavel == "Maria Silva"
    assert osc.data_fundacao == "10-05-2001"
    # telefone móvel -> celular/whatsapp
    assert osc.celular == "61999998888"
    assert osc.whatsapp == "61999998888"
    # rede social extraída do texto livre (resumo)
    assert "instagram.com/instexemplo" in osc.instagram
    # endereço completo composto
    assert osc.endereco_completo == "Rua das Flores, 123 - Sala 4"


def test_apply_certificacoes():
    osc = OSC()
    certs = [
        {"tx_nome_certificado": "OSCIP - Organização da Sociedade Civil"},
        {"tx_nome_certificado": "CEBAS Assistência Social"},
        {"tx_nome_certificado": "Utilidade Pública Federal"},
    ]
    parser.apply_certificacoes(osc, certs)
    assert osc.oscip == "Sim"
    assert osc.cebas == "Sim"
    assert osc.utilidade_publica == "Sim"
    assert "OSCIP" in osc.certificacoes


def test_apply_rel_trabalho():
    osc = OSC()
    parser.apply_rel_trabalho(osc, {"nr_trabalhadores": 15, "nr_voluntarios": 30})
    assert osc.num_funcionarios == "15"
    assert osc.num_voluntarios == "30"


def test_iter_stubs_lista():
    payload = [
        {"id_osc": 1, "tx_nome_osc": "A", "cd_identificador_osc": "11111111000111"},
        {"id_osc": 2, "tx_nome_osc": "B", "cd_identificador_osc": "22222222000122"},
    ]
    stubs = list(parser.iter_stubs(payload))
    assert len(stubs) == 2
    assert stubs[0].id_osc == 1 and stubs[0].nome == "A"
    assert stubs[1].cnpj == "22.222.222/0001-22"


def test_iter_stubs_geo():
    payload = [[10, -15.7, -47.8], [11, -16.0, -48.0]]
    stubs = list(parser.iter_stubs(payload))
    assert [s.id_osc for s in stubs] == [10, 11]


# ------------------------------------------------------------------ database
def test_database_incremental_and_resume(tmp_path):
    db = Database(tmp_path / "t.sqlite")
    osc = parser.parse_dados_gerais(DADOS_GERAIS)
    db.upsert_osc(osc)
    assert db.count() == 1
    assert db.exists(42)
    assert 42 in db.processed_ids()

    # Upsert idempotente
    db.upsert_osc(osc)
    assert db.count() == 1

    # Partições / resume
    db.save_partition("uf:53", offset=200, concluida=False, total_visto=200)
    assert db.get_partition("uf:53")["offset"] == 200
    db.save_partition("uf:53", offset=400, concluida=True, total_visto=400)
    assert "uf:53" not in db.pending_partitions(["uf:53", "uf:35"])
    assert db.pending_partitions(["uf:53", "uf:35"]) == ["uf:35"]

    stats = db.stats()
    assert stats["total"] == 1 and stats["com_cnpj"] == 1
    db.close()


def test_merge_fills_blanks():
    a = OSC(id_osc=1, nome="")
    b = OSCStub(id_osc=1, nome="Fallback", cnpj="00.000.000/0001-00").to_osc()
    a.merge(b)
    assert a.nome == "Fallback"
    assert a.cnpj == "00.000.000/0001-00"


# -------------------------------------------------------------------- export
def test_exports(tmp_path):
    db = Database(tmp_path / "t.sqlite")
    db.upsert_osc(parser.parse_dados_gerais(DADOS_GERAIS))
    db.upsert_osc(parser.parse_dados_gerais({**DADOS_GERAIS, "id_osc": 43}))

    xlsx = tmp_path / "OSCs.xlsx"
    csv = tmp_path / "OSCs.csv"
    js = tmp_path / "OSCs.json"

    assert export_excel(db, xlsx) == 2
    assert export_csv(db, csv) == 2
    assert export_json(db, js) == 2

    assert xlsx.exists() and xlsx.stat().st_size > 0
    assert "CNPJ" in csv.read_text(encoding="utf-8-sig").splitlines()[0]
    import json as _json
    data = _json.loads(js.read_text(encoding="utf-8"))
    assert isinstance(data, list) and data[0]["cnpj"] == "12.345.678/0001-99"
    db.close()


def test_settings_endpoint_build():
    s = Settings()
    url = s.endpoint(s.ep_dados_gerais, id=7)
    assert url.endswith("/osc/dados_gerais/7")
    busca = s.endpoint(s.ep_busca, tipo="lista", limit=200, offset=0)
    assert "/osc/busca_avancada/lista/200/0" in busca


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
