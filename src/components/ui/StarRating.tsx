import { Icon } from "@/components/ui/Icon";

/**
 * Estrelas com preenchimento fracionado (4,9 mostra a última estrela 90% cheia).
 * Fica acessível por um rótulo textual — leitores de tela ouvem o valor, não 5 ícones.
 */
export function StarRating({
  value,
  size = 16,
  showValue = false,
  className = "",
}: {
  value: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(5, value));
  const label = `${clamped.toFixed(1).replace(".", ",")} de 5 estrelas`;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} role="img" aria-label={label}>
      <span className="relative inline-flex" aria-hidden>
        <span className="flex gap-0.5 text-cinza-300">
          {[0, 1, 2, 3, 4].map((i) => (
            <Icon key={i} name="star" size={size} />
          ))}
        </span>
        <span
          className="absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden text-ambar-400"
          style={{ width: `calc(${(clamped / 5) * 100}% + ${Math.floor(clamped) * 0.125}rem)`, color: "#f2c95e" }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Icon key={i} name="star" size={size} className="shrink-0" />
          ))}
        </span>
      </span>
      {showValue ? (
        <span className="text-sm font-semibold text-verde-800">{clamped.toFixed(1).replace(".", ",")}</span>
      ) : null}
    </span>
  );
}
