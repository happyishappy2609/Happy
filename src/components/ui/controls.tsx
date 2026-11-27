import * as CB from '@radix-ui/react-checkbox'
import * as SW from '@radix-ui/react-switch'
import { Check, Minus } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function Checkbox({ checked, onCheckedChange, id, label, className, 'aria-label': ariaLabel, disabled }: { checked: boolean | 'indeterminate'; onCheckedChange: (v: boolean) => void; id?: string; label?: ReactNode; className?: string; 'aria-label'?: string; disabled?: boolean }) {
  const box = (
    <CB.Root
      id={id}
      checked={checked}
      disabled={disabled}
      aria-label={ariaLabel}
      onCheckedChange={(v) => onCheckedChange(v === true)}
      onClick={(e) => e.stopPropagation()}
      className="flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-border-strong bg-card transition-colors hover:border-fg-3 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary disabled:opacity-50"
    >
      <CB.Indicator className="text-white">{checked === 'indeterminate' ? <Minus className="size-3" strokeWidth={3} /> : <Check className="size-3" strokeWidth={3} />}</CB.Indicator>
    </CB.Root>
  )
  if (!label) return box
  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-2 text-[13px] text-fg', className)}>
      <span className="mt-0.5">{box}</span>
      <span className="min-w-0">{label}</span>
    </label>
  )
}

export function Switch({ checked, onCheckedChange, id, disabled, 'aria-label': ariaLabel }: { checked: boolean; onCheckedChange: (v: boolean) => void; id?: string; disabled?: boolean; 'aria-label'?: string }) {
  return (
    <SW.Root
      id={id}
      checked={checked}
      disabled={disabled}
      aria-label={ariaLabel}
      onCheckedChange={onCheckedChange}
      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-border-strong transition-colors data-[state=checked]:bg-primary disabled:opacity-50"
    >
      <SW.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[18px]" />
    </SW.Root>
  )
}

export function ProgressBar({ value, className, tone = 'primary', size = 'md', label }: { value: number; className?: string; tone?: 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral'; size?: 'sm' | 'md'; label?: string }) {
  const color = { primary: 'bg-primary', accent: 'bg-accent', success: 'bg-success-dot', warning: 'bg-warning-dot', error: 'bg-error-dot', neutral: 'bg-fg-3' }[tone]
  return (
    <div role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label} className={cn('w-full overflow-hidden rounded-full bg-subtle', size === 'sm' ? 'h-1.5' : 'h-2', className)}>
      <div className={cn('h-full rounded-full transition-[width] duration-500 ease-out', color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} />
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-border bg-subtle px-1 font-sans text-[10.5px] text-fg-2">{children}</kbd>
}
