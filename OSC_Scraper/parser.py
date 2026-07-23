"""
parser.py
=========

Normalização dos dados brutos da API para o modelo canônico ``OSC``.

A extração é resiliente: cada campo canônico é procurado por uma lista de
possíveis chaves de origem (``config.FIELD_ALIASES``), tolerando variações
entre versões da API. Sub-recursos (certificações, vínculos de trabalho, áreas
de atuação, participação social, descrição) são consolidados no mesmo registro.

Regras de negócio implementadas:
  * CNPJ e CEP são formatados.
  * Telefone móvel (11 dígitos, 9º dígito) é tratado como celular/WhatsApp.
  * Certificações são varridas para inferir OSCIP, CEBAS e Utilidade Pública.
  * Redes sociais e e-mail são extraídos de campos de texto livre.
"""

from __future__ import annotations

from typing import Any, Iterable

from config import FIELD_ALIASES
from models import OSC, OSCStub
from utils import (
    clean_text,
    detect_social_links,
    extract,
    extract_email,
    format_cep,
    format_cnpj,
    is_mobile_phone,
    only_digits,
)


def _f(data: Any, canonical: str) -> str:
    """Extrai e limpa um campo canônico a partir dos aliases configurados."""
    aliases = FIELD_ALIASES.get(canonical, [canonical])
    return clean_text(extract(data, aliases, ""))


# ---------------------------------------------------------------------------
# Enumeração (lista de resultados) -> OSCStub
# ---------------------------------------------------------------------------
def parse_stub(item: dict[str, Any]) -> OSCStub | None:
    """Converte um item da busca (type_result=lista) em OSCStub."""
    raw_id = extract(item, FIELD_ALIASES["id_osc"], None)
    if raw_id in (None, ""):
        return None
    try:
        id_osc = int(raw_id)
    except (TypeError, ValueError):
        return None
    return OSCStub(
        id_osc=id_osc,
        nome=_f(item, "nome"),
        cnpj=format_cnpj(extract(item, FIELD_ALIASES["cnpj"], "")),
        natureza_juridica=_f(item, "natureza_juridica"),
        endereco=clean_text(extract(item, ["tx_endereco_osc", "tx_endereco"], "")),
        area_atuacao=_f(item, "area_atuacao"),
    )


def iter_stubs(payload: Any) -> Iterable[OSCStub]:
    """Extrai OSCStubs de um payload de busca (lista, ou dict com 'data')."""
    items = _as_list(payload)
    for item in items:
        if isinstance(item, dict):
            stub = parse_stub(item)
            if stub is not None:
                yield stub
        elif isinstance(item, (list, tuple)) and item:
            # Formato geo: [id_osc, lat, lng]
            try:
                yield OSCStub(id_osc=int(item[0]))
            except (TypeError, ValueError):
                continue


def _as_list(payload: Any) -> list[Any]:
    if payload is None:
        return []
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("data", "resultado", "oscs", "results", "rows", "items"):
            if key in payload and isinstance(payload[key], list):
                return payload[key]
        # dict de um único registro
        return [payload]
    return []


# ---------------------------------------------------------------------------
# Detalhe (dados_gerais) -> OSC
# ---------------------------------------------------------------------------
def parse_dados_gerais(data: Any) -> OSC:
    """Constrói o OSC a partir do endpoint /osc/dados_gerais/{id}."""
    node = _first_record(data)
    osc = OSC()
    osc.id_osc = _to_int(extract(node, FIELD_ALIASES["id_osc"], None))
    osc.nome = _f(node, "nome")
    osc.razao_social = _f(node, "razao_social")
    osc.nome_fantasia = _f(node, "nome_fantasia")
    if not osc.nome:
        osc.nome = osc.razao_social or osc.nome_fantasia
    osc.cnpj = format_cnpj(extract(node, FIELD_ALIASES["cnpj"], ""))
    osc.situacao = _f(node, "situacao")
    osc.natureza_juridica = _f(node, "natureza_juridica")

    # Endereço
    osc.endereco = _f(node, "endereco")
    osc.numero = clean_text(extract(node, FIELD_ALIASES["numero"], ""))
    osc.complemento = _f(node, "complemento")
    osc.bairro = _f(node, "bairro")
    osc.cidade = _f(node, "cidade")
    osc.uf = _f(node, "uf")
    osc.estado = _f(node, "estado")
    osc.cep = format_cep(extract(node, FIELD_ALIASES["cep"], ""))
    osc.codigo_municipio_ibge = clean_text(
        extract(node, FIELD_ALIASES["codigo_municipio_ibge"], "")
    )
    osc.latitude = clean_text(extract(node, FIELD_ALIASES["latitude"], ""))
    osc.longitude = clean_text(extract(node, FIELD_ALIASES["longitude"], ""))

    # Atuação
    osc.area_atuacao = _f(node, "area_atuacao")
    osc.atividade_economica = _f(node, "atividade_economica")
    osc.data_fundacao = clean_text(extract(node, FIELD_ALIASES["data_fundacao"], ""))
    osc.data_cadastro_cnpj = clean_text(
        extract(node, FIELD_ALIASES["data_cadastro_cnpj"], "")
    )
    osc.responsavel = _f(node, "responsavel")

    # Contato
    telefone = clean_text(extract(node, FIELD_ALIASES["telefone"], ""))
    osc.telefone = telefone
    if is_mobile_phone(telefone):
        osc.celular = telefone
        osc.whatsapp = telefone
    osc.email = clean_text(extract(node, FIELD_ALIASES["email"], "")) or extract_email(
        _f(node, "resumo")
    )
    osc.site = clean_text(extract(node, FIELD_ALIASES["site"], ""))

    # Descrição / complementos
    osc.resumo = _f(node, "resumo")
    osc.situacao_imovel = _f(node, "situacao_imovel")

    # Redes sociais a partir de texto livre (site/resumo)
    _apply_social(osc, osc.site, osc.resumo)

    return osc


