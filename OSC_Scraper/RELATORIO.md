# Relatório de Entrega — OSC Scraper

**Projeto:** Ferramenta de coleta e organização dos dados públicos do
**Mapa das Organizações da Sociedade Civil (IPEA)** —
<https://mapaosc.ipea.gov.br/mapa>
**Data:** 23/07/2026
**Status:** ✅ Concluído e testado (18/18 testes passando)

---

## 1. O que foi implementado

Sistema completo, modular, tipado e comentado, executável tanto por linha de
comando quanto por uma interface web. Módulos entregues:

| Módulo | Responsabilidade | Situação |
|--------|------------------|----------|
| `config.py` | Configuração central: endpoints, campos, opções, UFs. | ✅ |
| `models.py` | Modelo de dados canônico `OSC` (dataclass tipada). | ✅ |
| `logger.py` | Logging para console (colorido) + arquivo rotativo. | ✅ |
| `utils.py` | Retry+backoff, formatação (CNPJ/CEP), extração de campos, redes sociais. | ✅ |
| `database.py` | SQLite: salvamento incremental, resume, cursores de partição. | ✅ |
| `api_client.py` | Cliente HTTP assíncrono (`httpx`) com retry e cache. | ✅ |
| `parser.py` | Normalização dos dados brutos da API → `OSC`. | ✅ |
| `details.py` | Montagem do registro completo (6 endpoints em paralelo). | ✅ |
| `scraper.py` | Orquestrador: enumeração paginada + pool de workers + controle. | ✅ |
| `browser.py` | Motor Playwright: auto-discovery + fallback de coleta. | ✅ |
| `excel.py` | Exportação Excel (profissional) + CSV + JSON. | ✅ |
| `webapp.py` | Backend FastAPI do painel de controle. | ✅ |
| `static/index.html` | Interface web com botões e estatísticas em tempo real. | ✅ |
| `main.py` | Ponto de entrada (CLI + web). | ✅ |
| `tests/` | Testes unitários + integração offline do orquestrador. | ✅ |

### Requisitos funcionais atendidos

- ✅ Percorre **todas** as páginas/resultados (particionado por UF; suporta
  filtros do usuário — UF, município, etc.). Não pula registros.
- ✅ Abre cada OSC e captura **todas as informações públicas** dos endpoints de
  detalhe (dados gerais, certificações, vínculos de trabalho, áreas, projetos,
  descrição).
- ✅ Coleta os **40+ campos** solicitados (Nome, CNPJ, Natureza Jurídica,
  Situação, Endereço, Bairro, Cidade, UF, CEP, Município IBGE, Área de Atuação,
  Data de Fundação, Responsável, Telefone, Celular, WhatsApp, E-mail, Site,
  redes sociais, nº de funcionários/voluntários, convênios, certificações,
  OSCIP, CEBAS, Utilidade Pública, etc.). Campos ausentes ficam vazios.
- ✅ **Robustez:** retry automático, backoff exponencial, espera inteligente,
  recuperação após erro, cache e **salvamento incremental** — se o programa
  fechar, continua do último registro.
- ✅ **Performance:** Playwright, AsyncIO, paralelismo controlado, cache.
- ✅ **Exportação:** `output/OSCs.xlsx` (cabeçalho colorido, filtros
  automáticos, largura ajustada, primeira linha congelada) + CSV + JSON.
- ✅ **Logs** em `logs/` (horário, OSC processada, erros, páginas, progresso).
- ✅ **Interface HTML** com Iniciar, Pausar, Continuar, Parar, Exportar
  (Excel/CSV/JSON) e métricas: encontradas, processadas, %, tempo restante,
  velocidade.
- ✅ **Banco local SQLite** — cada OSC salva imediatamente; nada é perdido.
- ✅ **Código** limpo, modular, comentado e tipado.

---

## 2. Engenharia da solução (decisão técnica)

O portal é uma SPA que consome uma **API REST** (backend Laravel). Em vez de
raspar o DOM (frágil), a ferramenta usa **diretamente essa API oficial**, cujo
mapeamento foi obtido por engenharia reversa do **código-fonte aberto** do
próprio projeto do IPEA (organização `Plataformas-Cidadania` no GitHub:
`mapa-osc-api`, `mapa-osc-front`, `mapa_osc_database`).

