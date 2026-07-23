# Drone Kairós ERP — Apresentação do Produto

Documento de apresentação em **PDF (17 páginas, 16:9)** da plataforma
**Drone Kairós ERP** — o SaaS multiempresa de **assistência técnica de drones
agrícolas DJI Agras** (fluxo de OS por estágios, orçamento automatizado,
módulos KCI/KSI/KCD, auditoria imutável e rastreabilidade vitalícia por Serial
Number).

A peça foi construída com a **identidade visual da Kairós** — paleta
Navy/Gold/Ivory, tipografia *Playfair Display + Inter* e o símbolo "K" — aplicada
**no estilo do brandbook da VLV**: capa com wordmark, divisores de capítulo
numerados, badges de seção, grades de cards, banner de destaque, comparativo
"com/sem plataforma", manifesto e contracapa.

## Arquivo final
- [`Drone-Kairos-ERP-Apresentacao.pdf`](Drone-Kairos-ERP-Apresentacao.pdf) — o documento pronto para uso.

## Sumário do documento
| # | Capítulo |
|---|---|
| 01 | A Plataforma — multiempresa, rastreabilidade vitalícia, offline-first |
| 02 | Perfis & Permissões — DEV · Administrativo · Técnico · Cliente |
| 03 | Ordem de Serviço por Estágios — orçamento, aprovação e conclusão |
| 04 | Módulos Inteligentes — KCI · KSI · KCD |
| 05 | Confiança & Rastreabilidade — auditoria imutável e Serial Number |
| 06 | Arquitetura & Tecnologia — a engenharia e os números |

## Identidade aplicada (Kairós)
- **Cores:** Navy Kairós `#0A1628` · Gold `#C9A961` · Charcoal `#1C1F26` · Ivory `#F5F2EA`
- **Tipografia:** Playfair Display (títulos) + Inter (texto)

## Regerar o PDF
O código-fonte é um HTML/CSS autossuficiente renderizado por Chromium headless.

```bash
cd src
./render.sh          # usa o Chromium do sistema (ou defina CHROME=/caminho/do/chrome)
```

Estrutura:
- `src/deck.html` — a apresentação (HTML + CSS).
- `src/fonts/` — Playfair Display e Inter (SIL Open Font License).
- `src/render.sh` — script de renderização para PDF.
