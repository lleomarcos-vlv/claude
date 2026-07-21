# 01 — Constituição do Projeto · Drone Kairós ERP

**Documento:** `01 — Constituição do Projeto`
**Versão:** 1.0 · **Data:** 21 de julho de 2026 · **Status:** Ativo
**Dependências:** `00 — Master Prompt`
**Responsável:** CTO / Analista de Produto

---

## 1. Resumo Executivo

Esta Constituição é a **lei fundamental** do Drone Kairós ERP. Ela fixa a razão de existir do produto, os valores inegociáveis, os direitos e deveres de cada perfil de usuário e as cláusulas que nenhuma fase posterior pode violar. Enquanto o `00 — Master Prompt` define **como a IA trabalha**, esta Constituição define **o que o produto é** e **os limites que ele nunca cruza**.

## 2. Objetivos

- Estabelecer visão, missão e valores permanentes.
- Definir os princípios de produto e de engenharia inegociáveis.
- Declarar os direitos dos usuários e as garantias da plataforma.
- Servir de critério de desempate quando escopo e prioridades entrarem em conflito (subordinada apenas ao Project Bible).

## 3. Escopo

Aplica-se a **toda** a plataforma: ERP, aplicativos, painéis, portais, CRM, financeiro, BI, API pública e os módulos KCI, KCD e KSI. Vale para todas as fases do roadmap e todos os documentos subsequentes.

## 4. Cláusulas Constitucionais (Regras)

### Artigo I — Propósito
O Drone Kairós ERP existe para ser a **plataforma de gestão definitiva do ecossistema de drones**, cobrindo o ciclo de vida completo do equipamento — do fabricante à revenda, ao técnico e ao cliente — com rastreabilidade vitalícia por Serial Number.

### Artigo II — Valores Permanentes
1. **Excelência de engenharia** acima de atalhos.
2. **Confiança**: segurança e privacidade como direito, não recurso.
3. **Rastreabilidade**: nada acontece sem registro.
4. **Autonomia**: o produto funciona mesmo offline onde for crítico.
5. **Escala internacional** desde o primeiro dia de arquitetura.

### Artigo III — Princípios de Produto
- Cada perfil (fabricante, revenda, técnico, cliente, administrador) tem uma experiência dedicada e coerente.
- O Serial Number é a identidade universal do equipamento.
- Decisões de negócio são auditáveis e reversíveis quando possível.

### Artigo IV — Princípios de Engenharia
- **Arquitetura antes de código.**
- **DDD** e fronteiras de contexto explícitas.
- **Multiempresa** como requisito de primeira classe.
- **Segurança por padrão** (princípios do KCD desde o design).
- **Contratos de API primeiro.**

### Artigo V — Direitos do Usuário
- Direito à **portabilidade** e à **transparência** sobre seus dados.
- Direito ao **histórico completo** do seu equipamento.
- Direito à **segurança** (criptografia, auditoria, isolamento multiempresa).

### Artigo VI — Cláusulas Pétreas (imutáveis)
1. O Project Bible é a fonte única de verdade.
2. Nenhuma decisão contradiz o Bible sem atualizá-lo e justificá-lo.
3. Nenhum código é escrito antes da arquitetura correspondente.
4. Toda decisão arquitetural relevante vira ADR.

## 5. Arquitetura de Governança

```
Master Prompt (00)  →  como a IA age
        │
Constituição (01)   →  o que o produto é / limites inegociáveis
        │
Project Bible (02)  →  fonte de verdade viva (estado + decisões)
        │
Documentos 03–24    →  detalhamento por domínio
        │
ADRs (/adr)         →  memória das decisões
```

## 6. Diagramas — Hierarquia de Autoridade

```
[Cláusulas Pétreas]  (nunca mudam)
        ▲
[Constituição 01]    (muda só por revisão formal)
        ▲
[Project Bible 02]   (evolui continuamente, registrando decisões)
        ▲
[Demais documentos]  (obedecem aos níveis acima)
```

## 7. Fluxogramas — Emenda Constitucional
```
Proposta de mudança → Avaliar contra Cláusulas Pétreas
   ├─ Fere cláusula pétrea? → REJEITAR
   └─ Não fere → Registrar no Bible → Atualizar Constituição → Propagar
```

## 8. Boas Práticas
- Reler esta Constituição no início de fases sensíveis (arquitetura, segurança, dados).
- Tratar conflito de escopo como questão constitucional antes de decisão técnica.

## 9. Padrões
- Toda cláusula é numerada e versionada.
- Mudanças relevantes incrementam a versão e são anotadas no histórico.

## 10. Casos de Uso
- **Conflito de prioridade** entre velocidade e segurança → vence a segurança (Artigo II.2).
- **Pedido para pular arquitetura** → negado por cláusula pétrea (Artigo VI.3).

## 11. Modelagem — Perfis e Direitos (visão)
| Perfil | Direito central | Garantia |
|---|---|---|
| Fabricante | Rastreabilidade de produção | Serial Number vitalício |
| Revenda | Gestão de vendas/pós-venda | Isolamento multiempresa |
| Técnico | Diagnóstico e serviço | KCI offline-first |
| Cliente | Histórico do equipamento | Transparência de dados |
| Administrador | Governança global | Auditoria contínua (KCD) |

## 12. Checklist
- ☑ Visão, missão e valores declarados.
- ☑ Princípios de produto e engenharia fixados.
- ☑ Cláusulas pétreas definidas.
- ☑ Hierarquia de autoridade estabelecida.

## 13. Riscos
- **Erosão de escopo** sem revisão constitucional → mitigado pela hierarquia de autoridade.
- **Decisões técnicas ferindo valores** → mitigado tratando conflito como questão constitucional.

## 14. Melhorias Futuras
- Anexar política formal de privacidade e conformidade (LGPD/GDPR) ao Artigo V.
- Formalizar processo de revisão constitucional periódica.

## 15. Auditoria
- **Consistência com Master Prompt:** ✔ alinhada.
- **Pendências:** conformidade legal detalhada será tratada em `23 — Internacionalização`.
- **Estado:** aprovada como v1.0; base para o Project Bible.

---
*Fim do `01 — Constituição do Projeto` · v1.0*
