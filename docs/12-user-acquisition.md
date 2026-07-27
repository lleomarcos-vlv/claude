# 12 — Estratégia de aquisição de usuários (Go-to-Market)

> Como o JardimJá resolve o **cold-start de um marketplace de duas pontas**, cidade
> por cidade, começando por **São Paulo**. Canais, custos-alvo (CAC), loops de
> indicação, retenção e as métricas de liquidez que decidem quando escalar. Casa com
> o [plano financeiro](11-financial-plan.md) e a [monetização](10-monetization.md).

---

## 1. O problema central: o ovo e a galinha, localmente

Marketplace de serviço presencial **não tem efeito de rede global** — tem **efeito de
rede local**. Um cliente em Pinheiros não é atendido por um jardineiro em Fortaleza. A
liquidez precisa ser construída **bairro a bairro, cidade a cidade**:

- Sem jardineiros → o cliente pede orçamento, ninguém responde → churn e má reputação.
- Sem clientes → o jardineiro baixa o app, não recebe job → desinstala.

**Regra de ouro do JardimJá: semear a oferta primeiro.** É mais fácil segurar
jardineiros ociosos por algumas semanas (com bounty e promessa de demanda) do que
recuperar um cliente que teve a péssima primeira experiência de "ninguém respondeu".
A IA de orçamento ([doc 04](04-ai-pipeline.md)) ajuda: o cliente já recebe **valor
imediato** (o laudo + preço) mesmo antes de haver oferta densa.

---

## 2. Playbook de lançamento city-by-city (São Paulo primeiro)

