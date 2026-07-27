# 14 — Protótipos de alta fidelidade & Design System (UX/UI)

Este documento é a especificação de design de alta fidelidade do JardimJá. Os
"protótipos" vivem em duas formas neste repositório, além da especificação
abaixo:

- **Admin/BI** — protótipo navegável real em `apps/web-admin` (React + Tailwind),
  já com o design system aplicado (cards, KPIs, gráficos, tabelas).
- **Apps Cliente e Profissional** — telas em `apps/mobile` (Flutter, Material 3),
  seguindo o mesmo design system.

> Para telas em Figma, use este documento como fonte da verdade dos tokens e
> fluxos — ele foi escrito para ser 1:1 com a implementação.

---

## 1. Princípios de design

1. **Confiança em segundos.** O valor central é "fotografou → orçou". Toda a
   jornada do cliente é otimizada para reduzir fricção até o orçamento.
2. **Transparência do preço.** Nunca mostramos um número mágico: sempre a
   composição (mão de obra, equipamentos, deslocamento, descarte) + a faixa de
   confiança. Isso diferencia de "chutes" e sustenta a marca.
3. **Mão na terra, interface limpa.** Público amplo (donos de casa, síndicos,
   jardineiros). Tipografia grande, contraste alto, toques generosos (≥ 48dp).
4. **Acessível.** WCAG 2.1 AA: contraste ≥ 4.5:1, alvos ≥ 44px, foco visível,
   suporte a leitor de tela e Dynamic Type.

## 2. Design System

### 2.1 Cores (tokens)

| Token | Hex | Uso |
| --- | --- | --- |
| `brand/600` | `#16A34A` | Cor primária (CTA, marca) |
| `brand/700` | `#15803D` | Hover/pressed |
| `brand/50` | `#F0FDF4` | Fundos suaves, chips |
| `ink/900` | `#0F172A` | Texto principal |
| `ink/500` | `#64748B` | Texto secundário |
| `surface` | `#FFFFFF` / `#0B1220` (dark) | Cartões |
| `bg` | `#F8FAFC` / `#020617` (dark) | Fundo de tela |
| `success` | `#16A34A` | Concluído, aprovado |
| `warning` | `#D97706` | Atenção, baixa confiança |
| `danger` | `#DC2626` | Erro, cancelado, disputa |
| `info` | `#2563EB` | Em andamento, a caminho |

A confiança do orçamento tem escala própria: ≥ 85% verde, 65–85% âmbar, < 65%
vermelho — reforçada no componente `ConfidenceBar`.

### 2.2 Tipografia

- **Família:** Inter (web/admin), Roboto/SF (mobile nativo).
- Escala: Display 32/40, H1 24/32, H2 20/28, Body 16/24, Caption 13/18.
- Números monetários sempre com `tabular-nums`.

### 2.3 Grid & espaçamento

- Base de 4px. Espaçamentos 4/8/12/16/24/32/48.
- Raio de canto: 12px (cards), 8px (inputs), full (chips/avatars).
- Sombra: `0 1px 2px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04)`.

### 2.4 Componentes canônicos

`PrimaryButton`, `ServiceTypeChip`, `ConfidenceBar`, `PriceBreakdownCard`,
`StatusBadge`/`StatusTimeline`, `StatCard`, `DataTable`, `MediaGrid`,
`MapAreaDraw`, `ChatBubble`, `StarRating`. Implementados em
`apps/web-admin/src/components` e `apps/mobile/lib/core/widgets`.

## 3. App do Cliente — fluxo e telas (alta fidelidade)

Fluxo: **Onboarding → Login → Home → Escolher serviço → Captura → IA analisando
→ Orçamento → Publicar → Propostas → Escolher → Acompanhar → Chat → Pagamento →
Avaliar.**

