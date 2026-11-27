import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { InfoTip } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import { Sparkline } from './Sparkline'

export interface KPIStatCardProps {
  label: string
  value: ReactNode
  icon: ReactNode
  delta?: number
  deltaDigits?: number
  /** When true, a decrease is good (e.g. critical issues). */
  inverse?: boolean
  comparison?: string
  spark?: number[]
  tooltip?: ReactNode
  footer?: ReactNode
  onClick?: () => void
}

export function KPIStatCard({ label, value, icon, delta, deltaDigits = 0, inverse, comparison = 'vs previous period', spark, tooltip, footer, onClick }: KPIStatCardProps) {
  const good = delta === undefined ? null : inverse ? delta < 0 : delta > 0
  const flat = delta !== undefined && Math.abs(delta) < 0.05
  const Arrow = flat ? Minus : (delta ?? 0) > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <Card className={cn('relative flex min-w-0 flex-col p-4', onClick && 'transition-colors hover:border-border-strong hover:bg-hover/40')}>
      {onClick && <button type="button" onClick={onClick} className="absolute inset-0 rounded-[12px]" aria-label={`View ${label}`} />}
      <div className={cn('flex min-w-0 flex-col text-left', onClick && 'pointer-events-none')}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 text-[12.5px] font-medium text-fg-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-subtle text-fg-2 [&_svg]:size-3.5">{icon}</span>
            <span className="truncate">{label}</span>
          </div>
          {tooltip && (
            <span className="pointer-events-auto relative z-10">
              <InfoTip content={tooltip} />
            </span>
          )}
        </div>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[24px] leading-none font-semibold tracking-[-0.02em] text-fg tabular">{value}</div>
            {delta !== undefined && (
              <div className="mt-2 flex flex-wrap items-center gap-1 text-[12px]">
                <span className={cn('inline-flex items-center gap-0.5 rounded px-1 font-medium tabular', flat ? 'bg-subtle text-fg-2' : good ? 'bg-success-soft text-success' : 'bg-error-soft text-error')}>
                  <Arrow className="size-3" aria-hidden />
                  {delta > 0 ? '+' : delta < 0 ? '−' : ''}
                  {Math.abs(delta).toFixed(deltaDigits)}%
                  <span className="sr-only">{good ? '(improvement)' : '(decline)'}</span>
                </span>
                <span className="text-fg-3">{comparison}</span>
              </div>
            )}
            {footer && <div className="mt-2 text-[12px] text-fg-3">{footer}</div>}
          </div>
          {spark && spark.length > 1 && (
            <div className="hidden shrink-0 sm:block">
              <Sparkline data={spark} color={good === false ? 'var(--error-dot)' : 'var(--primary)'} width={72} height={26} />
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
