# 03 — Roadmap · Drone Kairós ERP

**Documento:** `03 — Roadmap`
**Versão:** 1.0 · **Data:** 21 de julho de 2026 · **Status:** Ativo
**Dependências:** `00`, `01`, `02`
**Responsável:** CTO / Produto

---

## 1. Resumo Executivo
Roadmap mestre de **100 etapas**, da pesquisa inicial à expansão internacional, organizado em **6 fases**. Cada etapa tem entregável e critério de aceite. O estado de cada etapa é espelhado no Project Bible.

## 2. Objetivos
- Sequenciar todo o desenvolvimento em etapas rastreáveis.
- Deixar explícitas as dependências entre fases.
- Servir de base para planejamento e acompanhamento.

## 3. Escopo
Cobre produto, plataforma, módulos, operação e negócio.

## 4. Regras
- Nenhuma fase avança sem que a anterior passe pelos Quality Gates.
- Código só a partir da Fase 3 (após arquitetura documentada).

## 5. Fases (visão)
| Fase | Nome | Etapas |
|---|---|---|
| 1 | Descoberta e Requisitos | 001–020 |
| 2 | Arquitetura e Fundações | 021–035 |
| 3 | Construção do Produto | 036–060 |
| 4 | Inteligência, Segurança e Estoque | 061–078 |
| 5 | Operação e Qualidade | 079–090 |
| 6 | Negócio e Expansão | 091–100 |

## 6. Roadmap Detalhado (100 etapas)

### Fase 1 — Descoberta e Requisitos (001–020)
| # | Etapa | Entregável |
|---|---|---|
| 001 | Pesquisa mundial de mercado | Doc 04 |
| 002 | Benchmark de concorrentes | Doc 05 |
| 003 | Definição de personas | Seção em Doc 06 |
| 004 | Levantamento de requisitos | Doc 06 |
| 005 | Casos de uso principais | Doc 06 |
| 006 | Mapa de jornadas (UX) | Artefatos UX |
| 007 | Requisitos não-funcionais | Doc 06 |
| 008 | Requisitos de multiempresa | Doc 06/08 |
| 009 | Requisitos de segurança (KCD) | Doc 06/14 |
| 010 | Requisitos de inteligência (KCI) | Doc 06/13 |
| 011 | Requisitos de estoque (KSI) | Doc 06/15 |
| 012 | Glossário de domínio | Bible |
| 013 | Critérios de aceite gerais | Doc 06 |
| 014 | Matriz de rastreabilidade | Doc 06 |
| 015 | Análise de riscos inicial | Doc 06 |
| 016 | Priorização (MoSCoW) | Backlog |
| 017 | Definição de MVP | Bible |
| 018 | Requisitos de API pública | Doc 06/09 |
| 019 | Requisitos de conformidade | Doc 23 |
| 020 | Validação de requisitos | Checkpoint |

### Fase 2 — Arquitetura e Fundações (021–035)
| # | Etapa | Entregável |
|---|---|---|
| 021 | Visão arquitetural | Doc 07 |
| 022 | Mapa de bounded contexts (DDD) | Doc 07 |
| 023 | Decisão de estilo (monólito modular × microsserviços) | ADR |
| 024 | Modelo de multi-tenancy | ADR/Doc 08 |
| 025 | Modelagem de dados | Doc 08 |
| 026 | Estratégia de Serial Number | ADR/Doc 08 |
| 027 | Design de microsserviços | Doc 09 |
| 028 | Contratos de API (API-first) | Doc 09 |
| 029 | Mensageria e eventos | Doc 09 |
| 030 | Estratégia de segurança (Zero Trust) | Doc 14 |
| 031 | Estratégia de observabilidade | Doc 19 |
| 032 | Padrões de código e camadas | Doc 10 |
| 033 | Design system (base) | Doc 11 |
| 034 | Arquitetura mobile | Doc 12 |
| 035 | Revisão arquitetural (auditoria) | Checkpoint |

### Fase 3 — Construção do Produto (036–060)
| # | Etapa | Entregável |
|---|---|---|
| 036 | Núcleo de identidade e acesso | Backend |
| 037 | Módulo multiempresa | Backend |
| 038 | Cadastro de equipamentos (SN) | Backend |
| 039 | Histórico vitalício por SN | Backend |
| 040 | Ordens de serviço | Backend |
| 041 | APIs do ERP | Backend |
| 042 | Painel do Fabricante | Frontend |
| 043 | Painel da Revenda | Frontend |
| 044 | Portal Administrativo | Frontend |
| 045 | App do Cliente (base) | Mobile |
| 046 | App do Técnico (base) | Mobile |
| 047 | Autenticação e perfis (UI) | Frontend/Mobile |
| 048 | Fluxo de OS ponta a ponta | Produto |
| 049 | Integração front↔API | Produto |
| 050 | Design system aplicado | Frontend |
| 051 | Notificações | Backend |
| 052 | Uploads e documentos | Backend |
| 053 | Auditoria de eventos (base) | Backend/KCD |
| 054 | API pública v1 | Backend |
| 055 | Webhooks | Backend |
| 056 | Testes de integração (base) | QA |
| 057 | Ambiente de homologação | DevOps |
| 058 | Seed de dados/demo | DevOps |
| 059 | Hardening inicial | KCD |
| 060 | Revisão de produto (auditoria) | Checkpoint |

