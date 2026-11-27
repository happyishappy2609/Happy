import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

const badgeVariants = cva('inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-[1px] text-[11.5px] font-medium leading-[18px] [&_svg]:size-3', {
  variants: {
    tone: {
      neutral: 'bg-subtle text-fg-2 border-transparent',
      outline: 'bg-card text-fg-2 border-border',
      primary: 'bg-primary-soft text-primary border-transparent',
      success: 'bg-success-soft text-success border-transparent',
      accent: 'bg-accent-soft text-accent border-transparent',
      warning: 'bg-warning-soft text-warning border-transparent',
      error: 'bg-error-soft text-error border-transparent',
      info: 'bg-info-soft text-info border-transparent',
      major: 'bg-major-soft text-major border-transparent',
    },
  },
  defaultVariants: { tone: 'neutral' },
})

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>

export function Badge({ className, tone, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}

export function Dot({ className }: { className?: string }) {
  return <span aria-hidden className={cn('inline-block size-1.5 shrink-0 rounded-full', className)} />
}
