# 10 — Plano de monetização e posicionamento

> Como o JardimJá ganha dinheiro, hoje e no futuro; como se posiciona como marca; e a
> economia de cada transação. Números casam com o [motor de precificação](05-pricing-engine.md)
> (comissão de 10%, take-rate de surge) e alimentam o [plano financeiro](11-financial-plan.md).

---

## 1. Tese de negócio em uma frase

Jardinagem no Brasil é um mercado **grande, fragmentado e informal**: milhões de casas,
condomínios e empresas com jardim; oferta pulverizada de jardineiros autônomos sem
marca, sem agenda, sem precificação padronizada; e um cliente que não sabe quanto o
serviço "deveria" custar. O JardimJá resolve os **três atritos** de uma vez —
**descoberta** (marketplace), **confiança de preço** (orçamento por IA auditável) e
**pagamento/garantia** (split + acompanhamento) — e cobra uma fatia do valor que
destrava.

---

## 2. Modelo de receita

### 2.1 Fonte primária — comissão de marketplace (take rate)

A plataforma retém **`platformFeePercent = 10%`** de cada transação
([`config.ts`](../packages/pricing-engine/src/config.ts)), calculada sobre o `total` e
já devolvida no `Quote` como `platformFeeCents`; o jardineiro recebe `gardenerNetCents`
([`quote.ts`](../packages/shared/src/quote.ts)). É a única fonte no MVP e a espinha
dorsal para sempre.

- **Por que 10%** — abaixo dos ~15–30% de marketplaces de serviço maduros, de propósito:
  na fase de cold-start ([doc 12](12-user-acquisition.md)) a prioridade é **liquidez**,
  não margem. O jardineiro precisa ganhar claramente mais líquido do que ganharia sozinho.
- **Cobrança** — embutida no preço ao cliente e retida no split automático (escrow →
  `PaymentStatus.SPLIT`, ver [`enums.ts`](../packages/shared/src/enums.ts)). Zero
  fricção de faturamento.

### 2.2 Take-rate de surge (variável, mesmo trilho)

