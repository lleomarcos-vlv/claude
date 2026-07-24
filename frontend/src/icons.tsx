// Ícones vetoriais (SVG, traço em currentColor) — substituem emojis por ícones
// desenhados, nítidos e consistentes em qualquer tamanho.

type P = { size?: number; className?: string };

function Svg(props: P & { children: React.ReactNode; fill?: boolean }) {
  const s = props.size ?? 22;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className={props.className}
      fill={props.fill ? "currentColor" : "none"} stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {props.children}
    </svg>
  );
}

export const IconHome = (p: P) => <Svg {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></Svg>;
export const IconPhone = (p: P) => <Svg {...p}><path d="M4 5c0-1 .8-2 2-2h2l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v2c0 1.2-1 2-2 2A16 16 0 0 1 4 5Z" /></Svg>;
export const IconWrench = (p: P) => <Svg {...p}><path d="M15 6a4 4 0 0 1 5 5l-2-.5-2 2 .5 2a4 4 0 0 1-5-5l2 .5 2-2Z" /><path d="M11 13 4.5 19.5a2 2 0 0 1-3-3L8 10" /></Svg>;
export const IconDrone = (p: P) => <Svg {...p}><circle cx="5" cy="6" r="2.2" /><circle cx="19" cy="6" r="2.2" /><circle cx="5" cy="18" r="2.2" /><circle cx="19" cy="18" r="2.2" /><path d="M7 7.6 10 10.5M17 7.6 14 10.5M7 16.4 10 13.5M17 16.4 14 13.5" /><rect x="9.5" y="9.5" width="5" height="5" rx="1.2" /></Svg>;
export const IconBox = (p: P) => <Svg {...p}><path d="M12 3 20 7v10l-8 4-8-4V7Z" /><path d="M4 7l8 4 8-4M12 11v10" /></Svg>;
export const IconAI = (p: P) => <Svg {...p}><rect x="6" y="6" width="12" height="12" rx="2.5" /><path d="M9.5 10.5h5v3h-5z" /><path d="M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2" /></Svg>;
export const IconMoney = (p: P) => <Svg {...p}><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9v6M18 9v6" /></Svg>;
export const IconUsers = (p: P) => <Svg {...p}><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3 3 0 0 1 0 5.8M17 13.5a5.5 5.5 0 0 1 4 5.5" /></Svg>;
export const IconSearch = (p: P) => <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.5-3.5" /></Svg>;
export const IconCode = (p: P) => <Svg {...p}><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" /></Svg>;
export const IconCalendar = (p: P) => <Svg {...p}><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></Svg>;
export const IconBell = (p: P) => <Svg {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 19a2 2 0 0 0 4 0" /></Svg>;
export const IconPdf = (p: P) => <Svg {...p}><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /><path d="M9.5 12h5M9.5 15h5" /></Svg>;
export const IconWhatsapp = (p: P) => <Svg {...p}><path d="M4 20l1.4-4A8 8 0 1 1 9 19.2L4 20Z" /><path d="M8.5 9.5c0 3 2 5 5 5" /></Svg>;
export const IconPlus = (p: P) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const IconDownload = (p: P) => <Svg {...p}><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" /></Svg>;
export const IconLogout = (p: P) => <Svg {...p}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 12H3m0 0 3.5-3.5M3 12l3.5 3.5" /></Svg>;
export const IconMenu = (p: P) => <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>;

const MAPA: Record<string, (p: P) => React.ReactNode> = {
  home: IconHome, phone: IconPhone, wrench: IconWrench, drone: IconDrone,
  box: IconBox, ai: IconAI, money: IconMoney, users: IconUsers,
  search: IconSearch, code: IconCode, calendar: IconCalendar,
};

export function Icon({ name, size }: { name: string; size?: number }) {
  const C = MAPA[name] ?? IconHome;
  return <>{C({ size })}</>;
}

/** Ilustração: técnico ajustando um drone (tela de acesso / estados vazios). */
export function TecnicoDrone({ size = 132 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.72} viewBox="0 0 200 144" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2563eb" /><stop offset="1" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="132" rx="72" ry="8" fill="#e2e8f0" />
      {/* drone */}
      <g stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" fill="none">
        <line x1="70" y1="52" x2="46" y2="40" /><line x1="130" y1="52" x2="154" y2="40" />
        <ellipse cx="42" cy="39" rx="12" ry="3" fill="#93c5fd" />
        <ellipse cx="158" cy="39" rx="12" ry="3" fill="#93c5fd" />
      </g>
      <rect x="72" y="46" width="56" height="20" rx="6" fill="url(#cg)" />
      <circle cx="100" cy="70" r="4" fill="#0f172a" />
      {/* técnico */}
      <g>
        <circle cx="58" cy="78" r="11" fill="#f8b98a" />
        <path d="M47 74a11 11 0 0 1 22 0Z" fill="#0f172a" />
        <path d="M52 88h12l6 34H46Z" fill="url(#cg)" />
        <rect x="44" y="120" width="10" height="18" rx="3" fill="#334155" />
        <rect x="62" y="120" width="10" height="18" rx="3" fill="#334155" />
        {/* braço + chave de fenda apontando ao drone */}
        <path d="M64 96 96 66" stroke="#f8b98a" strokeWidth="7" strokeLinecap="round" />
        <path d="M96 66l8-6" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
