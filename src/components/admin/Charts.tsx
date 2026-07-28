import { money, moneyShort } from "@/lib/format";

/**
 * Gráficos em SVG puro, renderizados no servidor.
 *
 * Nenhuma biblioteca de charts: são poucos KB de markup, sem JavaScript no
 * cliente e sem custo de hidratação — o painel abre instantâneo.
 */

const PALETTE = ["#2a7261", "#63b795", "#9fdfb9", "#38907a", "#20574a", "#d1ebe0"];

// ---------------------------------------------------------------------------
// Linha / área — evolução de receita
// ---------------------------------------------------------------------------

export function AreaChart({
  data,
  height = 220,
  format = "money",
  label,
}: {
  data: { label: string; value: number }[];
  height?: number;
  format?: "money" | "number";
  label: string;
}) {
  if (!data.length) return <EmptyChart height={height} />;

  const width = 720;
  const padding = { top: 16, right: 8, bottom: 28, left: 8 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const max = Math.max(...data.map((d) => d.value), 1);
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;
  const x = (i: number) => padding.left + i * stepX;
  const y = (value: number) => padding.top + innerH - (value / max) * innerH;

  // Curva suave por Catmull-Rom convertido em Bézier cúbica.
  const points = data.map((d, i) => [x(i), y(d.value)] as const);
  let path = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    path += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  const areaPath = `${path} L${points.at(-1)![0]} ${padding.top + innerH} L${points[0][0]} ${padding.top + innerH} Z`;

  const peak = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);

  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={label}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a7261" stopOpacity="0.22" />
            <stop offset="1" stopColor="#2a7261" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Linhas de grade */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + innerH * t}
            y2={padding.top + innerH * t}
            stroke="#e5eae8"
            strokeWidth="1"
          />
        ))}

        <path d={areaPath} fill="url(#areaFill)" />
        <path d={path} fill="none" stroke="#2a7261" strokeWidth="2.5" strokeLinecap="round" />

        {data.map((d, i) => (
          <circle
            key={d.label + i}
            cx={x(i)}
            cy={y(d.value)}
            r={i === peak ? 4.5 : 2.5}
            fill={i === peak ? "#2a7261" : "#ffffff"}
            stroke="#2a7261"
            strokeWidth="2"
          />
        ))}

        {data.map((d, i) => (
          <text
            key={`rotulo-${d.label}-${i}`}
            x={x(i)}
            y={height - 8}
            textAnchor="middle"
            fontSize="11"
            fill="#799a8f"
          >
            {d.label}
          </text>
        ))}
      </svg>

      <figcaption className="mt-2 flex items-center justify-between text-xs text-cinza-600">
        <span>{label}</span>
        <span className="font-medium text-verde-700">
          Pico: {format === "money" ? moneyShort(data[peak].value) : data[peak].value} em {data[peak].label}
        </span>
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Barras — agendamentos por mês
// ---------------------------------------------------------------------------

export function BarChart({
  data,
  height = 220,
  label,
  stacked,
}: {
  data: { label: string; value: number; secondary?: number }[];
  height?: number;
  label: string;
  stacked?: boolean;
}) {
  if (!data.length) return <EmptyChart height={height} />;

  const width = 720;
  const padding = { top: 16, right: 8, bottom: 28, left: 8 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const max = Math.max(...data.map((d) => d.value), 1);
  const slot = innerW / data.length;
  const barW = Math.min(38, slot * 0.55);

  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={label}>
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + innerH * t}
            y2={padding.top + innerH * t}
            stroke="#e5eae8"
          />
        ))}

        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const cx = padding.left + slot * i + slot / 2;
          const secondaryH = stacked && d.secondary ? (d.secondary / max) * innerH : 0;

          return (
            <g key={d.label + i}>
              <rect
                x={cx - barW / 2}
                y={padding.top + innerH - h}
                width={barW}
                height={Math.max(h, 1)}
                rx="4"
                fill="#d1ebe0"
              />
              {stacked && secondaryH > 0 ? (
                <rect
                  x={cx - barW / 2}
                  y={padding.top + innerH - secondaryH}
                  width={barW}
                  height={Math.max(secondaryH, 1)}
                  rx="4"
                  fill="#2a7261"
                />
              ) : null}
              <text x={cx} y={height - 8} textAnchor="middle" fontSize="11" fill="#799a8f">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      <figcaption className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-cinza-600">
        <span>{label}</span>
        {stacked ? (
          <>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-verde-200" /> criados
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-verde-600" /> concluídos
            </span>
          </>
        ) : null}
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Rosca — distribuição
// ---------------------------------------------------------------------------

export function DonutChart({
  data,
  label,
  centerLabel,
  centerValue,
}: {
  data: { label: string; value: number; revenue?: number }[];
  label: string;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (!total) return <EmptyChart height={200} />;

  const size = 180;
  const stroke = 26;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <figure className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {data.map((d, i) => {
              const fraction = d.value / total;
              const dash = fraction * circumference;
              const element = (
                <circle
                  key={d.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={PALETTE[i % PALETTE.length]}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += dash;
              return element;
            })}
          </g>
        </svg>

        {centerValue ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-semibold tracking-[-0.02em] text-verde-800">{centerValue}</span>
            {centerLabel ? <span className="mt-0.5 text-xs text-cinza-600">{centerLabel}</span> : null}
          </div>
        ) : null}
      </div>

      <dl className="w-full space-y-2.5">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-3">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
              aria-hidden
            />
            <dt className="min-w-0 flex-1 truncate text-sm text-cinza-800">{d.label}</dt>
            <dd className="shrink-0 text-sm font-semibold text-verde-800">
              {d.value}
              <span className="ml-1.5 font-normal text-cinza-600">
                {Math.round((d.value / total) * 100)}%
              </span>
              {d.revenue ? <span className="ml-2 font-normal text-cinza-600">{money(d.revenue)}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Funil — orçamentos
// ---------------------------------------------------------------------------

export function FunnelChart({ data, label }: { data: { label: string; value: number }[]; label: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <figure aria-label={label}>
      <div className="space-y-2.5">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm text-cinza-700">{d.label}</span>
            <span className="h-8 flex-1 overflow-hidden rounded-lg bg-cinza-100">
              <span
                className="flex h-full items-center justify-end rounded-lg px-2.5 text-xs font-semibold text-white transition-all"
                style={{
                  width: `${Math.max((d.value / max) * 100, d.value ? 8 : 0)}%`,
                  backgroundColor: PALETTE[i % PALETTE.length],
                }}
              >
                {d.value > 0 ? d.value : null}
              </span>
            </span>
            {d.value === 0 ? <span className="w-6 text-xs text-cinza-400">0</span> : null}
          </div>
        ))}
      </div>
      <figcaption className="mt-3 text-xs text-cinza-600">{label}</figcaption>
    </figure>
  );
}

function EmptyChart({ height }: { height: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl border border-dashed border-cinza-300 bg-cinza-50 text-sm text-cinza-600"
      style={{ height }}
    >
      Sem dados suficientes para o gráfico
    </div>
  );
}
