import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { formatDate, formatMoney, formatMoneyCompact, formatShortDay } from '../lib/format';
import type { RevenuePoint } from '../lib/types';

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as RevenuePoint | undefined;
  if (!point) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-card dark:border-gray-700 dark:bg-gray-800">
      <p className="text-gray-400">{formatDate(point.date)}</p>
      <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">
        {formatMoney(point.cents)}
      </p>
    </div>
  );
}

export default function RevenueAreaChart({
  data,
  height = 300,
}: {
  data: RevenuePoint[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => formatShortDay(v)}
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          minTickGap={24}
        />
        <YAxis
          tickFormatter={(v: number) => formatMoneyCompact(v)}
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          width={72}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#16a34a', strokeOpacity: 0.3 }} />
        <Area
          type="monotone"
          dataKey="cents"
          stroke="#16a34a"
          strokeWidth={2.5}
          fill="url(#revenueFill)"
          activeDot={{ r: 4, strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
