# ADR-001 · Arquitetura e stack

**Data:** 18/08/2026 · **Status:** aceito · **Fase:** 0

## Contexto

O proprietário escolheu três opções que, tomadas ao pé da letra, se contradizem:

1. **Supabase + React PWA** — Supabase é Postgres gerenciado em nuvem.
2. **Instalado na loja de cada cliente** — o oposto de SaaS multi-tenant.
3. **Emissão fiscal própria via ACBr** — ACBr é biblioteca Windows; não roda em navegador.

O briefing, porém, exige explicitamente SaaS multi-tenant com RLS (item 2), PWA
instalável (item 41) e modo offline no PDV (item 42).

## Decisão

Arquitetura **híbrida nuvem + agente local**, que satisfaz as três escolhas sem
contradição:

| Camada | Onde roda | Responsabilidade |
|---|---|---|
| **Banco e API** | Supabase (nuvem) | Postgres multi-tenant com RLS, auth, storage, realtime |
| **Interface** | PWA React | Uma interface para PC, tablet e celular; instalável; cache offline |
| **Agente local** | Windows, na loja | ACBr (NFe/NFCe/SAT), certificado A1, impressora fiscal, gaveta, balança |
| **Fila offline** | IndexedDB no PWA + agente | Venda continua durante queda de internet; sincroniza ao voltar |

**O que "instalado na loja" passa a significar:** instala-se o *agente local*
(pequeno serviço Windows), não o ERP inteiro. O sistema segue sendo um só,
atualizado de uma vez para todos os clientes.

## Justificativa

- **Postgres com RLS** entrega o isolamento exigido no item 2 no nível do banco,
  não do frontend. Uma falha de código na interface não vaza dado entre empresas.
- **Emissão fiscal exige Windows.** ACBr, certificado A1 e impressora fiscal não
  existem no navegador. O agente local é obrigatório nesse caminho — não é escolha.
- **Modo offline** fica natural: o agente é a autoridade local do caixa enquanto a
  nuvem estiver inacessível.
- **Portabilidade preservada.** Supabase é open source e auto-hospedável; o schema
  é Postgres padrão. Sair da nuvem é mudança de infraestrutura, não reescrita.

## Consequências

**Positivas**
- Um código-fonte para todos os clientes; atualização única.
- Isolamento verificável por teste automatizado (`supabase/tests/`).
- Caixa não para quando a internet cai.

**Negativas / custos aceitos**
- Um instalador Windows a manter e distribuir.
- Emissão própria implica assumir homologação por estado, gestão de certificado e
  acompanhamento de Notas Técnicas — inclusive da Reforma Tributária.
- Sincronização offline exige resolução de conflito, projetada na Fase 5.

## Alternativas descartadas

- **Só nuvem, sem agente:** inviabiliza NFCe/SAT e impressora fiscal.
- **Só local, por loja:** reproduz o problema do G3 legado — cada atualização vira
  visita técnica, e foi o que travou a produtividade do sistema anterior.
- **Provedor fiscal por API:** eliminaria o risco de homologação, mas foi
  descartado pelo proprietário por custo por documento. Revisável na Fase 7.

## Riscos declarados

| Risco | Mitigação |
|---|---|
| Homologação estadual da NFCe é demorada | Iniciar homologação no começo da Fase 7, em paralelo ao desenvolvimento |
| Reforma Tributária muda leiautes em 2026 | Regras versionadas com vigência desde a Fase 7; atualizar é inserir linha |
| Agente local desatualizado na loja | Autoatualização do agente + verificação de versão mínima pela nuvem |
