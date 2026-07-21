# ADR-0001 — Monólito modular (DDD) evoluindo para microsserviços

**Status:** Aceito · **Data:** 21 de julho de 2026 · **Fase:** 3 (início)
**Relacionado:** docs 07 (Arquitetura), 09 (Microsserviços), 10 (Backend)

## Contexto
O Drone Kairós ERP tem múltiplos bounded contexts (tenancy, equipamento/SN,
ordens de serviço, estoque/KSI, financeiro, CRM, KCI, KCD…). Começar já como
malha de microsserviços aumentaria muito o custo operacional inicial sem
benefício proporcional enquanto o domínio ainda amadurece.

## Decisão
Iniciar como **monólito modular** organizado por bounded contexts em pacotes
isolados (`com.kairos.erp.<contexto>` com subcamadas `domain`/`app`/`web`),
com fronteiras explícitas e comunicação entre contextos via serviços de
aplicação. Extrair microsserviços **sob demanda**, guiados por gatilhos
objetivos (escala independente, cadência de deploy, ownership de time).

## Alternativas consideradas
- **Microsserviços desde o início:** rejeitado pelo custo operacional e risco
  de fronteiras erradas antes de o domínio estabilizar.
- **Monólito não-modular:** rejeitado por comprometer a futura extração.

## Consequências
- (+) Velocidade inicial e transações locais simples.
- (+) Fronteiras já desenhadas facilitam a extração futura.
- (−) Exige disciplina para não criar acoplamento entre contextos — mitigado
  por revisão de arquitetura e testes.
