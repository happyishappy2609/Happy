import * as S from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface Option {
  value: string
  label: ReactNode
  hint?: ReactNode
}

/** Accessible select (Radix). Empty string values are not allowed by Radix — use "all" for "All". */
export function Select({ value, onValueChange, options, placeholder, className, 'aria-label': ariaLabel, id, size = 'md', disabled, prefix }: { value: string; onValueChange: (v: string) => void; options: Option[]; placeholder?: string; className?: string; 'aria-label'?: string; id?: string; size?: 'sm' | 'md'; disabled?: boolean; prefix?: ReactNode }) {
  return (
    <S.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <S.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          'inline-flex w-full items-center justify-between gap-1.5 rounded-lg border border-border-strong bg-card px-2.5 text-left text-[13px] text-fg transition-colors hover:border-fg-3/60 focus:border-primary focus:ring-3 focus:ring-primary/15 focus:outline-none data-[placeholder]:text-fg-3 disabled:opacity-50',
          size === 'sm' ? 'h-7 text-[12.5px]' : 'h-8',
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          {prefix && <span className="shrink-0 text-fg-3">{prefix}</span>}
          <S.Value placeholder={placeholder} />
        </span>
        <S.Icon>
          <ChevronDown className="size-3.5 shrink-0 text-fg-3" />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content position="popper" sideOffset={4} className="z-[70] max-h-[min(360px,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[10px] border border-border bg-card shadow-pop animate-fade-in">
          <S.Viewport className="p-1">
            {options.map((o) => (
              <S.Item key={o.value} value={o.value} className="relative flex cursor-pointer items-center rounded-md py-1.5 pr-2 pl-7 text-[13px] text-fg outline-none select-none data-[highlighted]:bg-hover">
                <S.ItemIndicator className="absolute left-2">
                  <Check className="size-3.5 text-primary" />
                </S.ItemIndicator>
                <S.ItemText>{o.label}</S.ItemText>
                {o.hint && <span className="ml-auto pl-3 text-[11.5px] text-fg-3">{o.hint}</span>}
              </S.Item>
            ))}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  )
}
