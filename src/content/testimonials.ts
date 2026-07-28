export type Testimonial = {
  name: string;
  role: string;
  city: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  plan?: string;
  since?: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Mariana Prado",
    role: "Residência",
    city: "Campinas, SP",
    rating: 5,
    plan: "Plano Verde",
    since: "cliente há 2 anos",
    text: "Assinei o Plano Verde e simplesmente parei de pensar no jardim. A equipe chega no dia combinado, faz o corte, apara as bordas e ainda manda foto no WhatsApp quando termina. Meu marido brincou que foi a melhor assinatura que já contratamos.",
  },
  {
    name: "Roberto Nakamura",
    role: "Síndico — Condomínio Villa Verde",
    city: "Valinhos, SP",
    rating: 5,
    plan: "Plano Premium",
    since: "cliente há 3 anos",
    text: "Somos 78 unidades e 4.000 m² de área verde. Trocamos três empresas antes da Verde Fixo. A diferença é a previsibilidade: cronograma cumprido, nota fiscal em dia e relatório fotográfico que eu levo pronto para a assembleia.",
  },
  {
    name: "Camila Bertoldi",
    role: "Pousada Recanto das Águas",
    city: "Holambra, SP",
    rating: 5,
    plan: "Plano Premium",
    since: "cliente há 1 ano",
    text: "Nossos hóspedes fotografam o jardim e postam. Isso virou marketing gratuito. O projeto de paisagismo pagou a si mesmo em uma temporada e a manutenção mantém tudo impecável na alta estação.",
  },
  {
    name: "Eduardo Salles",
    role: "Sítio Boa Esperança",
    city: "Jaguariúna, SP",
    rating: 5,
    since: "cliente há 8 meses",
    text: "Terreno de 6.000 m² tomado por mato depois de um ano fechado. Em dois dias entregaram limpo, com laudo fotográfico que resolveu a notificação da prefeitura. Preço justo pelo tamanho do trabalho.",
  },
  {
    name: "Patrícia Lemos",
    role: "Residência",
    city: "Paulínia, SP",
    rating: 5,
    plan: "Plano Essencial",
    since: "cliente há 1 ano",
    text: "Comecei no Essencial só pelo corte e acabei subindo para o Verde por causa da adubação. Meu gramado estava amarelado e falhado; hoje está uniforme. A análise de solo mudou o jogo.",
  },
  {
    name: "Fernando Aguiar",
    role: "Escola Semear",
    city: "Campinas, SP",
    rating: 5,
    plan: "Plano Premium",
    since: "cliente há 2 anos",
    text: "Trabalhar com crianças exige cuidado redobrado. A Verde Fixo agenda os serviços fora do horário de aula, usa produtos de baixa toxicidade e informa a carência por escrito. Segurança e transparência que eu não achei em outro lugar.",
  },
  {
    name: "Juliana Castro",
    role: "Residência",
    city: "Vinhedo, SP",
    rating: 5,
    since: "cliente há 6 meses",
    text: "Contratei o projeto de paisagismo achando que seria complicado. Recebi o 3D em uma semana, ajustamos duas plantas e executaram em três dias. A frente de casa ficou irreconhecível — dá até vergonha do antes.",
  },
  {
    name: "Marcos Vinícius Tavares",
    role: "Rede de comércio — 4 lojas",
    city: "Indaiatuba, SP",
    rating: 5,
    plan: "Plano Verde",
    since: "cliente há 1 ano",
    text: "Preciso das quatro fachadas apresentáveis todos os dias. Um contrato, uma fatura, um painel para acompanhar tudo. Reduzi meu tempo gerenciando isso de horas por mês para praticamente zero.",
  },
  {
    name: "Helena Duarte",
    role: "Residência",
    city: "Sumaré, SP",
    rating: 5,
    plan: "Plano Essencial",
    since: "cliente há 4 meses",
    text: "O que me convenceu foi o simulador: coloquei os metros do meu quintal e já vi o preço. Sem ficar esperando três dias por um orçamento como nas outras empresas.",
  },
];

export const ratingDistribution = [
  { stars: 5, percent: 94 },
  { stars: 4, percent: 5 },
  { stars: 3, percent: 1 },
  { stars: 2, percent: 0 },
  { stars: 1, percent: 0 },
];
