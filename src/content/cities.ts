export type City = {
  slug: string;
  city: string;
  state: string;
  /** Posição relativa (0-100) no mapa estilizado da região. */
  x: number;
  y: number;
  hub: boolean;
  neighborhoods: string[];
  responseTime: string;
};

export const cities: City[] = [
  { slug: "campinas", city: "Campinas", state: "SP", x: 46, y: 50, hub: true, responseTime: "24h", neighborhoods: ["Cambuí", "Barão Geraldo", "Alphaville", "Taquaral", "Sousas", "Joaquim Egídio", "Swiss Park", "Nova Campinas"] },
  { slug: "valinhos", city: "Valinhos", state: "SP", x: 60, y: 62, hub: false, responseTime: "24h", neighborhoods: ["Capela", "São Bento", "Vila Sônia", "Nova Suíça"] },
  { slug: "vinhedo", city: "Vinhedo", state: "SP", x: 64, y: 73, hub: false, responseTime: "48h", neighborhoods: ["Marambaia", "Nova Vinhedo", "Capela"] },
  { slug: "paulinia", city: "Paulínia", state: "SP", x: 42, y: 33, hub: false, responseTime: "48h", neighborhoods: ["João Aranha", "Betel", "Morumbi"] },
  { slug: "sumare", city: "Sumaré", state: "SP", x: 30, y: 40, hub: false, responseTime: "48h", neighborhoods: ["Nova Veneza", "Matão", "Picerno"] },
  { slug: "hortolandia", city: "Hortolândia", state: "SP", x: 27, y: 52, hub: false, responseTime: "48h", neighborhoods: ["Remanso Campineiro", "Jardim Amanda"] },
  { slug: "indaiatuba", city: "Indaiatuba", state: "SP", x: 30, y: 70, hub: false, responseTime: "48h", neighborhoods: ["Vila Furlan", "Cidade Nova", "Jardim Esplanada"] },
  { slug: "jaguariuna", city: "Jaguariúna", state: "SP", x: 62, y: 25, hub: false, responseTime: "72h", neighborhoods: ["Centro", "Nova Jaguariúna", "Roseira de Cima"] },
  { slug: "holambra", city: "Holambra", state: "SP", x: 50, y: 14, hub: false, responseTime: "72h", neighborhoods: ["Centro", "Palmeiras", "Groot"] },
  { slug: "artur-nogueira", city: "Artur Nogueira", state: "SP", x: 38, y: 15, hub: false, responseTime: "72h", neighborhoods: ["Centro", "Jardim Planalto"] },
  { slug: "pedreira", city: "Pedreira", state: "SP", x: 76, y: 22, hub: false, responseTime: "72h", neighborhoods: ["Centro", "Jardim Marajoara"] },
  { slug: "itatiba", city: "Itatiba", state: "SP", x: 80, y: 60, hub: false, responseTime: "72h", neighborhoods: ["Centro", "Bairro da Ponte", "Nova Itatiba"] },
  { slug: "monte-mor", city: "Monte Mor", state: "SP", x: 18, y: 60, hub: false, responseTime: "72h", neighborhoods: ["Centro", "Jardim Progresso"] },
  { slug: "cosmopolis", city: "Cosmópolis", state: "SP", x: 48, y: 24, hub: false, responseTime: "72h", neighborhoods: ["Centro", "Jardim Europa"] },
];

export const cityBySlug = (slug: string) => cities.find((c) => c.slug === slug);
