import { LEAF_PATH, LOGO_GEOMETRY, WORDMARK_GLYPHS, brandColors } from "@/lib/brand";

const { width, height, baseline, wordmarkX } = LOGO_GEOMETRY;

type LogoProps = {
  /** Altura renderizada em px. A largura acompanha a proporção. */
  height?: number;
  /** `brand` usa as cores oficiais; `light` inverte para fundos escuros; `mono` herda currentColor. */
  variant?: "brand" | "light" | "mono";
  className?: string;
  /** Texto alternativo — use `false` quando o logotipo é decorativo ao lado de um texto. */
  title?: string | false;
};

/**
 * Logotipo Verde Fixo em SVG puro (contornos extraídos do catálogo oficial),
 * sem dependência de webfont — pesa poucos KB e fica nítido em qualquer escala.
 */
export function Logo({ height: h = 32, variant = "brand", className, title = "Verde Fixo" }: LogoProps) {
  const wordColor = variant === "light" ? "#ffffff" : variant === "mono" ? "currentColor" : brandColors.primary;
  const leafColor = variant === "mono" ? "currentColor" : brandColors.leaf;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      height={h}
      width={(h * width) / height}
      className={className}
      role={title === false ? "presentation" : "img"}
      aria-label={title === false ? undefined : title}
      aria-hidden={title === false ? true : undefined}
      focusable="false"
    >
      {title !== false ? <title>{title}</title> : null}
      <path d={LEAF_PATH} fill={leafColor} opacity={variant === "mono" ? 0.55 : 1} />
      <g transform={`translate(${wordmarkX} ${baseline}) scale(1 -1)`} fill={wordColor}>
        {WORDMARK_GLYPHS.map((g, i) => (
          <path key={i} transform={`translate(${g.x} 0)`} d={g.d} />
        ))}
      </g>
    </svg>
  );
}

/** Apenas a folha — para favicon, avatares e selos. */
export function LogoMark({ size = 24, className, color }: { size?: number; className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 170 752"
      width={(size * 170) / 752}
      height={size}
      className={className}
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <path d={LEAF_PATH} fill={color ?? brandColors.leaf} />
    </svg>
  );
}
