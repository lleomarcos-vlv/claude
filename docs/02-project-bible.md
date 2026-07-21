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
| D-005 | Segurança por padrão (KCD desde o design) | Confiança é direito, não recurso | ADR-0004 (pendente) |

> Os ADRs formais serão criados nas fases de arquitetura e dos módulos.

## 8. Estado dos Documentos
| Doc | Status |
|---|---|
| 00 Master Prompt | ✅ Concluído v1.0 |
| 01 Constituição | ✅ Concluído v1.0 |
| 02 Project Bible | ✅ Ativo v1.0 (este) |
| 03 Roadmap | 🟡 Em produção |
| 04–24 | ⬜ Pendentes (produção em ondas) |

## 9. Estado do Roadmap (macro)
| Fase | Etapas | Status |
|---|---|---|
| 1 · Descoberta e Requisitos | 001–020 | ⬜ |
| 2 · Arquitetura e Fundações | 021–035 | ⬜ |
| 3 · Construção do Produto | 036–060 | ⬜ |
| 4 · Inteligência/Segurança/Estoque | 061–078 | ⬜ |
| 5 · Operação e Qualidade | 079–090 | ⬜ |
| 6 · Negócio e Expansão | 091–100 | ⬜ |

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
