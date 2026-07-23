"""
config.py
=========

Configuração central do OSC Scraper.

Toda a configuração ajustável do projeto vive aqui: endpoints da API pública do
Mapa das OSCs (IPEA), estratégia de paginação, limites de concorrência, caminhos
de saída, mapeamento de campos e seletores usados pelo modo navegador (fallback).

As configurações podem ser sobrescritas por variáveis de ambiente (prefixo
``OSC_``) e/ou por argumentos de linha de comando (ver ``main.py``).

A API do portal foi mapeada a partir do código-fonte público do projeto
(Plataformas-Cidadania / mapa-osc-api, um app Laravel). Os nomes de campo abaixo
correspondem às colunas da view materializada ``portal.vw_osc_dados_gerais`` e
aos endpoints REST em ``routes/web.php``.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any


# ---------------------------------------------------------------------------
# Caminhos base
# ---------------------------------------------------------------------------
BASE_DIR: Path = Path(__file__).resolve().parent
OUTPUT_DIR: Path = BASE_DIR / "output"
LOGS_DIR: Path = BASE_DIR / "logs"
DATA_DIR: Path = BASE_DIR / "data"
STATIC_DIR: Path = BASE_DIR / "static"

for _d in (OUTPUT_DIR, LOGS_DIR, DATA_DIR):
    _d.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Códigos de UF (IBGE) — usados para particionar o crawl completo
# ---------------------------------------------------------------------------
# O código IBGE de UF é o prefixo (2 dígitos) do código de município (7 dígitos).
UFS: dict[int, str] = {
    11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO",
    21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL",
    28: "SE", 29: "BA",
    31: "MG", 32: "ES", 33: "RJ", 35: "SP",
    41: "PR", 42: "SC", 43: "RS",
    50: "MS", 51: "MT", 52: "GO", 53: "DF",
}


def _env(name: str, default: str) -> str:
    return os.environ.get(f"OSC_{name}", default)


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(f"OSC_{name}", default))
    except (TypeError, ValueError):
        return default


def _env_bool(name: str, default: bool) -> bool:
    raw = os.environ.get(f"OSC_{name}")
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on", "sim"}


@dataclass
class Settings:
    """Configurações de execução do scraper."""

    # -- Endpoints da API ---------------------------------------------------
    # Base primária da API REST do portal. Descoberta automaticamente pelo modo
    # navegador quando ``auto_discover`` está ativo; caso contrário usa este valor.
    api_base: str = _env("API_BASE", "https://mapaosc.ipea.gov.br/api")
    # Bases alternativas conhecidas (tentadas em ordem se a primária falhar).
    #
    # A API oficial do portal (app Laravel — repositório público
    # ``Plataformas-Cidadania/mapa-osc-api``) expõe TODAS as rotas sob o único
    # prefixo ``/api``. Ex.: ``GET|POST /api/osc/busca_avancada/{tipo}/{limit}/{offset}``
    # e ``GET /api/osc/dados_gerais/{id}``. A base antiga
    # ``…/novomapaosc/api/api`` foi removida porque duplicava o segmento
    # ``api/api`` e resultava em 404 em todas as buscas (a busca não retornava
    # nenhuma OSC). A descoberta automática via navegador (``--auto-discover``)
    # continua disponível caso a implantação mude o ponto de montagem.
    api_base_fallbacks: tuple[str, ...] = (
        "https://mapaosc.ipea.gov.br/api",
    )
    site_url: str = _env("SITE_URL", "https://mapaosc.ipea.gov.br/mapa")

    # Templates de endpoint (relativos a api_base). ``{id}`` = id_osc.
    ep_busca: str = "/osc/busca_avancada/{tipo}/{limit}/{offset}"
    ep_dados_gerais: str = "/osc/dados_gerais/{id}"
    ep_cabecalho: str = "/osc/cabecalho/{id}"
    ep_descricao: str = "/osc/descricao/{id}"
    ep_areas_atuacao: str = "/osc/areas_atuacao/{id}"
    ep_certificados: str = "/osc/certificados/{id}"
    ep_rel_trabalho: str = "/osc/rel_trabalho_e_governanca/{id}"
    ep_participacao: str = "/osc/participacao_social/{id}"
    ep_projetos: str = "/osc/projetos/{id}"
    ep_popup: str = "/osc/popup/{id}"

    # -- Estratégia de enumeração ------------------------------------------
    # "uf"        -> particiona por UF (27 partições) — padrão, sem dados extras.
    # "municipio" -> particiona por município (requer lista IBGE em data/).
    # "single"    -> uma única busca com os filtros informados pelo usuário.
    partition_strategy: str = _env("PARTITION_STRATEGY", "uf")
    page_size: int = _env_int("PAGE_SIZE", 200)          # limit por página
    max_pages_per_partition: int = _env_int("MAX_PAGES", 100000)
    busca_tipo: str = _env("BUSCA_TIPO", "lista")        # lista | exportar | geo

    # Filtros opcionais definidos pelo usuário (aplicados em toda a busca).
    # Chaves seguem os nomes de coluna do banco (ex.: cd_uf, cd_municipio,
    # cd_natureza_juridica_osc, cd_situacao_cadastral, tx_razao_social_osc).
    user_filters: dict[str, Any] = field(default_factory=dict)

    # -- Concorrência / robustez -------------------------------------------
    concurrency: int = _env_int("CONCURRENCY", 8)        # detalhes em paralelo
    request_timeout: float = float(_env("TIMEOUT", "40"))
    max_retries: int = _env_int("MAX_RETRIES", 5)
    backoff_base: float = float(_env("BACKOFF_BASE", "1.5"))
    backoff_max: float = float(_env("BACKOFF_MAX", "30"))
    rate_limit_delay: float = float(_env("RATE_DELAY", "0.05"))  # entre requisições

    # -- HTTP ---------------------------------------------------------------
    user_agent: str = _env(
        "USER_AGENT",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0 Safari/537.36",
    )
    # Bundle de CA do proxy corporativo (se presente). httpx usa via verify=.
    ca_bundle: str | None = os.environ.get("OSC_CA_BUNDLE") or (
        "/root/.ccr/ca-bundle.crt"
        if Path("/root/.ccr/ca-bundle.crt").exists()
        else None
    )
    http_proxy: str | None = os.environ.get("HTTPS_PROXY") or None

    # -- Modo navegador (Playwright) ---------------------------------------
    # auto_discover: abre o site real, captura as chamadas XHR e deriva a base
    #   da API + o formato do payload em tempo de execução (mais robusto).
    auto_discover: bool = _env_bool("AUTO_DISCOVER", False)
    use_browser_fallback: bool = _env_bool("BROWSER_FALLBACK", True)
    headless: bool = _env_bool("HEADLESS", True)
    browser_channel: str = _env("BROWSER_CHANNEL", "chromium")
    # Caminho para o Chromium pré-instalado (ambientes gerenciados).
    browser_executable: str | None = os.environ.get("OSC_BROWSER_PATH") or None
    nav_timeout: float = float(_env("NAV_TIMEOUT", "60"))

    # -- Persistência / saída ----------------------------------------------
    db_path: Path = DATA_DIR / "oscs.sqlite"
    xlsx_path: Path = OUTPUT_DIR / "OSCs.xlsx"
    csv_path: Path = OUTPUT_DIR / "OSCs.csv"
    json_path: Path = OUTPUT_DIR / "OSCs.json"
    cache_dir: Path = DATA_DIR / "cache"
    use_cache: bool = _env_bool("USE_CACHE", True)

    # -- Servidor web (interface) ------------------------------------------
    web_host: str = _env("WEB_HOST", "127.0.0.1")
    web_port: int = _env_int("WEB_PORT", 8000)

    # -- Logging ------------------------------------------------------------
    log_level: str = _env("LOG_LEVEL", "INFO")

    def endpoint(self, template: str, **kwargs: Any) -> str:
        """Monta a URL absoluta de um endpoint a partir do template."""
        return self.api_base.rstrip("/") + template.format(**kwargs)

    def as_dict(self) -> dict[str, Any]:
        d = asdict(self)
        # Path/tuple não são JSON-serializáveis por padrão.
        for k, v in list(d.items()):
            if isinstance(v, Path):
                d[k] = str(v)
            elif isinstance(v, tuple):
                d[k] = list(v)
        return d


# ---------------------------------------------------------------------------
# Mapeamento de campos: schema canônico  <-  chaves da API/DB
# ---------------------------------------------------------------------------
# Para cada campo canônico listamos as possíveis chaves de origem (aliases),
# na ordem de preferência. Isso torna a extração resiliente a variações de
# nome entre versões da API. Ver parser.py.
FIELD_ALIASES: dict[str, list[str]] = {
    "id_osc": ["id_osc", "id", "cd_osc"],
    "nome": [
        "tx_nome_osc", "tx_razao_social_osc", "tx_nome_fantasia_osc",
        "razao_social", "nome",
    ],
    "razao_social": ["tx_razao_social_osc", "razao_social"],
    "nome_fantasia": ["tx_nome_fantasia_osc", "tx_apelido_osc", "nome_fantasia"],
    "cnpj": [
        "cd_identificador_osc", "nr_cnpj", "cnpj", "tx_identificador_osc",
    ],
    "situacao": [
        "tx_nome_situacao_cadastral", "cd_situacao_cadastral",
        "situacao_cadastral", "situacao",
    ],
    "natureza_juridica": [
        "tx_nome_natureza_juridica_osc", "tx_natureza_juridica_osc",
        "natureza_juridica",
    ],
    "endereco": ["tx_endereco", "tx_endereco_osc", "logradouro", "endereco"],
    "numero": ["nr_localizacao", "numero", "nr_numero"],
    "complemento": ["tx_endereco_complemento", "complemento"],
    "bairro": ["tx_bairro", "bairro"],
    "cidade": ["tx_nome_municipio", "municipio", "cidade"],
    "codigo_municipio_ibge": ["cd_municipio", "codigo_ibge", "cd_ibge"],
    "uf": ["tx_sigla_uf", "uf", "sigla_uf"],
    "estado": ["tx_nome_uf", "estado", "nome_uf"],
    "cep": ["nr_cep", "cep"],
    "area_atuacao": [
        "tx_nome_atividade_economica_osc", "tx_nome_atividade_economica",
        "area_atuacao", "areas_atuacao",
    ],
    "atividade_economica": [
        "tx_nome_atividade_economica_osc", "tx_nome_atividade_economica",
    ],
    "data_fundacao": ["dt_fundacao_osc", "data_fundacao", "dt_fundacao"],
    "data_cadastro_cnpj": ["dt_ano_cadastro_cnpj", "data_cadastro_cnpj"],
    "responsavel": [
        "tx_nome_responsavel_legal", "responsavel", "tx_responsavel",
    ],
    "telefone": ["tx_telefone", "telefone", "nr_telefone"],
    "email": ["tx_email", "email"],
    "site": ["tx_site", "site", "url"],
    "latitude": ["geo_lat", "latitude", "lat"],
    "longitude": ["geo_lng", "longitude", "lng", "lon"],
    "resumo": ["tx_resumo_osc", "resumo"],
    "situacao_imovel": ["tx_nome_situacao_imovel_osc", "situacao_imovel"],
}

# Colunas da planilha Excel, na ordem exata solicitada.
EXCEL_COLUMNS: list[tuple[str, str]] = [
    ("nome", "Nome"),
    ("cnpj", "CNPJ"),
    ("natureza_juridica", "Natureza Jurídica"),
    ("situacao", "Situação"),
    ("endereco_completo", "Endereço"),
    ("bairro", "Bairro"),
    ("cidade", "Cidade"),
    ("uf", "UF"),
    ("cep", "CEP"),
    ("telefone", "Telefone"),
    ("whatsapp", "WhatsApp"),
    ("email", "Email"),
    ("site", "Site"),
    ("instagram", "Instagram"),
    ("facebook", "Facebook"),
    ("linkedin", "LinkedIn"),
    ("youtube", "Youtube"),
    ("responsavel", "Responsável"),
    ("data_fundacao", "Data Fundação"),
    ("area_atuacao", "Área Atuação"),
    ("observacoes", "Observações"),
]

# Configuração padrão global (instância única reutilizável).
settings = Settings()
