/**
 * Clube Verde Fixo — pacotes mensais.
 *
 * Valores conforme o Catálogo de Serviços da Verde Fixo:
 *  · Plano Essencial (2 visitas/mês) — a partir de R$ 450,00
 *  · Plano Premium  (poda, adubação preventiva e controle de pragas) — a partir de R$ 650,00
 *  · Tabela por porte do terreno: Pequeno R$ 450 · Médio R$ 550 · Grande R$ 800+
 *
 * O catálogo tarifa duas faixas de pacote; o terceiro nível (visitas ilimitadas com
 * paisagismo e irrigação) segue a mesma progressão por porte e é editável no painel
 * administrativo, em Planos → Alterar preços.
 */

export type AreaTier = {
  label: string;
  /** Limite superior de área, em m². `null` = acima do último limite (sob orçamento). */
  maxM2: number | null;
  /** Mensalidade em centavos. */
  price: number;
  /** `true` quando o valor é um piso ("a partir de"), como o "R$ 800,00+" do catálogo. */
  from?: boolean;
};

export type PlanContent = {
  slug: string;
  name: string;
  tagline: string;
  /** Mensalidade inicial (menor faixa de área), em centavos. */
  priceMonthly: number;
  /** Cobrança anual com 2 meses de desconto, em centavos. */
  priceYearly: number;
  /** -1 = ilimitado */
  visitsPerMonth: number;
  maxAreaM2: number;
  /** Mensalidade por porte do terreno. */
  areaTiers: AreaTier[];
  features: string[];
  highlight: boolean;
  badge?: string;
  /** `true` quando o preço vem publicado no catálogo oficial. */
  catalogPriced: boolean;
};

/** Faixas de porte do terreno usadas no catálogo. */
export const areaTierLabels = [
  { label: "Pequeno", hint: "até 30 m²", maxM2: 30 },
  { label: "Médio", hint: "31 a 100 m²", maxM2: 100 },
  { label: "Grande", hint: "101 a 300 m²", maxM2: 300 },
] as const;

export const plans: PlanContent[] = [
  {
    slug: "essencial",
    name: "Plano Essencial",
    tagline: "Para quem só quer o gramado sempre no ponto, sem pensar nisso.",
    priceMonthly: 45000,
    priceYearly: 450000,
    visitsPerMonth: 2,
    maxAreaM2: 300,
    catalogPriced: true,
    areaTiers: [
      { label: "Pequeno · até 30 m²", maxM2: 30, price: 45000 },
      { label: "Médio · 31 a 100 m²", maxM2: 100, price: 55000 },
      { label: "Grande · 101 a 300 m²", maxM2: 300, price: 80000, from: true },
      { label: "Acima de 300 m²", maxM2: null, price: 0 },
    ],
    features: [
      "2 visitas por mês",
      "Corte de grama e acabamento de bordas",
      "Limpeza com soprador",
      "Remoção de toda a sujeira",
    ],
    highlight: false,
  },
  {
    slug: "verde",
    name: "Plano Verde",
    tagline: "Tudo do Essencial mais poda, adubação e pragas. O mais assinado.",
    priceMonthly: 65000,
    priceYearly: 650000,
    visitsPerMonth: 4,
    maxAreaM2: 500,
    catalogPriced: true,
    areaTiers: [
      { label: "Pequeno · até 30 m²", maxM2: 30, price: 65000 },
      { label: "Médio · 31 a 100 m²", maxM2: 100, price: 79000 },
      { label: "Grande · 101 a 300 m²", maxM2: 300, price: 115000, from: true },
      { label: "Acima de 300 m²", maxM2: null, price: 0 },
    ],
    features: [
      "4 visitas por mês",
      "Tudo do Plano Essencial",
      "Poda de arbustos e cercas-vivas",
      "Adubação preventiva programada",
      "Controle de pragas",
    ],
    highlight: true,
    badge: "Mais assinado",
  },
  {
    slug: "premium",
    name: "Plano Premium",
    tagline: "Jardim de revista, cuidado como projeto vivo, com equipe à disposição.",
    priceMonthly: 129000,
    priceYearly: 1290000,
    visitsPerMonth: -1,
    maxAreaM2: 2000,
    catalogPriced: false,
    areaTiers: [
      { label: "Pequeno · até 30 m²", maxM2: 30, price: 129000 },
      { label: "Médio · 31 a 100 m²", maxM2: 100, price: 157000 },
      { label: "Grande · 101 a 300 m²", maxM2: 300, price: 228000, from: true },
      { label: "Acima de 300 m²", maxM2: null, price: 0 },
    ],
    features: [
      "Visitas ilimitadas",
      "Tudo do Plano Verde",
      "Paisagismo e redesenho de canteiros",
      "Irrigação: instalação e manutenção",
      "Atendimento prioritário",
    ],
    highlight: false,
    badge: "Completo",
  },
];

