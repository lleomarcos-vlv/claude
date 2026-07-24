# 02 — Project Bible · Drone Kairós ERP

**Documento:** `02 — Project Bible`
**Versão:** 1.0 · **Data:** 21 de julho de 2026 · **Status:** Ativo (fonte única de verdade)
**Dependências:** `00 — Master Prompt`, `01 — Constituição`
**Responsável:** CTO

---

## 1. Resumo Executivo

O Project Bible é a **fonte única de verdade viva** do Drone Kairós ERP. Todo documento e toda decisão futura devem obedecê-lo. Ele consolida o escopo, o glossário, as decisões e o **estado atual** de cada documento e etapa do roadmap. Diferente da Constituição (estável), o Bible **evolui continuamente** — cada decisão relevante é registrada aqui e propagada.

## 2. Objetivos
- Centralizar o escopo consolidado e as convenções do projeto.
- Registrar decisões e apontar os ADRs correspondentes.
- Manter o **estado de produção** de cada documento e etapa.
- Executar o **Procedimento de Conflito** sempre que houver contradição.

## 3. Escopo
Cobre toda a plataforma e todas as fases. É consultado no início de cada fase e atualizado ao final.

## 4. Regras — Procedimento de Conflito
```
1 · Nunca inventar
2 · Atualizar o Project Bible (registrar a decisão correta)
3 · Explicar a alteração (o quê, por quê, impacto)
4 · Propagar aos documentos afetados
```
Em caso de contradição entre documentos, **o Bible prevalece** (respeitadas as cláusulas pétreas da Constituição).

## 5. Escopo Consolidado da Plataforma

**Aplicações:** App do Cliente (Flutter), App do Técnico (Flutter), Painel do Fabricante (web), Painel da Revenda (web), Portal Administrativo (web).

**Serviços transversais:** ERP, CRM, Financeiro, BI, API pública, Multiempresa, Histórico vitalício por Serial Number.

**Módulos proprietários:**
- **KCI — Kairós Core Intelligence:** offline-first, IA externa opcional. Fluxo: Diagnóstico → OCR → Visão Computacional → Sistema Especialista → Motor Preditivo → Motor Generativo → Knowledge Base → RAG Local → Aprendizado.
- **KCD — Kairós Cyber Defense:** Zero Trust. Fluxo: Segurança → Firewall → Criptografia → Auditoria → SOC → Zero Trust → Logs → Backups → Threat Detection.
- **KSI — Kairós Smart Inventory:** Fluxo: Estoque → Código de Barras → QR Code → RFID → NFC → Compras → Reposição Automática → Curva ABC → Previsão → Integração Financeira.

## 6. Glossário e Convenções (Ubiquitous Language)
| Termo | Definição |
|---|---|
| **Serial Number (SN)** | Identidade universal e vitalícia de um equipamento; chave de rastreabilidade transversal |
| **Tenant / Empresa** | Organização isolada na plataforma multiempresa |
| **KCI / KCD / KSI** | Módulos proprietários de inteligência, segurança e estoque |
| **ADR** | Architecture Decision Record |
| **Bounded Context** | Fronteira de contexto de domínio (DDD) |
| **OS (Ordem de Serviço)** | Unidade de trabalho do técnico |

**Convenções:** documentos em `/docs` (`NN-nome.md`); prompts em `/prompts`; ADRs em `/adr/NNNN-titulo.md`. Idioma português (BR). Versionamento por documento.

## 7. Decisões Registradas (Decision Log)
| # | Decisão | Justificativa | ADR |
|---|---|---|---|
| D-001 | Desenvolvimento em fases guiado por Master Prompt | Preservar qualidade e consistência em projeto >100k palavras | — |
| D-002 | Serial Number como chave de negócio transversal | Rastreabilidade vitalícia é valor constitucional | ADR-0001 (pendente) |
| D-003 | Arquitetura DDD + multiempresa desde o design | Escala internacional e isolamento de dados | ADR-0002 (pendente) |
| D-004 | KCI offline-first | Autonomia em campo (Artigo II.4) | ADR-0003 (pendente) |
| D-005 | Segurança por padrão (KCD desde o design) | Confiança é direito, não recurso | ADR-0004 |

> Os ADRs formais serão criados nas fases de arquitetura e dos módulos.

## 8. Estado dos Documentos
| Doc | Status |
|---|---|
| 00 Master Prompt | ✅ Concluído v1.0 |
| 01 Constituição | ✅ Concluído v1.0 |
| 02 Project Bible | ✅ Ativo v1.0 (este) |
| 03 Roadmap | ✅ Concluído v1.0 |
| 04–24 | ✅ Concluídos v1.0 (kit completo — todos os 24 documentos + Master Prompt produzidos) |

> **Marco:** o kit de documentação (00–24) foi concluído em 21/07/2026, totalizando ~100 mil palavras de documentação técnica. As próximas fases passam da **documentação** para a **execução** (código), sempre guiadas por este Bible.