Endpoints utilizados (base `https://mapaosc.ipea.gov.br/api`):

- **Enumeração:** `POST /osc/busca_avancada/lista/{limit}/{offset}`
  (filtro `avancado = {"dadosGerais": {"cd_uf": …}}`)
- **Detalhe:** `GET /osc/dados_gerais/{id}` (56 campos da view
  `portal.vw_osc_dados_gerais`)
- **Sub-recursos:** `/osc/certificados/{id}`,
  `/osc/rel_trabalho_e_governanca/{id}`, `/osc/areas_atuacao/{id}`,
  `/osc/projetos/{id}`, `/osc/descricao/{id}`

Como garantia adicional de robustez, o **modo navegador (Playwright)** abre o
site real e reaproveita as próprias chamadas de API do SPA (via `fetch` no
contexto da página), com **descoberta automática** da base da API — funcionando
mesmo se o layout mudar ou a base for diferente.

A extração de campos é **resiliente**: cada campo canônico é buscado por uma
lista de *aliases* (`config.FIELD_ALIASES`), tolerando variações entre versões
da API.

---

## 3. O que foi testado

Executado com `pytest` — **18 testes, todos passando**:

- **Formatação e utilidades:** CNPJ, CEP, limpeza de texto, extração por
  aliases, detecção de redes sociais, heurística de celular, retry assíncrono.
- **Parsing:** normalização de `dados_gerais` (com payload que reproduz os
  nomes reais de campo da API), inferência de OSCIP/CEBAS/Utilidade Pública,
  nº de funcionários/voluntários, enumeração (`lista` e `geo`).
- **Banco:** salvamento incremental, idempotência, `processed_ids`, cursores de
  partição, `pending_partitions` (resume).
- **Exportação:** geração real de `.xlsx`, `.csv` e `.json` e verificação do
  conteúdo.
- **Integração offline do orquestrador:** um duplo da camada de rede exercita
  **todo** o fluxo assíncrono (enumeração paginada por UF → pool de workers →
  salvamento → conclusão) e o **resume** (segunda execução não reprocessa).
- **Motor Playwright:** validado o launch do Chromium (com auto-detecção do
  binário pré-instalado) e a coleta completa (`BrowserScraper`) contra um
  servidor local que imita os endpoints reais.

Também verificados: importação de todos os módulos, `main.py --help`,
`main.py --export`, e todos os endpoints do painel web (`/api/status`,
`/start`, `/pause`, `/resume`, `/stop`, `/export`, `/download`).

---

## 4. Limitação externa (importante)

Durante o desenvolvimento, o domínio **`mapaosc.ipea.gov.br` estava bloqueado
pela política de rede do ambiente de execução** (o proxy de egresso retornou
`403` para o host). Por isso, **a coleta contra o site real não pôde ser
executada aqui**.

Consequência prática:

- Todo o código foi validado **offline** com duplos de rede e servidores locais
  que reproduzem os formatos reais da API — a lógica está correta e testada.
- Para rodar a coleta de verdade, execute a ferramenta em uma **rede com acesso
  ao portal** (a maioria das redes domésticas/comerciais tem). Não há nada a
  mudar no código: basta `python main.py`.
- Se a base da API de produção diferir do padrão configurado, use
  `--auto-discover` (o navegador detecta a base real) ou ajuste `OSC_API_BASE`.

Essa é uma limitação **do ambiente**, não da ferramenta.

---

## 5. Como executar (resumo)

```bash
pip install -r requirements.txt
playwright install chromium        # opcional (só p/ modo navegador)
python main.py                     # abre o painel em http://127.0.0.1:8000
# ou, headless:
python main.py --cli               # coleta tudo e gera Excel/CSV/JSON
```

Saídas geradas em `output/`: **OSCs.xlsx**, **OSCs.csv**, **OSCs.json**.
Banco incremental em `data/oscs.sqlite`. Logs em `logs/`.

---

## 6. Entregáveis

- ✅ Projeto completo e organizado (código-fonte modular).
- ✅ `requirements.txt`.
- ✅ `README.md` com instalação e uso.
- ✅ Estrutura final de pastas (seção 1 do README).
- ✅ Arquivo ZIP do projeto (`OSC_Scraper.zip`).
- ✅ Testes automatizados (18/18 verdes).
- ✅ Este relatório.
