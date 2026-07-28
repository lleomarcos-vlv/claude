import type { SVGProps } from "react";

/**
 * Conjunto de ícones em traço, desenhado sobre grade de 24px.
 *
 * Ficam inline no HTML em vez de virem de uma biblioteca: zero requisição extra,
 * zero JavaScript e apenas os ícones realmente usados chegam ao cliente.
 */
const paths: Record<string, string> = {
  // Serviços
  mower: "M3 17h11a3 3 0 0 0 3-3V7M17 7h4M6 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm12 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM7 13V9m3 4V7m3 6V10",
  palette: "M12 21a9 9 0 1 1 0-18c4.97 0 9 3.58 9 8 0 2.5-2 4-4 4h-2a2 2 0 0 0-1.5 3.3A1.7 1.7 0 0 1 12 21ZM7.5 10.5h.01M10 7h.01M14.5 7.5h.01M17 11h.01",
  leaf: "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Zm0 0c0-6 2.5-9.5 7-12",
  scissors: "M9.5 9.5 21 21M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.1 8.1 21 3M14.5 14.5 8.12 15.9",
  shovel: "M2 22l4-4M6 18l-2-2 5-5 2 2-5 5ZM11 13l6-6M14 4l6 6-3 3-6-6 3-3Z",
  sprout: "M7 20h10M12 20v-8m0 0C12 8 9 6 5 6c0 4 3 6 7 6Zm0 0c0-3.5 2.5-6 7-6 0 3.5-2.5 6-7 6Z",
  beaker: "M6 3h12M8 3v7.5L4.4 17A2 2 0 0 0 6.1 20h11.8a2 2 0 0 0 1.7-3L16 10.5V3M7 14h10",
  shield: "M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z",
  droplet: "M12 22a7 7 0 0 0 7-7c0-5-7-13-7-13S5 10 5 15a7 7 0 0 0 7 7Z",
  sparkles: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3ZM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z",

  // Como funciona
  list: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  receipt: "M6 2h12v20l-3-2-3 2-3-2-3 2V2ZM9 7h6M9 11h6M9 15h3",
  team: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11",
  dashboard: "M3 3h8v8H3V3Zm10 0h8v5h-8V3ZM13 11h8v10h-8V11ZM3 14h8v7H3v-7Z",

  // Diferenciais
  repeat: "M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4m14-1v2a4 4 0 0 1-4 4H3",
  badge: "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm-4 .5V22l4-2 4 2v-6.5",
  tools: "M14.7 6.3a4 4 0 1 0 5 5L21 21H3l7.5-7.5M9 3 3 9m3-6 3 3",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-16v6l4 2",
  "shield-check": "M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10ZM9 12l2 2 4-4",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",

  // Públicos
  home: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M10 21v-6h4v6",
  building: "M4 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M16 8h3a2 2 0 0 1 2 2v12M2 22h20M8 6h2M8 10h2M8 14h2M8 18h2",
  briefcase: "M4 7h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm5 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M2 12h20",
  store: "M3 9V6l2-3h14l2 3v3M3 9h18M5 9v12h14V9M9 21v-6h6v6",
  school: "M12 2 2 8v2h20V8L12 2ZM4 10v11M20 10v11M2 21h20M10 14h4v7h-4v-7Z",
  tractor: "M4 17h2M10 17h6M6 5h5l2 6h5v6M4 11h9M8 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  trees: "M9 20v-5M9 15 5 9h8L9 15ZM9 9 6 4h6L9 9ZM17 20v-4M17 16l-3-4h6l-3 4Zm0-4-2-3h4l-2 3Z",
  hotel: "M3 21V4h18v17M3 21h18M7 8h3M14 8h3M7 12h3M14 12h3M10 21v-5h4v5",
  bed: "M2 20v-6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6M2 16h20M6 12V8h5v4M2 20h20",

  // Interface
  check: "m5 13 4 4L19 7",
  "check-circle": "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm-4-10 3 3 5-5",
  x: "M18 6 6 18M6 6l12 12",
  "chevron-down": "m6 9 6 6 6-6",
  "chevron-up": "m18 15-6-6-6 6",
  "chevron-right": "m9 6 6 6-6 6",
  "chevron-left": "m15 6-6 6 6 6",
  "arrow-right": "M4 12h16m-6-6 6 6-6 6",
  "arrow-down": "M12 4v16m6-6-6 6-6-6",
  "arrow-up-right": "M7 17 17 7M8 7h9v9",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  menu: "M3 6h18M3 12h18M3 18h18",
  search: "m21 21-4.5-4.5M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z",
  filter: "M3 5h18l-7 8v6l-4 2v-8L3 5Z",
  upload: "M12 16V4m-5 5 5-5 5 5M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
  camera: "M4 8h2.5L8 6h8l1.5 2H20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6",
  edit: "M14 4l6 6-9.5 9.5L4 21l1.5-6.5L15 5M13 6l5 5",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14h.01M11 12h1v5h1",
  alert: "M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  spinner: "M12 3a9 9 0 1 0 9 9",
  star: "M12 3l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.2-5.9 3.2L7.3 14.5 2.5 9.9 9.1 9 12 3Z",
  quote: "M8 6c-3 0-5 2.5-5 5.5S5 17 8 17c0-3-1.5-4-3-4 0-3 1.5-4 3-4V6Zm11 0c-3 0-5 2.5-5 5.5S16 17 19 17c0-3-1.5-4-3-4 0-3 1.5-4 3-4V6Z",
  play: "M6 4l14 8-14 8V4Z",
  external: "M15 3h6v6M21 3l-9 9M18 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5",
  copy: "M8 8h11a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1ZM4 16V4a1 1 0 0 1 1-1h11",
  download: "M12 4v12m-5-5 5 5 5-5M4 20h16",
  send: "M3 11 21 3l-8 18-2-7-8-3Z",
  refresh: "M21 4v6h-6M3 20v-6h6M3.5 9a9 9 0 0 1 14.6-3.4L21 8M20.5 15a9 9 0 0 1-14.6 3.4L3 16",

  // Conta e admin
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  users: "M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm12.5 10v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11",
  lock: "M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Zm3 0V7a4 4 0 0 1 8 0v4",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  wallet: "M3 8h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a2 2 0 0 1 2-2h12v4M17 14h.01",
  "credit-card": "M2 7h20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Zm-1 4h22M5 15h4",
  pix: "M12 2 4 10l8 8 8-8-8-8Zm0 6-2 2 2 2 2-2-2-2Z",
  chart: "M3 3v18h18M7 15v3M12 9v9M17 12v6",
  "chart-pie": "M12 3a9 9 0 1 0 9 9h-9V3Z",
  "trending-up": "M3 17l6-6 4 4 8-8M15 7h6v6",
  bell: "M18 9a6 6 0 1 0-12 0c0 6-3 7-3 7h18s-3-1-3-7ZM10.5 21a2 2 0 0 0 3 0",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7.5 7.5 0 0 0-2-1.2L14.6 3H9.4L9 5.7a7.5 7.5 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7.5 7.5 0 0 0 2 1.2l.4 2.7h5.2l.4-2.7a7.5 7.5 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.06-.4.1-.8.1-1.2Z",
  tag: "M20.6 13.4 12 22l-9-9 8.6-8.6a2 2 0 0 1 1.4-.6H20a2 2 0 0 1 2 2v6.2a2 2 0 0 1-.6 1.4ZM17 7h.01",
  ticket: "M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 0 0-4ZM9 6v12",

  // Contato
  phone: "M15.6 14.2 14 15.8a12 12 0 0 1-5.8-5.8l1.6-1.6a1.5 1.5 0 0 0 .3-1.7L8.8 3.9A1.5 1.5 0 0 0 7.2 3H4.5A1.5 1.5 0 0 0 3 4.7 17 17 0 0 0 19.3 21a1.5 1.5 0 0 0 1.7-1.5v-2.7a1.5 1.5 0 0 0-.9-1.4l-2.8-1.2a1.5 1.5 0 0 0-1.7.3Z",
  mail: "M3 6h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm-.6.5L12 13l9.6-6.5",
  "map-pin": "M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  map: "m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15",
  whatsapp:
    "M12.04 2a9.9 9.9 0 0 0-8.4 15.1L2 22l5-1.3A9.9 9.9 0 1 0 12.04 2Zm4.9 13.4c-.2.6-1.2 1.2-1.7 1.2-.5.05-1 .05-1.6-.15a12 12 0 0 1-5.9-5.2c-.4-.7-.6-1.4-.5-2 .1-.6.5-1.1.8-1.4.2-.2.4-.25.6-.25h.5c.2 0 .35.05.5.4l.7 1.6c.05.15.1.3 0 .5l-.3.4-.3.35c-.1.1-.2.25-.1.45a8 8 0 0 0 3.3 2.9c.25.1.4.05.55-.1l.7-.8c.15-.2.3-.15.5-.1l1.6.75c.3.15.35.25.35.45 0 .2 0 .55-.15.85Z",
  instagram:
    "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.5-1.5h.01",
  facebook: "M14.5 9V7.5c0-.8.7-1.5 1.5-1.5h1.5V3H15a4.5 4.5 0 0 0-4.5 4.5V9H8v3h2.5v9h4v-9H17l.5-3h-3Z",
  youtube: "M2.5 8.5A3 3 0 0 1 5.4 5.6 60 60 0 0 1 18.6 5.6a3 3 0 0 1 2.9 2.9 40 40 0 0 1 0 7 3 3 0 0 1-2.9 2.9 60 60 0 0 1-13.2 0 3 3 0 0 1-2.9-2.9 40 40 0 0 1 0-7ZM10 9l5 3-5 3V9Z",
  linkedin: "M6 9v12M6 5.5h.01M11 21V9m0 4c0-2.5 1.5-4 4-4s4 1.5 4 4v8",
  file: "M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M9 14h6M9 17h4",
  "file-check": "M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M9 15l2 2 4-4",
  image: "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm5 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-6 6 5-4 4 3 3-3 5 5",
  gift: "M4 11h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9ZM3 7h18v4H3V7Zm9 0v14M12 7C12 4 10.5 3 9 3S6.5 4 6.5 7M12 7c0-3 1.5-4 3-4s2.5 1 2.5 4",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-4a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0-4a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  ruler: "M3 15 15 3l6 6L9 21l-6-6Zm4-4 2 2m2-6 2 2m-6 6 2 2",
};

export type IconName = keyof typeof paths | (string & {});

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number | string;
  /** Ícones sólidos (estrela, WhatsApp, redes) usam `fill` em vez de `stroke`. */
  filled?: boolean;
  strokeWidth?: number;
};

const FILLED = new Set(["star", "whatsapp", "facebook", "instagram", "quote", "play", "pix"]);

export function Icon({ name, size = 20, filled, strokeWidth = 1.7, ...rest }: IconProps) {
  const d = paths[name as string];
  if (!d) return null;
  const solid = filled ?? FILLED.has(name as string);

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={solid ? "currentColor" : "none"}
      stroke={solid ? "none" : "currentColor"}
      strokeWidth={solid ? undefined : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}

export const hasIcon = (name: string) => name in paths;
