import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { formatNumber } from '../lib/format';
import { jobStatusMeta, type BadgeTone } from '../lib/labels';
import type { JobsByStatusPoint } from '../lib/types';

const toneHex: Record<BadgeTone, string> = {
  green: '#16a34a',
  blue: '#2563eb',
  teal: '#0d9488',
  amber: '#d97706',
  red: '#dc2626',
  purple: '#7c3aed',
  gray: '#64748b',
};

interface Row {
  label: string;
  count: number;
  color: string;
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload as Row | undefined;
  if (!row) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-card dark:border-gray-700 dark:bg-gray-800">
      <p className="font-medium text-gray-900 dark:text-white">{row.label}</p>
      <p className="mt-0.5 text-gray-500 dark:text-gray-300">{formatNumber(row.count)} serviços</p>
    </div>
  );
}

export default function JobsStatusBarChart({
  data,
  height = 300,
}: {
  data: JobsByStatusPoint[];
  height?: number;
}) {
  const rows: Row[] = data.map((d) => ({
    label: jobStatusMeta[d.status].label,
    count: d.count,
    color: toneHex[jobStatusMeta[d.status].tone],
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
        barCategoryGap={8}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          width={150}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#16a34a', fillOpacity: 0.06 }} />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22}>
          {rows.map((row) => (
            <Cell key={row.label} fill={row.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
