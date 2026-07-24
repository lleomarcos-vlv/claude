# ADR-0005 — KCI: diagnóstico por motor de regras offline

**Status:** Aceito (provisório, Fase 4 · etapas 061-067) · **Data:** 22 de julho de 2026
**Relacionado:** doc 13 (Kairós Core Intelligence)

## Contexto
O KCI precisa oferecer **diagnóstico assistido** já na fatia atual do produto,
respeitando dois princípios do doc 13 e da Constituição: **offline-first**
(operar em campo sem nuvem) e **sem dependência obrigatória de IA externa**. O
volume atual de dados não justifica (nem permite) treinar modelos.

## Decisão
1. **Sistema especialista baseado em regras.** Uma base de conhecimento curada
   ({sintomas} → causa provável, ações, peças) roda um motor determinístico que
   casa os sintomas informados e ordena as hipóteses por **confiança** (fração de
   sintomas da regra explicados).
2. **Base em código nesta fase.** As regras vivem em `BaseConhecimentoKci`
   (versionada, auditável, testável), não num banco — simples e 100% offline.
3. **Integração à OS (etapa 067).** O diagnóstico pode ser disparado por uma OS;
   a hipótese principal vira **evento no histórico vitalício** do equipamento e
   entra na auditoria.

## Alternativas consideradas
- **LLM/IA externa (ex.: API de terceiros):** rejeitada como base — fere o
  offline-first e o "IA externa é opcional". Fica como *enriquecimento* futuro,
  atrás de uma flag, quando houver conectividade.
- **Modelo preditivo (ML) agora:** adiado — sem dados históricos rotulados
  suficientes; entra na etapa 065 quando a base de eventos crescer.
- **Base de regras em banco editável:** adiada; começa em código pela
  simplicidade e determinismo, migra para Knowledge Base + RAG local (doc 13).

## Consequências
- (+) Diagnóstico útil, explicável e testável, funcionando offline e sem custo
  de inferência externa. Determinístico (fácil de auditar/validar).
- (+) Caminho claro de evolução: Knowledge Base editável → RAG local → motor
  preditivo → motor generativo (fluxo do doc 13), sem quebrar a API.
- (−) Cobertura limitada ao conhecimento curado; exige manutenção das regras.

## Pendências que este ADR cria
- [ ] Knowledge Base editável (por tenant) + versionamento das regras.
- [ ] RAG local sobre manuais/histórico; motor preditivo (etapa 065).
- [ ] IA externa opcional (enriquecimento) atrás de flag, com conectividade.
- [ ] Realimentação: usar o desfecho das OS para ajustar as confianças.
