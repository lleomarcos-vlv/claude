# Drone Kairós ERP — Kit de Desenvolvimento por Fases

Plataforma completa de software para o ecossistema de drones (fabricante → revenda → técnico → cliente), multiempresa, com rastreabilidade vitalícia por **Serial Number** e três módulos proprietários: **KCI** (inteligência), **KCD** (cibersegurança) e **KSI** (estoque inteligente).

Este repositório contém o **kit de desenvolvimento** — a documentação enterprise que guia toda a construção, produzida em fases sob um Master Prompt e um Project Bible como fonte de verdade.

## Como usar

1. Abra uma conversa com o Claude e cole **`prompts/00-master-prompt.md`**.
2. Envie um comando de trabalho (ex.: `PRODUZIR 07`, `STATUS`, `REVISAR 14`).
3. O Claude conduz o projeto fase a fase, mantendo os documentos permanentes.

## Estrutura

```
/prompts   → 00 Master Prompt (o "cérebro" do projeto)
/docs      → documentação 01–24 (+ guia de organização em PDF)
/adr       → Architecture Decision Records (a criar nas fases técnicas)
/architecture, /backend, /frontend, /mobile, /assets → a preencher na execução
```

## Índice dos documentos

| # | Documento | Arquivo |
|---|---|---|
| 00 | Master Prompt | `prompts/00-master-prompt.md` |
| 01 | Constituição do Projeto | `docs/01-constituicao-do-projeto.md` |
| 02 | Project Bible (fonte de verdade) | `docs/02-project-bible.md` |
| 03 | Roadmap (100 etapas) | `docs/03-roadmap.md` |
| 04 | Pesquisa Mundial | `docs/04-pesquisa-mundial.md` |
| 05 | Benchmark | `docs/05-benchmark.md` |
| 06 | Requisitos | `docs/06-requisitos.md` |
| 07 | Arquitetura | `docs/07-arquitetura.md` |
| 08 | Banco de Dados | `docs/08-banco-de-dados.md` |
| 09 | Microsserviços | `docs/09-microsservicos.md` |
| 10 | Backend | `docs/10-backend.md` |
| 11 | Frontend | `docs/11-frontend.md` |
| 12 | Mobile (Flutter) | `docs/12-mobile.md` |
| 13 | Kairós Core Intelligence (KCI) | `docs/13-kairos-core-intelligence.md` |
| 14 | Kairós Cyber Defense (KCD) | `docs/14-kairos-cyber-defense.md` |
| 15 | Kairós Smart Inventory (KSI) | `docs/15-kairos-smart-inventory.md` |
| 16 | Business Intelligence | `docs/16-business-intelligence.md` |
| 17 | CRM | `docs/17-crm.md` |
| 18 | Financeiro | `docs/18-financeiro.md` |
| 19 | DevOps | `docs/19-devops.md` |
| 20 | QA | `docs/20-qa.md` |
| 21 | Implantação | `docs/21-implantacao.md` |
| 22 | Comercial | `docs/22-comercial.md` |
| 23 | Internacionalização | `docs/23-internacionalizacao.md` |
| 24 | Evolução da Plataforma | `docs/24-evolucao-da-plataforma.md` |

**Status:** kit completo (00–24) · v1.0 · ~100 mil palavras de documentação técnica.

Cada documento segue o esqueleto enterprise de 15 seções (Resumo Executivo → Auditoria). Consulte também `docs/Drone-Kairos-ERP-Guia-de-Organizacao.pdf` (visão geral da estratégia) e `docs/Drone-Kairos-ERP-Kit-Completo.pdf` (todos os documentos consolidados).
