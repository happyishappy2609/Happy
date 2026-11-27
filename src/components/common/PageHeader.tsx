import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function PageHeader({ title, subtitle, actions, eyebrow, className, children }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode; className?: string; children?: ReactNode }) {
  return (
    <div className={cn('mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5">{eyebrow}</div>}
        <h1 className="text-[20px] leading-7 font-semibold tracking-[-0.01em] text-fg">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13.5px] text-fg-2">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
