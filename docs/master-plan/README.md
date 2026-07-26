# AeroCortex — Master Plan

**A maior plataforma mundial de gestão e manutenção de drones agrícolas** — do nascimento da startup à expansão internacional.

Documento estratégico e técnico dividido em capítulos. Nome de trabalho: *AeroCortex* (a validar). Foco inicial: DJI Agras; expansão: XAG, Jacto e mercado global.

> ⚠️ Todos os números de mercado e financeiros são **ESTIMATIVAS** com premissas explícitas (câmbio US$ 1 = R$ 5,40) e devem ser validados com fontes primárias antes de decisões de capital.

## Entregáveis prontos para leitura

- 📄 **[dist/AeroCortex-Master-Plan.pdf](dist/AeroCortex-Master-Plan.pdf)** — versão completa em PDF (capa, sumário, diagramas).
- 🌐 **[dist/AeroCortex-Master-Plan.html](dist/AeroCortex-Master-Plan.html)** — versão web autocontida (abrir no navegador).

## Índice dos capítulos

| # | Capítulo | Arquivo | Status |
|---|---|---|---|
| 00 | Sumário Executivo | [00-sumario-executivo.md](00-sumario-executivo.md) | ✅ |
| 01 | Estudo Completo de Mercado (TAM/SAM/SOM, DJI/XAG/Jacto, dores) | [01-estudo-de-mercado.md](01-estudo-de-mercado.md) | ✅ |
| 02 | Business Plan (Blue Ocean, 14 linhas de receita, moat) | [02-business-plan.md](02-business-plan.md) | ✅ |
| 03 | Roadmap Corporativo (Ano 1/2/3/5/10, KPIs, OKRs) | [03-roadmap-corporativo.md](03-roadmap-corporativo.md) | ✅ |
| 04 | Arquitetura da Plataforma (cloud-native, k8s, multi-tenant) | [04-arquitetura-plataforma.md](04-arquitetura-plataforma.md) | ✅ |
| 05 | ERP Especializado em Drones Agrícolas (módulos + 5 portais) | [05-erp-drones-agricolas.md](05-erp-drones-agricolas.md) | ✅ |
| 06 | Drone Digital Twin | [06-digital-twin.md](06-digital-twin.md) | ✅ |
| 07 | IA Preditiva (RUL, risco de incêndio LiPo) | [07-ia-preditiva.md](07-ia-preditiva.md) | ✅ |
| 08 | Computer Vision para Inspeção (laudo + orçamento automático) | [08-computer-vision.md](08-computer-vision.md) | ✅ |
| 09 | IA Offline / Edge AI (ONNX, TFLite, Jetson, llama.cpp) | [09-ia-offline-edge.md](09-ia-offline-edge.md) | ✅ |
| 10 | Assistente Inteligente do Técnico (voz, offline) | — | ⏳ Em geração |
| 11 | Universidade Corporativa e Treinamento (AR/VR, certificação) | — | ⏳ Em geração |
| 12 | Pesquisa Científica e Vigilância Tecnológica | — | ⏳ Em geração |
| 13 | Arquitetura de IA (RAG, agentes, MCP, LLMOps) | — | ⏳ Em geração |
| 14 | Segurança e Compliance (Zero Trust, LGPD, ISO 27001) | — | ⏳ Em geração |
| 15 | UX/UI (oficina-first, tablet, dark/light) | — | ⏳ Em geração |
| 16 | Plano Comercial e Captação (pitch, valuation, Seed/A/B) | — | ⏳ Em geração |
| 17 | Plano Financeiro (CAC/LTV, projeção 10 anos) | — | ⏳ Em geração |
| 18 | Documentação Técnica (C4, ERD, BPMN, OpenAPI/GraphQL) | — | ⏳ Em geração |
| 19 | Material de Estudo Obrigatório | — | ⏳ Em geração |
| 20 | Pilares Estratégicos (Multimodal, Data Lake, Marketplace, Health Score) | — | ⏳ Em geração |
| 21 | **Master Roadmap** (centenas de tarefas ordenadas) | — | ⏳ Em síntese |

## Como regenerar o HTML/PDF

O ferramental de build fica fora do versionamento (em `scratchpad-build/`, ignorado pelo git). O script combina os capítulos Markdown, renderiza diagramas mermaid via Chromium headless e gera `dist/AeroCortex-Master-Plan.{html,pdf}`.

```bash
node build.js docs/master-plan docs/master-plan/dist
```
