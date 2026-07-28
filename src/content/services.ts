/**
 * Faixa de preço por m² (em centavos) das três bandas tarifadas no catálogo,
 * ou `quote` para serviços cujo valor depende de projeto e material.
 */
export type ServicePricing =
  | { kind: "m2"; minPerM2: number; maxPerM2: number; band: PriceBand }
  | { kind: "quote" };

export type PriceBand = "Corte de Grama Padrão" | "Adubação e Tratamentos" | "Limpeza Pesada (Revitalização)";

/**
 * Valor mínimo de visita para serviços avulsos (R$ 200,00), conforme o catálogo:
 * "Visando manter o nosso alto padrão de maquinário, equipe e pontualidade,
 * operamos com um valor mínimo de visita de R$ 200,00 para serviços avulsos."
 */
export const MIN_VISIT_PRICE = 20000;

/** Bandas de preço por m² publicadas no catálogo (centavos). */
export const priceBands: Record<PriceBand, { minPerM2: number; maxPerM2: number }> = {
  "Corte de Grama Padrão": { minPerM2: 250, maxPerM2: 450 },
  "Adubação e Tratamentos": { minPerM2: 300, maxPerM2: 600 },
  "Limpeza Pesada (Revitalização)": { minPerM2: 800, maxPerM2: 1200 },
};

export type ServiceContent = {
  slug: string;
  name: string;
  shortDesc: string;
  description: string;
  image: string;
  icon: string;
  /** Precificação conforme o Catálogo de Serviços da Verde Fixo. */
  pricing: ServicePricing;
  durationMin: number;
  featured: boolean;
  includes: string[];
  faq: { q: string; a: string }[];
  seoTitle: string;
  seoDescription: string;
};

