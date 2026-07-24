// ---------------------------------------------------------------------------
// Marca do cliente (white-label) — geoAG
// ---------------------------------------------------------------------------
// Fonte única de verdade da identidade visual e dos dados de contato do cliente
// desta instalação. Trocar de cliente = editar somente este arquivo (e as cores
// correspondentes em styles.css :root). Todo o restante da UI lê daqui.
//
// Cliente: geoAG — Assistência Técnica de Drones DJI Agras
// Site: https://geoag.com.br · Goiânia-GO
// ---------------------------------------------------------------------------

export const BRAND = {
  /** Nome curto exibido no topo/menu. */
  nome: "geoAG",
  /** Wordmark separado para colorir "geo" (verde) + "AG" (laranja), como no logo. */
  marcaPre: "geo",
  marcaPos: "AG",
  /** Nome por extenso (títulos, PDFs, rodapés). */
  nomeCompleto: "geoAG — Assistência Técnica de Drones",
  /** Frase de apoio na tela de login. */
  tagline:
    "Manutenção inteligente de drones DJI Agras — chamados, estágios e IA preditiva",

  // --- Contato real do cliente -------------------------------------------
  site: "https://geoag.com.br",
  email: "contato@geoag.com.br",
  telefone: "+55 (62) 3914-4516",
  /** Só dígitos, padrão E.164 (para links wa.me). */
  whatsapp: "556239144516",
  endereco:
    "Av. Francisco de Melo, Quadra 41, Lote 06 — 74.345-210, Vila Rosa, Goiânia-GO",
  cidade: "Goiânia-GO",

  // --- Paleta (espelha styles.css :root; usada em SVGs/inline) -----------
  cores: {
    verdeEscuro: "#2f6a1e",
    verde: "#4f9e2e",
    laranja: "#f39200",
  },
} as const;

/** Rodapé institucional montado a partir da marca (usado no i18n e em relatórios). */
export function rodapeMarca(): string {
  return `${BRAND.nome} · manutenção DJI Agras rastreável por Serial Number · IA preditiva`;
}
