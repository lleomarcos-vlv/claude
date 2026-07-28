export type GalleryCategory = "paisagismo" | "corte" | "revitalizacao" | "poda" | "limpeza";

export const galleryCategories: { value: GalleryCategory | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "corte", label: "Corte de grama" },
  { value: "paisagismo", label: "Paisagismo" },
  { value: "revitalizacao", label: "Revitalização" },
  { value: "poda", label: "Poda" },
  { value: "limpeza", label: "Limpeza de terreno" },
];

export type GalleryItem = {
  slug: string;
  title: string;
  category: GalleryCategory;
  city: string;
  areaM2: number;
  duration: string;
  before: string;
  after: string;
  description: string;
  services: string[];
};

export const gallery: GalleryItem[] = [
  {
    slug: "jardim-frontal-alphaville",
    title: "Jardim frontal redesenhado",
    category: "paisagismo",
    city: "Campinas, SP",
    areaM2: 180,
    duration: "3 dias",
    before: "/img/galeria/paisagismo-1-antes.svg",
    after: "/img/galeria/paisagismo-1-depois.svg",
    description:
      "Canteiro único e sem desenho virou composição em três alturas com moreias, agapantos e forração de grama-preta. Iluminação de balizamento embutida no percurso.",
    services: ["Paisagismo", "Plantio", "Irrigação"],
  },
  {
    slug: "gramado-condominio-villa-verde",
    title: "Gramado coletivo de condomínio",
    category: "corte",
    city: "Valinhos, SP",
    areaM2: 4000,
    duration: "1 dia",
    before: "/img/galeria/corte-1-antes.svg",
    after: "/img/galeria/corte-1-depois.svg",
    description:
      "Área comum de 4.000 m² com grama alta e desnivelada. Corte com trator cortador, acabamento manual nos taludes e sopro de todas as calçadas internas.",
    services: ["Corte de Grama", "Jardinagem"],
  },
  {
    slug: "revitalizacao-quintal-sousas",
    title: "Quintal abandonado recuperado",
    category: "revitalizacao",
    city: "Sousas, Campinas, SP",
    areaM2: 320,
    duration: "5 dias",
    before: "/img/galeria/revitalizacao-1-antes.svg",
    after: "/img/galeria/revitalizacao-1-depois.svg",
    description:
      "Dois anos sem manutenção. Recuperamos 80% das plantas existentes com poda de recuperação, corrigimos o pH do solo e replantamos apenas os vazios — metade do custo de refazer do zero.",
    services: ["Revitalização de Jardins", "Adubação", "Poda"],
  },
  {
    slug: "cerca-viva-pousada-holambra",
    title: "Cerca-viva de 60 metros",
    category: "poda",
    city: "Holambra, SP",
    areaM2: 60,
    duration: "2 dias",
    before: "/img/galeria/poda-1-antes.svg",
    after: "/img/galeria/poda-1-depois.svg",
    description:
      "Cerca-viva de viburno sem poda há 14 meses. Poda de redução com gabarito e fio-guia para manter o topo perfeitamente reto ao longo dos 60 metros.",
    services: ["Poda", "Jardinagem"],
  },
  {
    slug: "terreno-jaguariuna",
    title: "Terreno de 6.000 m² liberado",
    category: "limpeza",
    city: "Jaguariúna, SP",
    areaM2: 6000,
    duration: "2 dias",
    before: "/img/galeria/limpeza-1-antes.svg",
    after: "/img/galeria/limpeza-1-depois.svg",
    description:
      "Lote com capoeira de mais de 1,5 m de altura e entulho acumulado. Roçada mecanizada, retirada de raízes, duas caçambas de resíduo e laudo fotográfico para a prefeitura.",
    services: ["Limpeza de Terreno"],
  },
  {
    slug: "paisagismo-piscina-vinhedo",
    title: "Entorno de piscina",
    category: "paisagismo",
    city: "Vinhedo, SP",
    areaM2: 240,
    duration: "6 dias",
    before: "/img/galeria/paisagismo-2-antes.svg",
    after: "/img/galeria/paisagismo-2-depois.svg",
    description:
      "Área de piscina sem tratamento paisagístico. Palmeiras-fênix, maciço de clúsias para privacidade e forração resistente a cloro e pisoteio molhado.",
    services: ["Paisagismo", "Plantio", "Irrigação"],
  },
  {
    slug: "gramado-residencial-paulinia",
    title: "Gramado com falhas corrigido",
    category: "revitalizacao",
    city: "Paulínia, SP",
    areaM2: 150,
    duration: "90 dias de programa",
    before: "/img/galeria/revitalizacao-2-antes.svg",
    after: "/img/galeria/revitalizacao-2-depois.svg",
    description:
      "Gramado amarelado e falhado por compactação e pH ácido. Aeração mecânica, calagem, replantio em placas nas falhas e três ciclos de adubação em 90 dias.",
    services: ["Adubação", "Plantio", "Corte de Grama"],
  },
  {
    slug: "fachada-comercial-indaiatuba",
    title: "Fachada de loja",
    category: "corte",
    city: "Indaiatuba, SP",
    areaM2: 90,
    duration: "manutenção semanal",
    before: "/img/galeria/corte-2-antes.svg",
    after: "/img/galeria/corte-2-depois.svg",
    description:
      "Fachada comercial que precisa estar impecável todos os dias. Manutenção semanal em horário anterior à abertura, com corte, bordas e vasos de entrada.",
    services: ["Corte de Grama", "Jardinagem"],
  },
  {
    slug: "topiaria-escola-campinas",
    title: "Topiaria em pátio de escola",
    category: "poda",
    city: "Campinas, SP",
    areaM2: 45,
    duration: "1 dia",
    before: "/img/galeria/poda-2-antes.svg",
    after: "/img/galeria/poda-2-depois.svg",
    description:
      "Arbustos desformados no pátio principal. Poda de formação em esferas e cones, executada em fim de semana para não interferir nas aulas.",
    services: ["Poda"],
  },
];

export const beforeAfterFeatured = gallery.slice(0, 5);
export const galleryBySlug = (slug: string) => gallery.find((g) => g.slug === slug);