/** Mensalidade do plano para uma área informada. `null` quando exige orçamento. */
export function planPriceForArea(plan: PlanContent, areaM2: number): AreaTier | null {
  const tier = plan.areaTiers.find((t) => t.maxM2 !== null && areaM2 <= t.maxM2);
  return tier ?? null;
}

/**
 * Tabela "Estimativa de Valores (Avulso x Assinatura)" reproduzida do catálogo.
 * Serve de prova social/econômica na página de planos e no simulador.
 */
export type AvulsoRow = {
  size: string;
  hint: string;
  avulso: string;
  avulsoNote?: string;
  assinatura: string;
};

export const avulsoVsAssinatura: AvulsoRow[] = [
  {
    size: "Pequeno",
    hint: "Até 30 m²",
    avulso: "R$ 200,00",
    avulsoNote: "taxa mínima",
    assinatura: "R$ 450,00",
  },
  {
    size: "Médio",
    hint: "31 a 100 m²",
    avulso: "R$ 250,00 a R$ 400,00",
    assinatura: "R$ 550,00",
  },
  {
    size: "Grande",
    hint: "101 a 300 m²",
    avulso: "R$ 400,00 a R$ 800,00",
    assinatura: "R$ 800,00+",
  },
];

/** Matriz de comparação exibida na tabela de planos. */
export const planComparison: {
  group: string;
  rows: { label: string; hint?: string; values: [string | boolean, string | boolean, string | boolean] }[];
}[] = [
  {
    group: "Visitas e cobertura",
    rows: [
      { label: "Visitas por mês", values: ["2", "4", "Ilimitadas"] },
      {
        label: "Área inclusa",
        hint: "Acima de 300 m² o valor é calculado por m² no orçamento.",
        values: ["até 300 m²", "até 500 m²", "até 2.000 m²"],
      },
      { label: "Vaga fixa garantida na agenda", values: [true, true, true] },
      { label: "Reagendamento por chuva", values: [true, true, true] },
      { label: "Atendimento em sábados", values: [false, true, true] },
      { label: "Plantão em domingos e feriados", values: [false, false, true] },
    ],
  },
  {
    group: "Serviços inclusos",
    rows: [
      { label: "Corte de grama e acabamento de bordas", values: [true, true, true] },
      { label: "Limpeza com soprador e remoção de sujeira", values: [true, true, true] },
      { label: "Limpeza de canteiros", values: ["Básica", "Completa", "Completa"] },
      { label: "Poda de arbustos e cercas-vivas", values: [false, true, true] },
      { label: "Adubação preventiva", values: [false, "Trimestral", "Bimestral"] },
      { label: "Controle de pragas", values: [false, true, true] },
      { label: "Paisagismo e redesenho de canteiros", values: [false, false, true] },
      { label: "Irrigação: instalação e manutenção", values: [false, false, true] },
      { label: "Análise de solo anual", values: [false, true, true] },
    ],
  },
  {
    group: "Experiência e suporte",
    rows: [
      { label: "Relatório com fotos antes e depois", values: [true, true, true] },
      { label: "Confirmação e lembrete por WhatsApp", values: [true, true, true] },
      { label: "Painel do cliente com histórico", values: [true, true, true] },
      { label: "Equipe fixa dedicada ao seu jardim", values: [false, true, true] },
      { label: "Tempo de resposta do atendimento", values: ["até 24h", "até 8h", "até 2h"] },
      { label: "Desconto em serviços extras", values: ["5%", "10%", "20%"] },
      {
        label: "Garantia de satisfação",
        hint: "Refazemos o serviço em até 72h se algo não ficou bom.",
        values: [true, true, true],
      },
      { label: "Fidelidade ou multa de cancelamento", values: ["Nenhuma", "Nenhuma", "Nenhuma"] },
    ],
  },
];

export const planBySlug = (slug: string) => plans.find((p) => p.slug === slug);
export const clubName = "Clube Verde Fixo";
export const clubPitch =
  "A tranquilidade de ter seu jardim perfeito o mês todo. Nossos pacotes garantem sua vaga na agenda e valor diferenciado em relação aos serviços avulsos.";
