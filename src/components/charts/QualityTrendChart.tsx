import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate } from '@/utils/dates'
import { AXIS_TICK, makeTooltip } from './ChartTooltip'

export interface TrendPoint {
  date: string
  score: number
  target?: number
  [k: string]: number | string | undefined
}

const Tip = makeTooltip(
  (_n, v) => `${v.toFixed(1)}%`,
  (label) => formatDate(String(label), { weekday: 'short', month: 'short', day: 'numeric' }),
)

export function QualityTrendChart({ data, target = 95, height = 240, series }: { data: TrendPoint[]; target?: number; height?: number; series?: { key: string; name: string; color: string }[] }) {
  const lines = series ?? [{ key: 'score', name: 'Quality Score', color: 'var(--chart-1)' }]
  const values = data.flatMap((d) => lines.map((l) => Number(d[l.key] ?? NaN))).filter((v) => !Number.isNaN(v))
  const min = Math.floor(Math.min(target, ...values) - 1)
  const max = Math.ceil(Math.max(target, ...values) + 0.5)
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="date" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => formatDate(String(v))} minTickGap={28} />
          <YAxis domain={[min, Math.min(100, max)]} tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} width={44} allowDecimals={false} />
          <Tooltip content={<Tip />} cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '3 3' }} />
          <ReferenceLine y={target} stroke="var(--chart-target)" strokeDasharray="4 4" ifOverflow="extendDomain" label={{ value: `QA Target ${target}%`, position: 'insideTopRight', fill: 'var(--fg-3)', fontSize: 11 }} />
          {lines.map((l) => (
            <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} isAnimationActive={false} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
