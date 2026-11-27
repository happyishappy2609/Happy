import { ArrowRight, Search, X } from 'lucide-react'
import { forwardRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Client, LangCode } from '@/types'
import { cn } from '@/utils/cn'
import { langName, langShort } from '@/utils/languages'

export function LangPair({ source, targets, max = 3, className }: { source: LangCode; targets: LangCode[]; max?: number; className?: string }) {
  const shown = targets.slice(0, max)
  return (
    <span className={cn('inline-flex items-center gap-1 text-[12.5px] text-fg-2', className)} title={`${langName(source)} → ${targets.map(langName).join(', ')}`}>
      <span className="font-medium text-fg">{langShort(source)}</span>
      <ArrowRight className="size-3 text-fg-3" aria-label="to" />
      <span className="flex flex-wrap items-center gap-1">
        {shown.map((t) => (
          <span key={t} className="rounded bg-subtle px-1 text-[11.5px] font-medium text-fg">
            {langShort(t)}
          </span>
        ))}
        {targets.length > max && <span className="text-[11.5px] text-fg-3">+{targets.length - max}</span>}
      </span>
    </span>
  )
}

export function LangChip({ lang, className }: { lang: LangCode; className?: string }) {
  return (
    <span className={cn('inline-flex rounded bg-subtle px-1 text-[11.5px] font-medium text-fg', className)} title={langName(lang)}>
      {langShort(lang)}
    </span>
  )
}

export function ClientBadge({ client, link = false, className }: { client?: Client; link?: boolean; className?: string }) {
  if (!client) return <span className="text-fg-3">—</span>
  const inner = (
    <>
      <span className="flex size-4 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white" style={{ background: client.color }} aria-hidden>
        {client.name[0]}
      </span>
      <span className="truncate">{client.name}</span>
    </>
  )
  const cls = cn('inline-flex min-w-0 items-center gap-1.5 text-[13px] text-fg', className)
  return link ? (
    <Link to={`/clients/${client.id}`} className={cn(cls, 'hover:underline')} onClick={(e) => e.stopPropagation()}>
      {inner}
    </Link>
  ) : (
    <span className={cls}>{inner}</span>
  )
}

export const SearchBar = forwardRef<HTMLInputElement, { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; 'aria-label'?: string }>(
  ({ value, onChange, placeholder = 'Search…', className, ...rest }, ref) => (
    <div className={cn('relative min-w-0', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-fg-3" aria-hidden />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={rest['aria-label'] ?? placeholder}
        className="h-8 w-full rounded-lg border border-border-strong bg-card pr-7 pl-8 text-[13px] text-fg placeholder:text-fg-3 hover:border-fg-3/60 focus:border-primary focus:ring-3 focus:ring-primary/15 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-0.5 text-fg-3 hover:bg-hover hover:text-fg" aria-label="Clear search">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  ),
)
SearchBar.displayName = 'SearchBar'

export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>
}

export function EmptyState({ icon, title, description, action, className }: { icon: ReactNode; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-subtle text-fg-2 [&_svg]:size-5">{icon}</div>
      <h3 className="text-[14px] font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] text-fg-2">{description}</p>}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}

export function DemoTag({ children = 'Demo', className }: { children?: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center rounded border border-dashed border-border-strong px-1.5 text-[10.5px] font-medium tracking-wide text-fg-3 uppercase', className)}>{children}</span>
}

export function Stat({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="text-[12px] text-fg-3">{label}</div>
      <div className="mt-0.5 text-[13.5px] font-medium break-words text-fg">{value}</div>
    </div>
  )
}

export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-2 flex items-center justify-between gap-2', className)}>
      <h3 className="text-[12px] font-semibold tracking-wide text-fg-3 uppercase">{children}</h3>
      {action}
    </div>
  )
}