### Fase 4 — Inteligência, Segurança e Estoque (061–078)
| # | Etapa | Entregável |
|---|---|---|
| 061 | KCI — Knowledge Base | Doc 13 |
| 062 | KCI — RAG local | Doc 13 |
| 063 | KCI — Sistema especialista | Doc 13 |
| 064 | KCI — OCR / Visão computacional | Doc 13 |
| 065 | KCI — Motor preditivo | Doc 13 |
| 066 | KCI — Motor generativo + IA externa opcional | Doc 13 |
| 067 | KCI — Diagnóstico integrado à OS | Produto |
| 068 | KCD — Firewall/criptografia | Doc 14 |
| 069 | KCD — SOC e logs | Doc 14 |
| 070 | KCD — Threat detection | Doc 14 |
| 071 | KCD — Backups e DR | Doc 14 |
| 072 | KSI — Estoque e movimentações | Doc 15 |
| 073 | KSI — Código de barras/QR/RFID/NFC | Doc 15 |
| 074 | KSI — Reposição automática/Curva ABC | Doc 15 |
| 075 | KSI — Previsão e integração financeira | Doc 15 |
| 076 | BI — Dashboards e indicadores | Doc 16 |
| 077 | CRM e Financeiro (integração) | Docs 17/18 |
| 078 | Revisão de módulos (auditoria) | Checkpoint |

### Fase 5 — Operação e Qualidade (079–090)
| # | Etapa | Entregável |
|---|---|---|
| 079 | Pipeline CI/CD | Doc 19 |
| 080 | Infraestrutura como código | Doc 19 |
| 081 | Observabilidade (logs/métricas/tracing) | Doc 19 |
| 082 | Estratégia de testes completa | Doc 20 |
| 083 | Testes automatizados (cobertura) | Doc 20 |
| 084 | Testes de segurança/pentest | Doc 20/14 |
| 085 | Performance e carga | Doc 20 |
| 086 | Plano de implantação | Doc 21 |
| 087 | Migrações e rollout | Doc 21 |
| 088 | Runbooks e on-call | Doc 19 |
| 089 | Auditoria contínua | KCD |
| 090 | Go-live readiness (auditoria) | Checkpoint |

### Fase 6 — Negócio e Expansão (091–100)
| # | Etapa | Entregável |
|---|---|---|
| 091 | Modelo de negócio e precificação | Doc 22 |
| 092 | Go-to-market | Doc 22 |
| 093 | Marketing e posicionamento | Doc 22 |
| 094 | Onboarding de clientes | Doc 22 |
| 095 | Suporte e SLAs | Doc 22 |
| 096 | Internacionalização (i18n/moeda) | Doc 23 |
| 097 | Conformidade por país | Doc 23 |
| 098 | Escala e multi-região | Doc 24 |
| 099 | Governança de produto e evolução | Doc 24 |
| 100 | Roadmap de próximas versões | Doc 24 |

## 7. Fluxograma de Dependências (macro)
```
F1 Requisitos → F2 Arquitetura → F3 Produto → F4 Módulos → F5 Operação → F6 Negócio
                     │                              │
                  (ADRs)                     (KCI/KCD/KSI)
```

## 8. Boas Práticas
- Fechar cada fase com checkpoint de auditoria e atualização do Bible.
- Não iniciar código antes da Fase 3.

## 9. Padrões
- Numeração fixa de 001 a 100; entregável e critério de aceite por etapa.

## 10. Casos de Uso do Roadmap
- Planejamento de sprint a partir das etapas.
- Relatório de progresso via estado das etapas (Bible).

## 11. Modelagem — Estado da Etapa
`pendente → em produção → concluída → auditada`

## 12. Checklist
- ☑ 100 etapas definidas.
- ☑ 6 fases com dependências.
- ☑ Entregáveis mapeados aos documentos.

## 13. Riscos
- **Escopo crescente** → revisão constitucional/Bible.
- **Dependências ignoradas** → respeitar a ordem de fases.

## 14. Melhorias Futuras
- Estimativas de esforço por etapa.
- Marcos (milestones) com datas-alvo.

## 15. Auditoria
- **Consistência:** ✔ com escopo do Bible.
- **Estado:** v1.0 aprovado; espelhado no Bible §9.

---
*Fim do `03 — Roadmap` · v1.0*