## 9. Estado do Roadmap (macro)
| Fase | Etapas | Status |
|---|---|---|
| 1 · Descoberta e Requisitos | 001–020 | 📗 Documentado (docs 04–06) |
| 2 · Arquitetura e Fundações | 021–035 | 📗 Documentado (docs 07–09) |
| 3 · Construção do Produto | 036–060 | ✅ Núcleo entregue — walking skeleton (036–041), identidade/acesso + refresh (036/047), notificações (051), documentos (052), auditoria KCD (053), API OpenAPI (054), webhooks (055), empacotamento/demo (057–058), hardening (059) |
| 4 · Inteligência/Segurança/Estoque | 061–078 | 🟡 Em andamento — KCI diagnóstico por regras (061–067), KCD hardening/login falho (069), KSI movimentações + Curva ABC (072/074), BI indicadores (076), CRM + Financeiro (077) |
| 5 · Operação e Qualidade | 079–090 | 🟡 Parcial — CI (079), health probes/observabilidade base (081), testes de integração (083), rate-limit/hardening (084) |
| 6 · Negócio e Expansão | 091–100 | 🟡 Parcial — internacionalização pt/en/es no painel (096) |

> **Fase 3 em andamento (21/07/2026).** Fatia vertical de ponta a ponta entregue,
> **testada e executada ao vivo**:
> - **Backend** (Java 21/Spring Boot, monólito modular DDD): empresa (tenant) →
>   equipamento por Serial Number → item KSI → OS → baixa automática →
>   histórico vitalício. **11 testes de integração verdes** + smoke test via HTTP
>   (saldo 10→7, histórico REGISTRO+SERVICO). Flyway, Docker, CI. Ver `backend/`.
> - **Identidade e Acesso (etapa 036).** Autenticação por JWT (login → token),
>   perfis RBAC (`ADMIN/FABRICANTE/REVENDA/TECNICO/CLIENTE`) e **tenant resolvido
>   do claim do token** — o header `X-Tenant-Id` foi removido. Onboarding cria
>   empresa + admin. Smoke test ao vivo: 401 sem token, RBAC 403 para técnico,
>   isolamento por tenant. Ver ADR-0004.
> - **Frontend** (React 18 + TypeScript/Vite, doc 11): painel que consome a API
>   (login/onboarding, visão geral, equipamentos, estoque/KSI, ordens de serviço).
>   **Build de produção verde**. Ver `frontend/`.
> - **Empacotamento e demonstração (etapas 057–058).** `docker compose up --build`
>   sobe PostgreSQL + backend + frontend; a app abre em `http://localhost:8080`
>   com **dados de demonstração** semeados (login `admin@kairos.com`). O perfil
>   `postgres` foi **executado contra um PostgreSQL real** (migrações aplicadas,
>   fluxo ponta a ponta OK); corrigida a dependência `flyway-database-postgresql`
>   (o Flyway 10 tirou o suporte a Postgres do core).
> - **Produto ampliado (Fases 3–4).**
>   - **Auditoria (053, KCD):** trilha imutável por tenant (login, cadastros,
>     conclusão de OS, transferência) — consulta restrita ao ADMIN.
>   - **Gestão de usuários (047):** ADMIN lista/cria usuários por perfil no painel.
>   - **API documentada (054):** OpenAPI 3 + Swagger UI com auth Bearer.
>   - **Transferência de posse por Serial Number (RF-022):** custódia
>     fabricante→revenda→cliente no histórico vitalício.
>   - **KSI avançado (072/074):** movimentações por item e Curva ABC por consumo.
>   - **KCI (061–067):** diagnóstico por sistema especialista offline (regras),
>     integrado à OS e ao histórico.
>   - **Notificações (051):** central por tenant (OS concluída, estoque baixo,
>     transferência) com sino e contador de não lidas.
>   - **Documentos (052):** anexos (nota fiscal, foto, manual) por Serial Number,
>     com download e registro no histórico vitalício.
>   - **Hardening (059/069, KCD):** cabeçalhos de segurança e auditoria de
>     tentativas de login falho (LOGIN_FALHOU).
>   - **BI (076):** indicadores e gráficos (ABC, OS por status, saldo por item).
>   - **CRM (077):** clientes (PF/PJ) e funil de oportunidades.
>   - **Financeiro (077):** contas a receber/pagar, faturamento da OS concluída,
>     baixa e resumo.
>   - **Webhooks (055):** assinaturas por tenant + entrega dos eventos de domínio
>     (dispatcher agendado, mitigação de SSRF).
>   - **Produção:** refresh tokens, anti-brute-force no login (429), health
>     probes (liveness/readiness), CORS por env; **i18n pt/en/es** no painel;
>     otimizações (N+1 do ABC, pool/batch, chunk de vendor).
>   - **34 testes de integração verdes**; painel por papel (ADM/Técnico/Cliente)
>     + sino de notificações e seletor de idioma.
>
> **Especificação Conlor Drones (adaptação, Fase 5):** o produto foi ajustado
> para a manutenção de drones **DJI Agras** conforme a apresentação oficial,
> **sem recriar o núcleo**:
>   - **Três camadas de permissão** (ADM, Técnico, Cliente) com UI e listagens
>     filtradas por papel; cliente com agendamento autônomo + acompanhamento.
>   - **OS por estágios:** `FILA_DE_ESPERA → ORCAMENTO → ESTAGIO_1 → ESTAGIO_2 →
>     CONCLUIDA`, com invariantes no domínio e **dupla aprovação** (adicionais do
>     Estágio 1 destacados para a 2ª aprovação).
>   - **Orçamento automatizado:** estoque **precificado**, valor calculado com
>     preço congelado por linha, **PDF** (OpenPDF) e **link de WhatsApp** (`wa.me`).
>   - **Agendamento autônomo + gestão de leads** (bounded context `scheduling`):
>     cliente solicita; gerência confirma → registra aeronave, abre a OS na fila
>     e distribui ao técnico.
>   - **IA preditiva offline:** problemas **crônicos por modelo** + **sugestões
>     ativas por correlação** de peças (ex.: hélices + eixos → "Queda").
>   - Migração **V10** (preço, estágios, `agendamento`; status antigos →
>     `FILA_DE_ESPERA`); seed de demonstração DJI Agras (ADM/Técnico/Cliente).
>
> ADRs 0001–0006 registrados. Código só avança sobre arquitetura documentada
> (Constituição, Artigo VI.3).