export const services: ServiceContent[] = [
  {
    slug: "corte-de-grama",
    name: "Corte de Grama",
    shortDesc: "Gramado nivelado, aparado nas bordas e sem resíduos — do jeito que vizinho nenhum esquece.",
    description:
      "O serviço mais pedido da Verde Fixo. Usamos cortadores profissionais com altura regulada por tipo de grama (esmeralda, são-carlos, bermuda, batatais), aparamos todas as bordas com roçadeira, sopramos calçadas e retiramos 100% dos resíduos. O corte na altura correta é o que mantém a grama densa e sem falhas ao longo do ano.",
    image: "/img/servicos/corte-de-grama.svg",
    icon: "mower",
    pricing: { kind: "m2", ...priceBands["Corte de Grama Padrão"], band: "Corte de Grama Padrão" },
    durationMin: 90,
    featured: true,
    includes: [
      "Corte com altura ajustada ao tipo de grama",
      "Acabamento de bordas e canteiros com roçadeira",
      "Sopro de calçadas, garagem e área de piso",
      "Retirada e descarte dos resíduos",
      "Relatório com fotos antes e depois",
    ],
    faq: [
      {
        q: "Com que frequência devo cortar a grama?",
        a: "Na primavera e no verão o ideal é a cada 15 dias; no outono e inverno o crescimento cai e uma visita por mês costuma ser suficiente. Nossos planos ajustam a frequência automaticamente conforme a estação.",
      },
      {
        q: "Vocês levam os resíduos embora?",
        a: "Sim. A retirada e o descarte correto da grama cortada estão incluídos em todos os serviços, sem custo adicional.",
      },
    ],
    seoTitle: "Corte de Grama Profissional | Agende Online — Verde Fixo",
    seoDescription:
      "Corte de grama com equipe própria, acabamento de bordas e retirada de resíduos. Agende online em 1 minuto ou assine um plano e tenha o gramado sempre impecável.",
  },
  {
    slug: "paisagismo",
    name: "Paisagismo",
    shortDesc: "Projeto sob medida com espécies certas para o seu sol, seu solo e sua rotina.",
    description:
      "Do desenho à execução. Nosso paisagista visita o local, mede a área, avalia insolação e drenagem e entrega um projeto em 3D com planta de plantio, lista de espécies e orçamento fechado. Na execução cuidamos de preparo de solo, delimitação de canteiros, plantio, cobertura morta e primeira adubação — com garantia de pega de 90 dias nas plantas.",
    image: "/img/servicos/paisagismo.svg",
    icon: "palette",
    pricing: { kind: "quote" },
    durationMin: 480,
    featured: true,
    includes: [
      "Visita técnica e levantamento da área",
      "Projeto em 3D com lista de espécies",
      "Preparo de solo e correção com adubo orgânico",
      "Plantio, cobertura morta e delimitação de canteiros",
      "Garantia de pega de 90 dias",
    ],
    faq: [
      {
        q: "Quanto tempo leva um projeto de paisagismo?",
        a: "O projeto fica pronto em até 7 dias úteis após a visita técnica. A execução varia de 1 a 10 dias, conforme o tamanho da área.",
      },
      {
        q: "Posso executar o projeto por etapas?",
        a: "Sim. Dividimos a execução em fases para caber no seu orçamento, mantendo o projeto original como guia.",
      },
    ],
    seoTitle: "Paisagismo Residencial e Comercial | Projeto 3D — Verde Fixo",
    seoDescription:
      "Projeto de paisagismo com visita técnica, desenho 3D e execução completa. Espécies certas para seu clima e garantia de pega de 90 dias. Solicite seu orçamento.",
  },
  {
    slug: "jardinagem",
    name: "Jardinagem",
    shortDesc: "Manutenção completa que mantém canteiros limpos e plantas saudáveis todo mês.",
    description:
      "A manutenção recorrente que segura o jardim no ponto: limpeza de canteiros, remoção de ervas invasoras, tutoramento, retirada de folhas secas, conferência de irrigação e inspeção de pragas. É o serviço que evita que o jardim precise de uma revitalização caríssima daqui a dois anos.",
    image: "/img/servicos/jardinagem.svg",
    icon: "leaf",
    pricing: { kind: "m2", ...priceBands["Corte de Grama Padrão"], band: "Corte de Grama Padrão" },
    durationMin: 120,
    featured: true,
    includes: [
      "Limpeza de canteiros e remoção de ervas invasoras",
      "Retirada de folhas secas e galhos",
      "Tutoramento e amarração de plantas",
      "Inspeção de pragas e doenças",
      "Checagem do sistema de irrigação",
    ],
    faq: [
      {
        q: "Jardinagem é diferente de corte de grama?",
        a: "Sim. O corte de grama cuida do gramado; a jardinagem cuida de canteiros, arbustos, vasos e da saúde geral das plantas. A maioria dos clientes contrata os dois no mesmo plano.",
      },
    ],
    seoTitle: "Jardinagem e Manutenção de Jardins | Verde Fixo",
    seoDescription:
      "Serviço de jardinagem com limpeza de canteiros, remoção de ervas, tutoramento e inspeção de pragas. Contrate visitas recorrentes com equipe própria.",
  },
  {
    slug: "poda",
    name: "Poda",
    shortDesc: "Poda técnica de árvores, arbustos e cercas-vivas na época correta de cada espécie.",
    description:
      "Poda feita por quem entende de fisiologia vegetal: cortes limpos, no ângulo certo e no período correto de cada espécie, com selante nos cortes maiores. Fazemos poda de formação, limpeza, frutificação e redução de copa, além de cercas-vivas e topiaria. Equipe com EPI completo, motosserra e podador de altura para árvores até 12 metros.",
    image: "/img/servicos/poda.svg",
    icon: "scissors",
    pricing: { kind: "quote" },
    durationMin: 180,
    featured: true,
    includes: [
      "Poda de formação, limpeza, frutificação ou redução",
      "Cerca-viva e topiaria com acabamento reto",
      "Selante protetor nos cortes de maior diâmetro",
      "Trituração ou retirada dos galhos",
      "Equipe com EPI e seguro de responsabilidade civil",
    ],
    faq: [
      {
        q: "Preciso de autorização da prefeitura para podar?",
        a: "Árvores em calçada ou espécies protegidas costumam exigir autorização municipal. Orientamos e ajudamos a protocolar o pedido antes de executar.",
      },
      {
        q: "Vocês podam árvores altas?",
        a: "Sim, até 12 metros com podador de altura e escalada técnica. Acima disso indicamos parceiro com plataforma elevatória.",
      },
    ],
    seoTitle: "Poda de Árvores e Arbustos | Equipe Técnica — Verde Fixo",
    seoDescription:
      "Poda técnica de árvores, cercas-vivas e arbustos com equipe treinada, EPI completo e retirada de galhos. Agende online ou solicite orçamento.",
  },
  {
    slug: "limpeza-de-terreno",
    name: "Limpeza de Terreno",
    shortDesc: "Mato alto, entulho e capoeira resolvidos em um dia — terreno pronto para uso.",
    description:
      "Roçada mecanizada de mato alto, remoção de raízes superficiais, capina, retirada de entulho e caçamba inclusa quando necessário. Ideal para lotes vagos, obras, notificações da prefeitura e áreas que ficaram sem manutenção por meses. Entregamos o terreno limpo, nivelado e com registro fotográfico para comprovação.",
    image: "/img/servicos/limpeza-de-terreno.svg",
    icon: "shovel",
    pricing: { kind: "m2", ...priceBands["Limpeza Pesada (Revitalização)"], band: "Limpeza Pesada (Revitalização)" },
    durationMin: 300,
    featured: true,
    includes: [
      "Roçada mecanizada de mato alto e capoeira",
      "Capina e remoção de raízes superficiais",
      "Recolhimento de entulho e resíduos",
      "Caçamba opcional inclusa no orçamento",
      "Laudo fotográfico para a prefeitura",
    ],
    faq: [
      {
        q: "Vocês atendem terrenos com notificação da prefeitura?",
        a: "Sim, e com prioridade. Atendemos em até 48h e entregamos relatório fotográfico com data para você anexar à resposta da notificação.",
      },
    ],
    seoTitle: "Limpeza de Terreno e Roçada | Atendimento em 48h — Verde Fixo",
    seoDescription:
      "Limpeza de terreno com roçada mecanizada, capina, remoção de entulho e laudo fotográfico. Atendimento em até 48h para notificações da prefeitura.",
  },
  {
    slug: "plantio",
    name: "Plantio",
    shortDesc: "Grama, forrações, arbustos e árvores plantados com solo preparado e garantia.",
    description:
      "Plantio de grama em placas ou sementes, forrações, arbustos, palmeiras e árvores. O que garante o resultado é o que ninguém vê: descompactação do solo, correção com composto orgânico, drenagem e adubação de base. Fornecemos as mudas de viveiros parceiros com nota fiscal e garantia de pega.",
    image: "/img/servicos/plantio.svg",
    icon: "sprout",
    pricing: { kind: "quote" },
    durationMin: 240,
    featured: false,
    includes: [
      "Descompactação e nivelamento do solo",
      "Correção com composto orgânico e adubo de base",
      "Fornecimento de mudas e grama com nota fiscal",
      "Plantio, compactação e primeira irrigação",
      "Garantia de pega de 90 dias",
    ],
    faq: [
      {
        q: "Qual grama é melhor para minha casa?",
        a: "Depende do sol e do uso. Esmeralda para sol pleno e trânsito médio, são-carlos para meia-sombra, bermuda para alto trânsito. Indicamos a espécie na visita.",
      },
    ],
    seoTitle: "Plantio de Grama, Árvores e Forrações | Verde Fixo",
    seoDescription:
      "Plantio de grama em placas, forrações, arbustos e árvores com preparo de solo, adubação de base e garantia de pega de 90 dias.",
  },
  {
    slug: "adubacao",
    name: "Adubação",
    shortDesc: "Programa nutricional com análise de solo — a diferença entre grama verde e grama viva.",
    description:
      "Fazemos análise de pH e nutrientes do solo e montamos um calendário de adubação com formulação específica para cada trecho do jardim. Aplicamos adubo de liberação controlada, matéria orgânica e correção de acidez com calcário quando necessário. Resultado: cor mais intensa, raiz profunda e gramado que resiste melhor à seca e ao pisoteio.",
    image: "/img/servicos/adubacao.svg",
    icon: "beaker",
    pricing: { kind: "m2", ...priceBands["Adubação e Tratamentos"], band: "Adubação e Tratamentos" },
    durationMin: 90,
    featured: false,
    includes: [
      "Análise de pH e nutrientes do solo",
      "Calendário anual de adubação personalizado",
      "Adubo de liberação controlada e matéria orgânica",
      "Correção de acidez com calcário dolomítico",
      "Aplicação uniforme com distribuidor calibrado",
    ],
    faq: [
      {
        q: "De quanto em quanto tempo adubar o gramado?",
        a: "A cada 3 a 4 meses, com formulação diferente por estação. No plano Verde e no Premium isso já entra no cronograma automático.",
      },
    ],
    seoTitle: "Adubação de Gramado e Jardim | Análise de Solo — Verde Fixo",
    seoDescription:
      "Adubação com análise de solo, calendário anual e adubo de liberação controlada. Gramado mais verde, raiz profunda e resistência à seca.",
  },
  {
    slug: "controle-de-pragas",
    name: "Controle de Pragas",
    shortDesc: "Formigas, cupins, lagartas e fungos tratados com manejo integrado e produtos seguros.",
    description:
      "Identificamos a praga corretamente antes de aplicar qualquer coisa — é o que evita gastar com produto errado. Trabalhamos com manejo integrado: controle biológico quando possível, produtos registrados no MAPA quando necessário, e sempre com carência informada para pets e crianças. Inclui monitoramento nas visitas seguintes.",
    image: "/img/servicos/controle-de-pragas.svg",
    icon: "shield",
    pricing: { kind: "m2", ...priceBands["Adubação e Tratamentos"], band: "Adubação e Tratamentos" },
    durationMin: 120,
    featured: false,
    includes: [
      "Identificação técnica da praga ou doença",
      "Manejo integrado com prioridade para controle biológico",
      "Produtos registrados no MAPA e ficha técnica entregue",
      "Orientação de carência para pets e crianças",
      "Monitoramento nas visitas seguintes",
    ],
    faq: [
      {
        q: "Os produtos são seguros para animais de estimação?",
        a: "Sim, usamos produtos de baixa toxicidade e informamos o período de carência exato — normalmente de 4 a 24 horas para liberar o acesso ao gramado.",
      },
    ],
    seoTitle: "Controle de Pragas em Jardim e Gramado | Verde Fixo",
    seoDescription:
      "Controle de formigas, cupins, lagartas e fungos com manejo integrado, produtos registrados e orientação de segurança para pets e crianças.",
  },
  {
    slug: "irrigacao",
    name: "Irrigação",
    shortDesc: "Projeto e instalação de irrigação automatizada com economia de até 40% de água.",
    description:
      "Dimensionamos o sistema por setor conforme insolação e tipo de planta, instalamos aspersores, gotejamento e controlador com sensor de chuva, e programamos os horários ideais. Também fazemos manutenção corretiva: vazamentos, aspersores entupidos, setores desregulados e troca de controladores antigos por modelos com Wi-Fi.",
    image: "/img/servicos/irrigacao.svg",
    icon: "droplet",
    pricing: { kind: "quote" },
    durationMin: 300,
    featured: false,
    includes: [
      "Projeto hidráulico setorizado por insolação",
      "Aspersores, gotejamento e tubulação enterrada",
      "Controlador com sensor de chuva e Wi-Fi",
      "Programação dos horários de rega por estação",
      "Manutenção corretiva e ajuste de setores",
    ],
    faq: [
      {
        q: "Irrigação automática gasta mais água?",
        a: "Ao contrário. Um sistema bem setorizado com sensor de chuva reduz o consumo em até 40% comparado à rega com mangueira.",
      },
    ],
    seoTitle: "Irrigação Automatizada para Jardins | Projeto e Instalação",
    seoDescription:
      "Projeto e instalação de irrigação automatizada com setorização, sensor de chuva e controlador Wi-Fi. Economize até 40% de água na rega do jardim.",
  },
  {
    slug: "revitalizacao-de-jardins",
    name: "Revitalização de Jardins",
    shortDesc: "Jardim abandonado virando referência da rua em uma única intervenção.",
    description:
      "O pacote completo para jardins que ficaram anos sem cuidado. Fazemos diagnóstico, poda de recuperação, remoção de plantas irrecuperáveis, correção e aeração do solo, replantio dos vazios, novo desenho de canteiros, cobertura morta e adubação. Entregamos com plano de manutenção para o jardim não voltar ao estado anterior.",
    image: "/img/servicos/revitalizacao-de-jardins.svg",
    icon: "sparkles",
    pricing: { kind: "m2", ...priceBands["Limpeza Pesada (Revitalização)"], band: "Limpeza Pesada (Revitalização)" },
    durationMin: 420,
    featured: true,
    includes: [
      "Diagnóstico do jardim e do solo",
      "Poda de recuperação e remoção de plantas perdidas",
      "Aeração, descompactação e correção do solo",
      "Replantio, novo desenho de canteiros e cobertura morta",
      "Plano de manutenção para manter o resultado",
    ],
    faq: [
      {
        q: "Meu jardim está abandonado há anos. Tem solução?",
        a: "Quase sempre sim. Em 9 de cada 10 casos recuperamos boa parte das plantas existentes, o que sai bem mais barato que refazer tudo.",
      },
    ],
    seoTitle: "Revitalização de Jardins | Antes e Depois — Verde Fixo",
    seoDescription:
      "Revitalização completa de jardins abandonados: poda de recuperação, correção de solo, replantio e novo desenho de canteiros. Veja o antes e depois.",
  },
];

export const serviceBySlug = (slug: string) => services.find((s) => s.slug === slug);
export const featuredServices = services.filter((s) => s.featured);
export const serviceOptions = services.map((s) => ({ value: s.slug, label: s.name }));
