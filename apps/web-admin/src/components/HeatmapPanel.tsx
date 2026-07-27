import { useMemo } from 'react';
import { IconMapPin } from './icons';
import type { HeatmapPoint } from '../lib/types';

const COLS = 16;
const ROWS = 9;

/**
 * Lightweight demand "heatmap" — bins geo points into a grid and shades each cell
 * by aggregated weight. No map SDK; it's a stylized density panel that conveys
 * where service requests concentrate.
 */
export default function HeatmapPanel({ points }: { points: HeatmapPoint[] }) {
  const { grid, max } = useMemo(() => {
    const g: number[][] = Array.from({ length: ROWS }, () => Array<number>(COLS).fill(0));
    if (points.length === 0) return { grid: g, max: 0 };

    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const spanLat = maxLat - minLat || 1;
    const spanLng = maxLng - minLng || 1;

    for (const p of points) {
      const col = Math.min(COLS - 1, Math.max(0, Math.floor(((p.lng - minLng) / spanLng) * COLS)));
      const rowRaw = Math.floor(((p.lat - minLat) / spanLat) * ROWS);
      // Invert so north (higher lat) is at the top.
      const row = Math.min(ROWS - 1, Math.max(0, ROWS - 1 - rowRaw));
      const line = g[row];
      if (line) line[col] = (line[col] ?? 0) + p.weight;
    }

    const flatMax = Math.max(...g.flat());
    return { grid: g, max: flatMax };
  }, [points]);

  return (
    <div>
      <div
        className="grid gap-1 rounded-xl bg-gray-50 p-3 dark:bg-gray-950/40"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {grid.flatMap((line, r) =>
          Array.from({ length: COLS }, (_, c) => {
            const value = line[c] ?? 0;
            const intensity = max > 0 ? value / max : 0;
            const alpha = value > 0 ? 0.12 + intensity * 0.88 : 0;
            return (
              <div
                key={`${r}-${c}`}
                className="aspect-square rounded-[3px] ring-1 ring-inset ring-black/[0.03] dark:ring-white/[0.03]"
                style={{
                  backgroundColor:
                    value > 0 ? `rgba(22, 163, 74, ${alpha})` : 'rgba(148, 163, 184, 0.10)',
                }}
                title={value > 0 ? `Intensidade: ${(intensity * 100).toFixed(0)}%` : 'Sem demanda'}
              />
            );
          }),
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <IconMapPin width={14} height={14} />
          Sudeste (SP · RJ · Campinas · Santos)
        </span>
        <span className="flex items-center gap-2">
          Menor
          <span className="flex h-2.5 w-24 overflow-hidden rounded-full">
            <span
              className="h-full w-full"
              style={{
                background: 'linear-gradient(to right, rgba(22,163,74,0.12), rgba(22,163,74,1))',
              }}
            />
          </span>
          Maior
        </span>
      </div>
    </div>
  );
}