### Decisões novas (Fase 3)
| # | Decisão | ADR |
|---|---|---|
| D-006 | Monólito modular DDD → microsserviços sob demanda | ADR-0001 |
| D-007 | Multi-tenancy row-level com contexto de tenant | ADR-0002 |
| D-008 | Skeleton: Flyway + H2(dev/test)/PostgreSQL(prod); auth adiada | ADR-0003 |
| D-009 | Autenticação JWT + RBAC; tenant do token (substitui header) | ADR-0004 |
| D-010 | Empacotamento `docker compose` (Postgres+API+web) + seed de demo | — |
| D-011 | Auditoria imutável por tenant como base do KCD (053) | — |
| D-012 | API documentada por OpenAPI 3 / Swagger UI (054) | — |
| D-013 | Curva ABC do KSI por consumo (soma de saídas) | — |
| D-014 | KCI: diagnóstico por motor de regras offline (sem IA externa) | ADR-0005 |
| D-015 | Notificações in-app por tenant a partir de eventos do domínio | — |
| D-016 | Hardening: cabeçalhos de segurança + auditoria de login falho | — |
| D-017 | BI por agregação dos serviços de domínio; gráficos SVG no front | — |
| D-018 | Documentos por Serial Number guardados em base64 (portável H2/Postgres) | — |
| D-019 | CRM (clientes + funil) e Financeiro (contas + faturamento da OS) | — |
| D-020 | Webhooks: entrega assíncrona (dispatcher) + soft-delete + anti-SSRF | — |
| D-021 | Refresh tokens + anti-brute-force no login; CORS e limites por env | — |
| D-022 | i18n do painel (pt/en/es) sem dependências | — |
| D-023 | Otimização: agregação (evita N+1), pool/batch, chunk de vendor | — |
| D-024 | RLS (Postgres) e Testcontainers ficam como defesa-em-profundidade/CI | ADR-0003 |
| D-025 | Conlor: OS por estágios + orçamento automatizado (PDF/WhatsApp) + IA preditiva | ADR-0006 |
| D-026 | Estoque precificado; preço congelado por linha da OS (auditabilidade) | ADR-0006 |
| D-027 | Agendamento autônomo do cliente + gestão de leads (bounded context scheduling) | ADR-0006 |

## 10. Diagramas — Mapa de Contextos (DDD, visão inicial)
```
[Identidade & Acesso] [Cadastro/Serial Number] [Ordens de Serviço]
[Estoque (KSI)] [Compras] [Financeiro] [CRM] [BI]
[Inteligência (KCI)] [Segurança (KCD)] [API Pública] [Multiempresa/Tenancy]
```

## 11. Modelagem — Entidades-Âncora (visão)
`Empresa(Tenant)` · `Equipamento(SerialNumber)` · `Usuário/Perfil` · `OrdemDeServiço` · `Peça/Item` · `Movimentação de Estoque` · `Documento Financeiro` · `Evento de Auditoria`.

## 12. Checklist de Governança
- ☑ Escopo consolidado registrado.
- ☑ Glossário/convenções definidos.
- ☑ Decision Log iniciado.
- ☑ Estado de documentos e roadmap rastreado.

## 13. Riscos
- **Bible desatualizado** → perda da fonte de verdade. Mitigação: atualização obrigatória ao fim de cada fase (Quality Gate).
- **Divergência entre docs** → resolvida sempre pelo Procedimento de Conflito.

## 14. Melhorias Futuras
- Automatizar índice de estado a partir dos cabeçalhos dos documentos.
- Vincular cada decisão a commits/ADRs.

## 15. Auditoria
- **Consistência:** ✔ com Master Prompt e Constituição.
- **Ação contínua:** este documento é atualizado a cada fase concluída.
- **Estado:** ativo como fonte de verdade v1.0.

---
*Fim do `02 — Project Bible` · v1.0 — atualizado continuamente*
