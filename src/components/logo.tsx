type LogoProps = {
  variant?: "full" | "mark";
  tone?: "dark" | "light";
  className?: string;
  brandName?: string;
};

/** Marca da Padaria Villa Reis: selo com espiga de trigo + monograma VR. */
export function Logo({ variant = "full", tone = "dark", className = "", brandName }: LogoProps) {
  const ink = tone === "light" ? "#FBF6EE" : "#241609";
  const gold = tone === "light" ? "#E0B968" : "#C08A35";
  const [first, ...rest] = (brandName ?? "Padaria Villa Reis").split(" ");
  const line2 = rest.join(" ") || first;

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <svg viewBox="0 0 64 64" className="h-10 w-10 shrink-0" aria-hidden="true">
        <circle cx="32" cy="32" r="30" fill="none" stroke={gold} strokeWidth="1.5" />
        <circle cx="32" cy="32" r="26" fill="none" stroke={ink} strokeWidth="0.75" opacity="0.35" />
        <g stroke={gold} strokeWidth="1.6" strokeLinecap="round" fill="none">
          <path d="M32 13v13" />
          <path d="M32 16c-3 .2-4.6 2-4.8 4.6 2.8.3 4.6-1.4 4.8-4.6Z" fill={gold} stroke="none" />
          <path d="M32 16c3 .2 4.6 2 4.8 4.6-2.8.3-4.6-1.4-4.8-4.6Z" fill={gold} stroke="none" />
          <path d="M32 21.5c-3 .2-4.6 2-4.8 4.6 2.8.3 4.6-1.4 4.8-4.6Z" fill={gold} stroke="none" />
          <path d="M32 21.5c3 .2 4.6 2 4.8 4.6-2.8.3-4.6-1.4-4.8-4.6Z" fill={gold} stroke="none" />
        </g>
        <text
          x="32"
          y="47"
          textAnchor="middle"
          fill={ink}
          fontFamily="var(--font-display), Georgia, serif"
          fontSize="17"
          fontWeight="600"
          letterSpacing="0.5"
        >
          VR
        </text>
      </svg>

      {variant === "full" ? (
        <span className="flex flex-col leading-none">
          <span
            className="text-[0.6rem] font-semibold uppercase tracking-[0.34em]"
            style={{ color: gold }}
          >
            {first}
          </span>
          <span
            className="font-display text-[1.35rem] leading-tight font-semibold tracking-tight"
            style={{ color: ink }}
          >
            {line2}
          </span>
        </span>
      ) : null}
    </span>
  );
}
