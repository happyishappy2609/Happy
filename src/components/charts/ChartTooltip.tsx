import type { ReactNode } from 'react'

export interface TooltipRow {
  name: ReactNode
  value: ReactNode
  color?: string
}

export function ChartTooltipBox({ title, rows }: { title?: ReactNode; rows: TooltipRow[] }) {
  return (
    <div className="min-w-[150px] rounded-lg border border-border bg-card px-3 py-2 text-[12px] shadow-pop">
      {title && <div className="mb-1.5 font-medium text-fg">{title}</div>}
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-fg-2">
              {r.color && <span className="inline-block size-2 rounded-full" style={{ background: r.color }} />}
              {r.name}
            </span>
            <span className="font-medium text-fg tabular">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Recharts passes a loosely-typed payload; this keeps chart call-sites tidy.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPayload = any

export function makeTooltip(format: (name: string, value: number, entry: AnyPayload) => ReactNode, titleFormat?: (label: AnyPayload, payload: AnyPayload[]) => ReactNode) {
  return function TooltipContent({ active, payload, label }: { active?: boolean; payload?: AnyPayload[]; label?: AnyPayload }) {
    if (!active || !payload?.length) return null
    return (
      <ChartTooltipBox
        title={titleFormat ? titleFormat(label, payload) : label}
        rows={payload
          .filter((p: AnyPayload) => p.value !== undefined && p.value !== null)
          .map((p: AnyPayload) => ({ name: p.name, value: format(String(p.name), Number(p.value), p), color: p.color ?? p.payload?.fill ?? p.fill }))}
      />
    )
  }
}

export const AXIS_TICK = { fill: 'var(--fg-3)', fontSize: 11 }
export const SERIES = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)']
