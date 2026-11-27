import * as TT from '@radix-ui/react-tooltip'
import { Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export const TooltipProvider = TT.Provider

export function Tooltip({ content, children, side = 'top', className }: { content: ReactNode; children: ReactNode; side?: 'top' | 'bottom' | 'left' | 'right'; className?: string }) {
  if (!content) return <>{children}</>
  return (
    <TT.Root delayDuration={250}>
      <TT.Trigger asChild>{children}</TT.Trigger>
      <TT.Portal>
        <TT.Content side={side} sideOffset={6} className={cn('z-[60] max-w-[280px] rounded-lg bg-[#14233B] px-2.5 py-1.5 text-[12px] leading-snug text-white shadow-pop animate-fade-in dark:bg-[#24324a]', className)}>
          {content}
          <TT.Arrow className="fill-[#14233B] dark:fill-[#24324a]" />
        </TT.Content>
      </TT.Portal>
    </TT.Root>
  )
}

export function InfoTip({ content, className }: { content: ReactNode; className?: string }) {
  return (
    <Tooltip content={content}>
      <button type="button" aria-label="More information" className={cn('inline-flex rounded text-fg-3 hover:text-fg-2', className)}>
        <Info className="size-3.5" />
      </button>
    </Tooltip>
  )
}