Em janelas de escassez, o `surgeMultiplier` eleva o `total` até **+35%**
([doc 05, §3](05-pricing-engine.md#3-surge-de-ofertademanda)). A comissão de 10% incide
sobre o valor já elevado, então **a receita por transação cresce mais que o GMV** nesses
momentos, sem mudar a alíquota. O surge também é um **instrumento de balanceamento de
mercado** (puxa mais jardineiros para as janelas quentes), não só de receita.

### 2.3 Fontes futuras (roadmap de monetização)

Ativadas conforme a liquidez amadurece (ver [`13-roadmap.md`](13-roadmap.md)):

| # | Linha | Modelo | Quando | Racional |
| --- | --- | --- | --- | --- |
| 1 | **Assinatura mensal — condomínios** | recorrência fixa (áreas comuns) | Next | Receita previsível, alto LTV, um síndico traz N unidades. |
| 2 | **Planos empresa / prefeituras (B2B)** | contrato + SLA | Later | Praças, escolas, campi; ticket alto, ciclo longo. |
| 3 | **Gestão recorrente (casas)** | assinatura (corte quinzenal/mensal) | Next | Converte serviço avulso em receita recorrente; melhora retenção. |
| 4 | **Seguro / garantia** | taxa sobre o serviço ou prêmio | Later | "Garantia JardimJá" — cobre retrabalho/dano; margem e confiança. |
| 5 | **Destaque pago p/ jardineiros** | ads / assinatura de visibilidade | Next | Take-rate secundário do lado da oferta; não distorce o match orgânico. |
| 6 | **Venda de insumos** | markup / comissão de fornecedor | Later | Adubo, mudas, defensivos — carrinho anexo ao serviço. |
| 7 | **Dados / BI** | relatórios agregados e anônimos | Later | Preços regionais, sazonalidade, demanda por espécie — para viveiros, indústria de insumos, seguradoras. Sempre agregado e conforme [LGPD](06-security-lgpd.md). |

**Sequência recomendada**: (1) cravar os 10% + liquidez → (2) assinaturas recorrentes
(casas e condomínios) + destaque pago → (3) B2B/prefeitura, seguro, insumos, dados.
Nunca introduzir uma linha nova antes de o marketplace ter liquidez local (ver métricas
em [doc 12](12-user-acquisition.md)).

---

## 3. Posicionamento de marca

**Posicionamento**: *"O jeito confiável de cuidar do seu jardim — orçamento na hora,
profissional de verdade, você acompanha do celular."* Os três pilares de mensagem são
**rapidez** ("já"), **confiança de preço** (IA que explica cada centavo) e
**profissional próximo e avaliado**.

**Personalidade**: prática, brasileira, verde-tech sem ser fria. Fala com dona de casa,
síndico e jardineiro autônomo — não com "early adopter de app".

### Nome

O repositório usa **JardimJá** como nome de produto e recomenda mantê-lo. Avaliação da
equipe de produto ([README](../README.md)):

| Nome | Prós | Contras | Veredito |
| --- | --- | --- | --- |
| **JardimJá** | memorável, descritivo, transmite urgência ("faça já"), pt-BR nativo | dois "j", acento no domínio | **Recomendado — marca de produto** |
| Verdo | curto, brandável, "verde" | genérico, pouco específico de jardim | reserva defensiva |
| Podô | curto, remete a "poda", divertido | acento, significado estreito (poda) | reserva |
| Raizz | evoca "raiz", moderno | grafia ambígua na fala | reserva |
| Jardo | curto, deriva de "jardim" | frio, sem significado próprio | reserva |
| GreenGo | internacional, dinâmico | anglófono, pouca conexão local | descartado p/ Brasil |
| Capim | muito brasileiro, informal | conotação de "mato"/negativa | descartado |

**Recomendação**: manter **JardimJá** como marca de produto; registrar
**`jardimja.com.br`** + variações defensivas (`jardimja.com`, `jardimjá.com.br`,
`jardim-ja.com.br`) e as marcas alternativas (Verdo, Raizz) no INPI como proteção. A
marca de produto pode divergir da razão social.

---

## 4. Planos e tiers

| Plano | Público | Preço | O que inclui |
| --- | --- | --- | --- |
| **Avulso** (Pay-per-job) | qualquer cliente | grátis p/ usar · **10%** no serviço | orçamento por IA, marketplace, acompanhamento, split, avaliação |
| **JardimJá Recorrente** | casas | assinatura (ex. R$0 de mensalidade, prioridade + desconto de 5% no serviço) | agenda recorrente (corte quinzenal/mensal), mesmo profissional, cobrança automática |
| **JardimJá Condomínio** | síndicos / administradoras | mensalidade por m² de área comum | áreas comuns, relatório mensal, SLA, gestor de conta |
| **JardimJá Empresas / Gov** | empresas, prefeituras | contrato sob medida + SLA | praças/campi/escolas, faturamento, compliance, painel de BI |
| **Jardineiro Pro** (lado da oferta) | jardineiros | assinatura opcional | destaque na busca, selo verificado, insights de preço, prioridade de match |

O plano avulso é sempre gratuito para entrar — **a monetização segue o valor
transacionado**, não a entrada. Os tiers recorrentes trocam parte da comissão por
**previsibilidade e retenção**.

---

## 5. Economia unitária por transação

Base: **ticket médio (GMV/job) de R$300** no MVP (o worked example de R$545 é um job
grande; a mediana real de "corte de grama" é menor). Premissas alinhadas ao
[plano financeiro](11-financial-plan.md).

| Item | Valor | Nota |
| --- | --- | --- |
| GMV por job (ticket médio) | **R$300,00** | valor pago pelo cliente |
| Take rate | 10% | `platformFeePercent` |
| **Receita bruta (take)** | **R$30,00** | o que a plataforma reconhece |
| (−) Taxa de pagamento | −R$3,60 a −R$6,00 | PIX ~1% · cartão ~2% (sobre o GMV) |
| (−) Custo de IA / análise | −R$0,30 | 3 providers, `detail:'low'` ([doc 04, §11](04-ai-pipeline.md#11-custo-e-lat%C3%AAncia)) |
| (−) Infra atribuível / job | −R$0,60 | cloud, storage de fotos, filas |
| **Margem de contribuição** | **≈ R$19–25** | **~65–80% do take**, por job |

> A taxa de pagamento incide sobre o **GMV inteiro** (a plataforma processa o valor
> total e faz o split), por isso é o maior custo variável. Migrar volume para **PIX**
> (≈1%) em vez de cartão (≈2%) é a alavanca #1 de margem — daí o incentivo a PIX no
> checkout ([`PaymentMethod`](../packages/shared/src/enums.ts)).

### Intuição de payback de CAC

Com margem de contribuição de ~R$20/job e um cliente que faz jardinagem em média
**3–6 vezes/ano** (recorrência é a tese), o valor por cliente/ano é ~R$60–120 de
contribuição. Um **CAC de R$25–40** ([alvos por canal no doc 12](12-user-acquisition.md#5-cac-alvo-por-canal))
se paga em **1–3 jobs**, ou seja, **dentro dos primeiros meses** — desde que a
**retenção** segure. É por isso que assinatura/recorrência (§2.3) não é "linha extra":
é o que transforma um payback aceitável num LTV/CAC saudável (ver [doc 11](11-financial-plan.md#6-m%C3%A9tricas-de-neg%C3%B3cio)).

---

## 6. Alavancas de monetização (o que mexer, e o efeito)

| Alavanca | Efeito na receita | Efeito colateral a vigiar |
| --- | --- | --- |
| Take rate (hoje 10%) | linear na receita | acima de ~15% cedo mata liquidez do lado da oferta |
| Surge (até +35%) | receita > GMV nas janelas quentes | percepção de "preço dinâmico"; comunicar bem |
| Mix PIX vs cartão | +1 p.p. de margem por job migrado a PIX | UX de checkout |
| Assinaturas | receita previsível + retenção | canibaliza parte da comissão avulsa |
| Destaque pago (oferta) | take-rate secundário | não pode distorcer o match orgânico/qualidade |
| B2B/gov | ticket alto, previsível | ciclo de venda longo, exige SLA e faturamento |

---

## 7. O que **não** monetizar (guardrails)

- **Não** cobrar do cliente para pedir orçamento — a IA é isca de aquisição, não paywall.
- **Não** vender dados pessoais nem imagens de jardins; BI só **agregado e anônimo**,
  sob [LGPD](06-security-lgpd.md).
- **Não** subir take-rate antes de liquidez local comprovada — mata o lado da oferta.
- **Não** deixar destaque pago sobrepor qualidade/avaliação no ranking de match.

---

### Referências cruzadas
- [`05-pricing-engine.md`](05-pricing-engine.md) — de onde saem os 10% e o surge.
- [`11-financial-plan.md`](11-financial-plan.md) — projeção de GMV, receita e margem.
- [`12-user-acquisition.md`](12-user-acquisition.md) — CAC por canal e liquidez.
- [`13-roadmap.md`](13-roadmap.md) — quando cada linha de receita entra.
</content>