Por que **São Paulo**: maior densidade de jardins residenciais + condomínios, maior
massa de jardineiros autônomos, maior poder de compra e o `cityCostIndex` mais alto
(1,25 — [doc 05](05-pricing-engine.md#2-as-chaves-de-configura%C3%A7%C3%A3o-pricingconfig)),
ou seja, ticket e contribuição maiores por job.

Sequência de bairros (não a cidade toda de uma vez): começar por **1–2 regiões de alta
densidade** (ex.: zona oeste — Pinheiros, Butantã, Vila Madalena; e um cinturão de
condomínios) e adensar antes de espalhar. Liquidez concentrada > cobertura rala.

**Fases por cidade**

| Fase | Objetivo | Ação |
| --- | --- | --- |
| **−30 a 0 dias** | Semear oferta | Recrutar 50–150 jardineiros por bairro-alvo (§3), onboarding, verificação, garantir equipamento. |
| **Semana 0 (soft launch)** | Primeira liquidez | Abrir demanda controlada (indicações, micro-ads geo). Meta: toda solicitação recebe ≥1 oferta em < 30 min. |
| **Semanas 1–6 (ramp)** | Densidade | Ligar canais de demanda (§4), medir liquidez (§6), ajustar bounty da oferta conforme o gargalo. |
| **Semana 6+ (scale)** | Autossustentar | Se **match rate > 80%** e **LTV/CAC > 4**, aumentar budget e abrir o próximo bairro/cidade. |

**Gate de expansão**: só abrir a próxima cidade quando a atual atingir os limiares de
liquidez (§6). Escalar um mercado sem liquidez multiplica o churn.

---

## 3. Aquisição da oferta (jardineiros)

O lado mais barato e mais estratégico. Jardineiros autônomos são numerosos, sub-ocupados
e **sem canal digital de clientes** — o JardimJá é uma máquina de demanda para eles.

| Canal | Tática | Custo/observação |
| --- | --- | --- |
| **Associações e sindicatos** | Parcerias com associações de jardineiros/paisagistas, cooperativas, SENAR/SENAC | baixo CAC, alta confiança |
| **Grupos de WhatsApp / Facebook** | Grupos locais de jardinagem, bairro, "bicos" | ~zero custo, alto volume |
| **Bounty de indicação (jardineiro→jardineiro)** | R$50–100 por jardineiro ativado (fez N jobs) | pago só na ativação |
| **Lojas de insumos / aluguel de equipamento** | Panfleto/QR em agropecuárias, locadoras de roçadeira | contextual, barato |
| **Field recruiting** | Abordagem em praças/condomínios onde já trabalham | alto toque, alta qualidade |
| **Selo "Jardineiro Pro" / verificado** | Status + destaque como incentivo de adesão | retenção da oferta |

**Onboarding da oferta**: cadastro simples no app profissional (Flutter), verificação de
identidade, foto, área de atuação e equipamento (`Equipment` em
[`enums.ts`](../packages/shared/src/enums.ts)) — o que também **melhora o match** e a
precificação. Meta: jardineiro do cadastro ao primeiro job em **< 48h**.

**Reter a oferta na fase magra**: garantir um mínimo de jobs (concentrar demanda nos
primeiros jardineiros), pagamento rápido (split automático → líquido claro), e
transparência de preço (o jardineiro vê o `trace` e a faixa — [doc 05, §8](05-pricing-engine.md#8-auditabilidade--o-trace)).

---

## 4. Aquisição da demanda (clientes)

| Canal | Tática | CAC-alvo | Nota |
| --- | --- | --- | --- |
| **SEO local** | "jardineiro em [bairro]", "corte de grama [cidade]", páginas por bairro/serviço | R$5–15 | melhor CAC de longo prazo; compõe |
| **Google Ads (Search)** | intenção alta ("jardineiro perto de mim") | R$20–40 | liga rápido, para na hora |
| **Meta Ads (FB/IG)** | criativo antes/depois, geo-targeting por bairro | R$25–45 | ótimo para awareness + retargeting |
| **Parcerias com condomínios** | síndico e administradoras (áreas comuns + moradores) | R$10–25 | **canal-chave**: um síndico → dezenas de unidades |
| **Canal do síndico** | apps/associações de síndicos, feiras de condomínio | R$10–20 | B2B2C de alto alavanque |
| **Influenciadores locais / "casa e jardim"** | conteúdo de transformação de jardim | variável | prova social, awareness |
| **Conteúdo (blog/IG/TikTok)** | dicas de jardinagem, calendário de poda, "quanto custa…" | baixo | atrai orgânico + confia na IA de preço |
| **Indicação (cliente→cliente)** | crédito para quem indica e para o indicado | R$15–30 | loop viral (§5) |

**Gancho de conversão único**: o **orçamento por IA grátis e instantâneo**. Diferente
de concorrentes ("solicite e espere retorno"), o cliente **fotografa e vê preço + laudo
na hora** ([doc 04](04-ai-pipeline.md)). Isso vira o CTA de toda campanha: *"Fotografe
seu jardim e receba o orçamento em segundos."*

---

## 5. Loops de indicação e retenção

### Referral (dois lados)
- **Cliente→Cliente**: R$X de crédito para quem indica **e** para o indicado (double-sided),
  liberado no primeiro job pago. Barato e mensurável (menor CAC da tabela).
- **Jardineiro→Jardineiro**: bounty de ativação (§3).
- **Cliente→Jardineiro**: cliente convida seu jardineiro atual para a plataforma — traz
  oferta **e** demanda de uma vez (o jardineiro chega com clientes).

### Retenção — de avulso para recorrente
A retenção é a variável de maior impacto no [LTV/CAC](11-financial-plan.md#6-m%C3%A9tricas-de-neg%C3%B3cio).
Jardinagem é **naturalmente recorrente** (a grama sempre volta a crescer):

- **Assinatura de corte** (quinzenal/mensal) com o mesmo profissional — a IA sugere a
  cadência a partir de `grassHeightCm`/`RETIRADA_FOLHAS` ([doc 04, §10](04-ai-pipeline.md#10-ia-conversacional--da-inten%C3%A7%C3%A3o-ao-servi%C3%A7o)).
- **Lembretes sazonais** (poda de inverno, adubação de primavera) via notificação.
- **Relacionamento profissional↔cliente**: reencontrar o mesmo jardineiro aumenta NPS e
  frequência.
- **Assinaturas de condomínio** (áreas comuns) — o contrato recorrente de maior LTV
  ([doc 10, §2.3](10-monetization.md#23-fontes-futuras-roadmap-de-monetiza%C3%A7%C3%A3o)).

---

## 6. Métricas de liquidez e marketplace a acompanhar

O painel Admin/BI (React) deve tratar estas como métricas de primeira classe — são elas
que dizem se um mercado local está saudável e se pode escalar:

| Métrica | Definição | Alvo (mercado saudável) |
| --- | --- | --- |
| **Match rate** | % de solicitações que recebem ≥1 oferta | > 80% |
| **Tempo até 1ª oferta** | mediana do request à primeira oferta | < 15 min |
| **Fill rate** | % de jobs publicados que fecham | > 70% |
| **Razão oferta/demanda** | jardineiros disponíveis ÷ vagas abertas (alimenta o surge) | ~3 (`neutralRatio`, [doc 05](05-pricing-engine.md#3-surge-de-ofertademanda)) |
| **Utilização da oferta** | jobs por jardineiro ativo/semana | crescente e > 0 |
| **CAC por canal** | custo ÷ novos clientes ativados | ver §5 |
| **LTV/CAC por cidade** | LTV local ÷ CAC local | > 4 para escalar |
| **Recompra 90d** | % de clientes com 2º job em 90 dias | > 40% |
| **NPS (cliente e jardineiro)** | pesquisa pós-job | > 50 |

**Gatilho de escala**: só aumentar budget de aquisição num mercado com **match rate > 80%**
**e** **LTV/CAC > 4**. Escalar antes disso é jogar dinheiro em churn.

---

## 7. Checklist de lançamento por cidade

**Pré-lançamento (oferta)**
- [ ] Mapear bairros-alvo de maior densidade de jardim/condomínio.
- [ ] Recrutar 50–150 jardineiros por bairro (associações, WhatsApp, field).
- [ ] Onboarding + verificação + equipamento cadastrado (`Equipment`).
- [ ] Configurar `cityCostIndex` e `pricing_config` da cidade ([doc 05](05-pricing-engine.md)).
- [ ] Bounty de indicação de jardineiro ativo.

**Soft launch (demanda controlada)**
- [ ] Ligar SEO local + páginas por bairro/serviço.
- [ ] Micro-campanhas Google/Meta geo-restritas aos bairros semeados.
- [ ] Fechar 1–3 parcerias com condomínios/síndicos.
- [ ] Garantir que **toda solicitação recebe oferta em < 30 min** (intervir manualmente se preciso).

**Ramp & scale**
- [ ] Medir liquidez diariamente (§6); ajustar bounty/budget no gargalo.
- [ ] Ligar referral de dois lados.
- [ ] Lançar assinatura de corte recorrente.
- [ ] Ao bater os gates (match > 80%, LTV/CAC > 4): abrir próximo bairro/cidade.

---

## 8. Ordem de expansão sugerida (nacional)

Guiada por densidade de jardins, poder de compra e `cityCostIndex`:

1. **São Paulo** (base) → 2. **Campinas** e interior de SP → 3. **Rio de Janeiro** →
4. **Belo Horizonte**, **Curitiba**, **Porto Alegre**, **Brasília** → 5. capitais do
Nordeste (**Salvador**, **Recife**, **Fortaleza**) e Centro-Oeste (**Goiânia**) →
6. mercados rurais/lotes grandes (habilitados por drone/satélite, [doc 13](13-roadmap.md)).

Cada cidade repete o playbook §2 e o checklist §7. **Um mercado por vez até liquidez;
depois, paralelizar com times de city-launch.**

---

### Referências cruzadas
- [`10-monetization.md`](10-monetization.md) — receita, assinaturas, retenção.
- [`11-financial-plan.md`](11-financial-plan.md) — CAC, LTV, budget de marketing.
- [`05-pricing-engine.md`](05-pricing-engine.md) — surge e `cityCostIndex` por praça.
- [`13-roadmap.md`](13-roadmap.md) — recursos que abrem novos segmentos (B2B, rural).
</content>
