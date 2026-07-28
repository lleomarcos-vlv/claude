/**
 * Ativos vetoriais da marca Verde Fixo.
 *
 * Os contornos do logotipo foram extraídos do catálogo oficial da empresa
 * (Catálogo de Serviços) e convertidos em paths SVG. Isso mantém o logotipo
 * fiel ao original sem depender de download de fonte no navegador.
 *
 * Sistema de coordenadas: unidades de fonte (1000 por em), eixo Y para cima,
 * linha de base em 0. O componente <Logo /> aplica a inversão do eixo.
 */

/** Glifos de "verdeﬁxo" (com ligadura fi), na ordem, com o avanço horizontal já aplicado. */
export const WORDMARK_GLYPHS = [
  { x: 0, d: "M350 0L536 540L388 540L279 145L162 540L14 540L203 0Z" },
  {
    x: 556,
    d: "M524 226C525 238 525 243 525 250C525 304 517 354 504 392C468 490 381 549 272 549C117 549 22 437 22 256C22 83 116 -23 269 -23C390 -23 488 45 519 152L381 152C364 109 325 84 274 84C234 84 202 101 182 131C169 151 164 175 162 226ZM164 319C173 402 208 442 270 442C334 442 372 399 379 319Z",
  },
  { x: 1112, d: "M63 540L63 0L203 0L203 287C203 369 244 410 326 410C341 410 351 409 370 406L370 548C362 549 359 549 353 549C289 549 234 507 203 434L203 540Z" },
  {
    x: 1501,
    d: "M405 0L545 0L545 729L405 729L405 470C370 524 324 549 256 549C127 549 29 425 29 262C29 189 51 115 87 63C124 10 190 -23 256 -23C324 -23 370 1 405 55ZM287 432C358 432 405 364 405 260C405 162 357 94 287 94C217 94 169 163 169 262C169 363 217 432 287 432Z",
  },
  {
    x: 2112,
    d: "M524 226C525 238 525 243 525 250C525 304 517 354 504 392C468 490 381 549 272 549C117 549 22 437 22 256C22 83 116 -23 269 -23C390 -23 488 45 519 152L381 152C364 109 325 84 274 84C234 84 202 101 182 131C169 151 164 175 162 226ZM164 319C173 402 208 442 270 442C334 442 372 399 379 319Z",
  },
  {
    x: 2668,
    d: "M313 529L230 529L230 582C230 610 242 624 268 624C281 624 294 623 308 621L308 726C278 728 249 729 228 729C135 729 90 685 90 594L90 529L14 529L14 436L90 436L90 0L230 0L230 436L313 436ZM540 540L400 540L400 0L540 0ZM540 729L400 729L400 604L540 604Z",
  },
  { x: 3279, d: "M355 272L531 540L363 540L276 377L188 540L20 540L196 272L16 0L184 0L276 168L367 0L535 0Z" },
  {
    x: 3835,
    d: "M301 549C136 549 35 440 35 263C35 85 136 -23 302 -23C467 -23 569 85 569 259C569 442 470 549 301 549ZM302 436C379 436 429 367 429 261C429 160 377 90 302 90C226 90 175 159 175 263C175 367 226 436 302 436Z",
  },
] as const;

/** Folha estilizada que acompanha o logotipo, em coordenadas Y para baixo (0..752). */
export const LEAF_PATH =
  "M85 6C140 90 170 220 170 372C170 520 133 655 85 746C37 655 0 520 0 372C0 220 30 90 85 6Z";

/** Geometria do logotipo completo (folha + wordmark) em coordenadas Y para baixo. */
export const LOGO_GEOMETRY = {
  width: 4690,
  height: 752,
  /** Altura do ascendente em unidades de fonte — usada para inverter o eixo Y. */
  baseline: 729,
  /** Deslocamento horizontal do wordmark após a folha. */
  wordmarkX: 286,
  leafWidth: 170,
} as const;

/** Cores oficiais, extraídas do catálogo da empresa. */
export const brandColors = {
  /** Verde escuro do wordmark. */
  primary: "#2a7261",
  primaryDark: "#20574a",
  ink: "#1d3a31",
  /** Verde claro da folha. */
  leaf: "#9fdfb9",
  mint: "#d1ebe0",
  mintSoft: "#e6f2ec",
  surface: "#f5faf7",
  muted: "#4a6b5f",
  amber: "#8c7b35",
  amberSoft: "#fffdf0",
} as const;