```
┌─ Escolher serviço ─────────┐   ┌─ Captura ───────────────┐   ┌─ Orçamento ────────────┐
│  O que seu jardim precisa? │   │  📷  [ + ]  4/30 fotos   │   │  Área estimada  235 m² │
│  ┌──────┐ ┌──────┐ ┌─────┐ │   │  ┌──┐┌──┐┌──┐┌──┐┌──┐    │   │  Grama alta · 5h · 2👷 │
│  │Cortar│ │ Poda │ │Limp.│ │   │  └──┘└──┘└──┘└──┘└──┘    │   │  ─────────────────────  │
│  └──────┘ └──────┘ └─────┘ │   │  🎥 Vídeo   🎙️ Áudio     │   │  Mão de obra    R$ 380 │
│  ┌──────┐ ┌──────┐ ┌─────┐ │   │  🗺️ Marcar área no mapa  │   │  Equipamentos   R$  70 │
│  │Paisag│ │Pragas│ │ ... │ │   │  📍 Localização           │   │  Deslocamento   R$  45 │
│  └──────┘ └──────┘ └─────┘ │   │  [ Gerar orçamento IA ]  │   │  Descarte       R$  50 │
│                            │   │                          │   │  Total          R$ 545 │
│  Ou descreva: "quero...."  │   │                          │   │  Confiança      ▓▓▓▓ 92%│
└────────────────────────────┘   └──────────────────────────┘   └────────────────────────┘
```

Telas: `service_grid_screen`, `capture_screen`, `quote_review_screen`,
`offers` (lista de propostas com nota/preço), `tracking_screen` (mapa + timeline
`a caminho → chegou → iniciou → concluiu`), `chat_screen`, `payment_screen`
(PIX QR + cartão), `review_screen` (1–5 estrelas + foto).

## 4. App do Profissional — fluxo e telas

Fluxo: **Login → Onboarding (CPF/CNPJ, docs, especialidades, equipamentos, raio,
preços) → Feed do marketplace → Detalhe da oferta (aceitar / negociar / recusar /
chat) → Job ativo (navegar, check-in com foto+GPS, iniciar, check-out) →
Ganhos.**

```
┌─ Feed (perto de você) ─────┐   ┌─ Oferta ───────────────┐   ┌─ Check-in ─────────────┐
│  Corte de grama · 2,4 km   │   │  Relatório da IA        │   │  📷 Foto obrigatória    │
│  235 m² · alta · sugerido  │   │  235 m² · 5h · 2 pessoas │   │  📍 GPS confirmado       │
│  R$ 490 líquido            │   │  Sugerido: R$ 545       │   │  🕒 08:14                │
│  ─────────────────────────  │   │  [ Aceitar ]            │   │  [ Cheguei ]            │
│  Poda · 5,1 km · R$ 300    │   │  [ Enviar contraproposta]│   │                        │
│  ...                       │   │  [ Perguntar no chat ]  │   │                        │
└────────────────────────────┘   └──────────────────────────┘   └────────────────────────┘
```

## 5. Admin/BI — protótipo navegável

Implementado em `apps/web-admin`. Telas: **Dashboard** (6 KPIs: usuários,
orçamentos, serviços concluídos, receita, lucro, conversão + gráfico de receita,
serviços por status, mapa de calor de demanda), **Serviços** (tabela filtrável),
**Detalhe do serviço** (relatório da IA + composição do orçamento + faixa +
propostas), **Jardineiros** (verificação), **Financeiro**, **Configurações**.

## 6. Estados, microinterações e vazios

- **Loading:** skeletons nos cards/tabelas; "IA analisando…" com animação de
  progresso (3–8s) e passos ("lendo fotos", "medindo área", "calculando preço").
- **Erros:** envelope `{code,message}` → toast + inline. Quorum de IA não atingido
  → CTA "tentar novamente / adicionar mais fotos".
- **Vazios:** ilustração + CTA (ex.: feed do jardineiro sem jobs → "amplie seu
  raio de atendimento").

## 7. Handoff

Tokens ↔ código: `apps/web-admin/tailwind.config.js` e
`apps/mobile/lib/core/theme/app_theme.dart` são a materialização dos tokens da
seção 2 — mantê-los sincronizados com este documento (fonte da verdade).