# ---------------------------------------------------------------------------
# Sub-recursos
# ---------------------------------------------------------------------------
def apply_areas(osc: OSC, data: Any) -> None:
    """Consolida áreas/subáreas de atuação em uma string legível."""
    nomes = _collect_names(
        data,
        ["tx_nome_area_atuacao", "tx_area_atuacao", "nome_area_atuacao",
         "tx_nome_subarea_atuacao", "area_atuacao", "tx_nome"],
    )
    if nomes:
        combinado = "; ".join(nomes)
        osc.area_atuacao = (
            combinado if not osc.area_atuacao
            else f"{osc.area_atuacao}; {combinado}"
        )
        # Deduplica preservando ordem.
        partes = [p.strip() for p in osc.area_atuacao.split(";") if p.strip()]
        osc.area_atuacao = "; ".join(dict.fromkeys(partes))


def apply_certificacoes(osc: OSC, data: Any) -> None:
    """Consolida certificações e infere OSCIP, CEBAS e Utilidade Pública."""
    registros = _as_list(data)
    nomes: list[str] = []
    for reg in registros:
        if not isinstance(reg, dict):
            continue
        nome = clean_text(
            extract(reg, ["tx_nome_certificado", "tx_certificado",
                          "nome_certificado", "tx_nome", "certificado"], "")
        )
        codigo = clean_text(
            extract(reg, ["cd_certificado", "tx_codigo_certificado",
                          "nr_certificado", "codigo"], "")
        )
        etiqueta = " ".join(p for p in (nome, codigo) if p)
        if etiqueta:
            nomes.append(etiqueta)
        low = f"{nome} {codigo}".lower()
        if "oscip" in low:
            osc.oscip = "Sim"
        if "cebas" in low or "beneficente" in low:
            osc.cebas = "Sim"
        if "utilidade" in low:  # utilidade pública (federal/estadual/municipal)
            osc.utilidade_publica = "Sim"
    if nomes:
        osc.certificacoes = "; ".join(dict.fromkeys(nomes))


def apply_rel_trabalho(osc: OSC, data: Any) -> None:
    """Extrai número de funcionários e de voluntários dos vínculos de trabalho."""
    node = _first_record(data)
    func = extract(
        node,
        ["nr_trabalhadores", "qt_trabalhadores", "num_funcionarios",
         "nr_funcionarios", "qt_vinculos_clt", "nr_pessoal_ocupado_total",
         "quantidade_trabalhadores"],
        "",
    )
    vol = extract(
        node,
        ["nr_voluntarios", "qt_voluntarios", "num_voluntarios",
         "quantidade_voluntarios", "nr_pessoal_voluntario"],
        "",
    )
    if func not in (None, ""):
        osc.num_funcionarios = clean_text(func)
    if vol not in (None, ""):
        osc.num_voluntarios = clean_text(vol)


def apply_projetos(osc: OSC, data: Any) -> None:
    """Resume os projetos/convênios encontrados."""
    registros = _as_list(data)
    nomes: list[str] = []
    for reg in registros:
        if not isinstance(reg, dict):
            continue
        nome = clean_text(
            extract(reg, ["tx_nome_projeto", "tx_projeto", "nome_projeto",
                          "tx_nome", "tx_descricao_projeto"], "")
        )
        if nome:
            nomes.append(nome)
    if nomes:
        osc.convenios = "; ".join(dict.fromkeys(nomes))[:2000]


def apply_descricao(osc: OSC, data: Any) -> None:
    """Adiciona missão/visão/histórico às observações e busca redes/e-mail."""
    node = _first_record(data)
    partes: list[str] = []
    for key, rotulo in (
        ("tx_missao_osc", "Missão"),
        ("tx_visao_osc", "Visão"),
        ("tx_finalidades_estatutarias", "Finalidades"),
        ("tx_historico", "Histórico"),
    ):
        val = clean_text(extract(node, [key], ""))
        if val:
            partes.append(f"{rotulo}: {val}")
    texto = " | ".join(partes)
    if texto:
        osc.observacoes = (
            texto if not osc.observacoes else f"{osc.observacoes} | {texto}"
        )
    _apply_social(osc, texto)
    if not osc.email:
        osc.email = extract_email(texto)


def _apply_social(osc: OSC, *texts: str) -> None:
    links = detect_social_links(*texts)
    for network in ("facebook", "instagram", "linkedin", "youtube", "whatsapp"):
        if links.get(network) and not getattr(osc, network, ""):
            setattr(osc, network, links[network])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _first_record(data: Any) -> Any:
    """Retorna o primeiro dict útil de um payload (lista, dict ou dict/data)."""
    if isinstance(data, dict):
        for key in ("data", "resultado", "osc", "result"):
            inner = data.get(key)
            if isinstance(inner, dict):
                return inner
            if isinstance(inner, list) and inner and isinstance(inner[0], dict):
                return inner[0]
        return data
    if isinstance(data, list) and data and isinstance(data[0], dict):
        return data[0]
    return {} if data is None else data


def _collect_names(data: Any, keys: list[str]) -> list[str]:
    nomes: list[str] = []
    for reg in _as_list(data):
        if isinstance(reg, dict):
            for k in keys:
                val = clean_text(reg.get(k, "")) if k in reg else ""
                if val:
                    nomes.append(val)
                    break
    return list(dict.fromkeys(nomes))


def _to_int(value: Any) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(only_digits(value) or value)
    except (TypeError, ValueError):
        return None
