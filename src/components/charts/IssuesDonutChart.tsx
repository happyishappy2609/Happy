import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { cn } from '@/utils/cn'
import { SERIES, makeTooltip } from './ChartTooltip'

export interface DonutDatum {
  name: string
  value: number
  color?: string
}

export function IssuesDonutChart({ data, centerLabel = 'Issues', height = 200, valueSuffix = '', showPercent = true }: { data: DonutDatum[]; centerLabel?: string; height?: number; valueSuffix?: string; showPercent?: boolean }) {
  const [active, setActive] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)
  const colored = data.map((d, i) => ({ ...d, color: d.color ?? SERIES[i % SERIES.length] }))
  const Tip = useMemo(() => makeTooltip((_n, v) => `${v}${valueSuffix}${showPercent && total ? ` · ${Math.round((v / total) * 100)}%` : ''}`, () => null), [valueSuffix, showPercent, total])
  const focus = active !== null ? colored[active] : null
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={colored} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="96%" paddingAngle={1.5} stroke="var(--card)" strokeWidth={2} isAnimationActive={false} onMouseEnter={(_, i) => setActive(i)} onMouseLeave={() => setActive(null)}>
              {colored.map((d, i) => (
                <Cell key={d.name} fill={d.color} opacity={active === null || active === i ? 1 : 0.35} />
              ))}
            </Pie>
            <Tooltip content={<Tip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[22px] font-semibold text-fg tabular">{focus ? (showPercent && total ? `${Math.round((focus.value / total) * 100)}%` : focus.value) : total}</span>
          <span className="text-[11.5px] text-fg-3">{focus ? focus.name : centerLabel}</span>
        </div>
      </div>
      <ul className="grid w-full min-w-0 grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-1">
        {colored.map((d, i) => (
          <li key={d.name}>
            <button
              type="button"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className={cn('flex w-full items-center justify-between gap-3 rounded px-1 py-0.5 text-[12.5px] transition-opacity', active !== null && active !== i && 'opacity-50')}
            >
              <span className="flex min-w-0 items-center gap-2 text-fg-2">
                <span className="size-2 shrink-0 rounded-sm" style={{ background: d.color }} aria-hidden />
                <span className="truncate">{d.name}</span>
              </span>
              <span className="font-medium text-fg tabular">
                {showPercent && total ? `${Math.round((d.value / total) * 100)}%` : `${d.value}${valueSuffix}`}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
