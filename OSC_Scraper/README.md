# OSC Scraper — Mapa das Organizações da Sociedade Civil (IPEA)

Ferramenta profissional em Python para **coletar automaticamente os dados
públicos** do portal [Mapa das OSCs do IPEA](https://mapaosc.ipea.gov.br/mapa)
e organizá-los em uma planilha Excel completa (além de CSV e JSON).

A ferramenta percorre **todos os resultados** da base — que possui mais de
**897 mil organizações** — de forma robusta, incremental e retomável, mesmo
diante de milhares de registros.

---

## ✨ Destaques

- **Coleta via API oficial** — usa a mesma API REST pública que o próprio portal
  consome (descoberta por engenharia reversa do código-fonte aberto do projeto
  IPEA/Plataformas-Cidadania). É rápida, estável e completa.
- **Modo navegador (Playwright)** como fallback — abre o SPA real e reaproveita
  as chamadas de API do site, funcionando mesmo que o layout mude.
- **Assíncrono e paralelo** — coleta os detalhes de várias OSCs ao mesmo tempo
  (`asyncio` + `httpx`), com concorrência controlada.
- **Robusto** — retry automático com backoff exponencial, espera inteligente,
  recuperação de erros e cache de respostas.
- **Salvamento incremental em SQLite** — cada OSC é gravada assim que é
  processada. **Nunca perde dados.** Se o programa fechar, continua exatamente
  do último registro (resume).
- **Exportação profissional** — Excel com cabeçalho colorido, filtros
  automáticos, largura de coluna ajustada e primeira linha congelada; além de
  CSV e JSON.
- **Interface web** — painel HTML com botões *Iniciar / Pausar / Continuar /
  Parar / Exportar* e estatísticas em tempo real (encontradas, processadas, %,
  velocidade, tempo restante).
- **Logs completos** — horário, OSC processada, erros, páginas visitadas.

---

## 📦 Instalação

Requisitos: **Python 3.10+**.

```bash
# 1. Instale as dependências
pip install -r requirements.txt

# 2. Instale o navegador do Playwright (necessário só para o modo --browser)
playwright install chromium

# 3. Execute
python main.py
```

> **Ambientes gerenciados:** se o Chromium já estiver pré-instalado (variável
> `PLAYWRIGHT_BROWSERS_PATH`), a ferramenta o detecta automaticamente e você
> pode pular o `playwright install`.

---

## 🚀 Uso

### Interface web (padrão)

```bash
python main.py
```

Abre o painel de controle em **http://127.0.0.1:8000**. Use os botões para
iniciar, pausar, continuar, parar e exportar. As estatísticas são atualizadas
em tempo real.

### Linha de comando (headless)

```bash
# Coleta completa (todas as UFs), depois gera Excel/CSV/JSON
python main.py --cli

# Somente uma UF, com mais paralelismo
python main.py --cli --uf SP --concurrency 12

# Somente um município (código IBGE de 7 dígitos)
python main.py --cli --municipio 3550308

# Usando o navegador (fallback Playwright)
python main.py --cli --browser

# Descobrir a base da API automaticamente abrindo o site
python main.py --cli --auto-discover

# Apenas exportar o que já foi coletado
python main.py --export all      # ou: xlsx | csv | json
```

Principais opções (todas com padrões sensatos em `config.py`):

| Opção | Descrição |
|-------|-----------|
| `--cli` | Executa no terminal, sem servidor web. |
| `--browser` | Usa o motor Playwright (navegador). |
| `--uf SIGLA` | Restringe a coleta a uma UF (ex.: `SP`). |
| `--municipio COD` | Restringe a um município (código IBGE). |
| `--concurrency N` | Coletas de detalhe em paralelo (padrão 8). |
| `--page-size N` | Tamanho da página de enumeração (padrão 200). |
| `--auto-discover` | Descobre a base da API via navegador. |
| `--no-cache` | Desabilita o cache de respostas. |
| `--export FMT` | Gera arquivos e encerra (`all/xlsx/csv/json`). |
| `--host` / `--port` | Endereço do painel web. |

Também é possível configurar tudo por variáveis de ambiente com prefixo `OSC_`
(ex.: `OSC_CONCURRENCY=12`, `OSC_PAGE_SIZE=300`, `OSC_API_BASE=...`).

---

## 📁 Estrutura do projeto

```
OSC_Scraper/
├── main.py            # Ponto de entrada (CLI + interface web)
├── config.py          # Configuração central (endpoints, campos, opções)
├── models.py          # Modelo de dados canônico (dataclass OSC)
├── logger.py          # Logging (console + arquivo rotativo)
├── utils.py           # Retry, backoff, formatação, extração de campos
├── database.py        # Persistência SQLite (incremental + resume)
├── api_client.py      # Cliente HTTP assíncrono (httpx) da API
├── parser.py          # Normalização dos dados brutos -> OSC
├── details.py         # Montagem do registro completo (multi-endpoint)
├── scraper.py         # Orquestrador (enumeração + workers + controle)
├── browser.py         # Motor Playwright (auto-discovery + fallback)
├── excel.py           # Exportação Excel / CSV / JSON
├── webapp.py          # Backend FastAPI do painel de controle
├── static/
│   └── index.html     # Interface web (painel)
├── tests/
│   ├── test_core.py         # Testes de parsing, banco, exportação
│   └── test_integration.py  # Teste offline do orquestrador completo
├── output/            # OSCs.xlsx, OSCs.csv, OSCs.json (gerados)
├── logs/              # Logs de execução (gerados)
├── data/              # Banco SQLite + cache (gerados)
├── requirements.txt
└── README.md
```

---

## 🗂️ Campos coletados

Para cada OSC, a ferramenta coleta tudo que estiver disponível publicamente:

Nome · Razão Social · Nome Fantasia · CNPJ · Situação · Natureza Jurídica ·
Endereço · Número · Complemento · Bairro · Cidade · UF · Estado · CEP ·
Código IBGE do Município · Latitude/Longitude · Área de Atuação ·
Atividade Econômica · Data de Fundação · Responsável · Telefone · Celular ·
WhatsApp · E-mail · Site · Facebook · Instagram · LinkedIn · Youtube ·
Nº de Funcionários · Nº de Voluntários · Convênios/Projetos · Certificações ·
Título OSCIP · CEBAS · Utilidade Pública · Missão/Visão/Histórico (Observações).

Campos inexistentes ficam vazios.

A planilha Excel (`output/OSCs.xlsx`) usa exatamente as colunas: *Nome, CNPJ,
Natureza Jurídica, Situação, Endereço, Bairro, Cidade, UF, CEP, Telefone,
WhatsApp, Email, Site, Instagram, Facebook, LinkedIn, Youtube, Responsável,
Data Fundação, Área Atuação, Observações.*

---

## 🏗️ Como funciona

1. **Enumeração** — a busca avançada da API
   (`POST /api/osc/busca_avancada/lista/{limit}/{offset}`) é percorrida com
   paginação, **particionada por UF** (27 partições) para cobrir toda a base
   sem estourar limites de consulta. O cursor de cada partição é salvo no
   SQLite → resume preciso.
2. **Coleta de detalhes** — para cada OSC, vários endpoints são consultados em
   paralelo: `dados_gerais`, `certificados`, `rel_trabalho_e_governanca`,
   `areas_atuacao`, `projetos` e `descricao`.
3. **Normalização** — o `parser` mapeia os campos da API (colunas da view
   `portal.vw_osc_dados_gerais`) para o modelo canônico, formatando CNPJ/CEP,
   inferindo celular/WhatsApp, e extraindo OSCIP/CEBAS/Utilidade Pública e
   redes sociais.
4. **Persistência incremental** — cada OSC é gravada imediatamente no SQLite.
5. **Exportação** — Excel/CSV/JSON gerados a partir do banco a qualquer momento.

---

## 🧪 Testes

```bash
pip install pytest
python -m pytest tests/ -v
```

Os testes cobrem, **sem depender de rede**, toda a lógica de parsing,
persistência incremental, resume e exportação, além de um **teste de integração
offline do orquestrador completo** (enumeração → workers → banco) usando um
duplo da camada de rede.

---

## ⚠️ Limitações externas

- Os dados dependem do que o portal do IPEA disponibiliza publicamente; campos
  não preenchidos na fonte ficam vazios.
- **Redes sociais e WhatsApp** nem sempre existem como campo estruturado na
  base — quando ausentes, são inferidos de textos livres (site/descrição) e
  podem não estar presentes para todas as OSCs.
- O portal pode aplicar limites de taxa; a concorrência e o `rate_delay` são
  ajustáveis para respeitar o serviço.
- Se a rede onde a ferramenta roda **bloquear o domínio** `mapaosc.ipea.gov.br`
  (proxy/firewall corporativo), a coleta não será possível a partir dela —
  execute em uma rede com acesso ao portal.

---

## 📄 Licença e uso responsável

Coleta apenas **dados públicos** de transparência, respeitando o serviço
(concorrência limitada, retry com backoff). Use de forma responsável e em
conformidade com os termos do portal.
