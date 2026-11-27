import * as T from '@radix-ui/react-tabs'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export const Tabs = T.Root
export const TabsContent = T.Content

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return <T.List className={cn('flex items-center gap-1 overflow-x-auto border-b border-border scrollbar-thin', className)}>{children}</T.List>
}

export function TabsTrigger({ value, children, count }: { value: string; children: ReactNode; count?: number }) {
  return (
    <T.Trigger
      value={value}
      className="relative -mb-px flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-2.5 py-2.5 text-[13px] font-medium text-fg-2 transition-colors hover:text-fg data-[state=active]:border-primary data-[state=active]:text-fg"
    >
      {children}
      {count !== undefined && <span className="rounded-full bg-subtle px-1.5 text-[11px] leading-[18px] text-fg-2 tabular">{count}</span>}
    </T.Trigger>
  )
}

/** Compact pill-style segmented control. */
export function Segmented<T extends string>({ value, onChange, options, className, size = 'md', 'aria-label': ariaLabel }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; count?: number }[]; className?: string; size?: 'sm' | 'md'; 'aria-label'?: string }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn('inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-subtle p-0.5 scrollbar-thin', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-md font-medium text-fg-2 transition-colors hover:text-fg',
            size === 'sm' ? 'h-6 px-2 text-[12px]' : 'h-7 px-2.5 text-[12.5px]',
            value === o.value && 'bg-card text-fg shadow-card',
          )}
        >
          {o.label}
          {o.count !== undefined && <span className={cn('tabular text-[11px]', value === o.value ? 'text-fg-2' : 'text-fg-3')}>{o.count}</span>}
        </button>
      ))}
    </div>
  )
}
