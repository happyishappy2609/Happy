import * as P from '@radix-ui/react-popover'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export const Popover = P.Root
export const PopoverTrigger = P.Trigger
export const PopoverClose = P.Close

export function PopoverContent({ children, className, align = 'end' }: { children: ReactNode; className?: string; align?: 'start' | 'center' | 'end' }) {
  return (
    <P.Portal>
      <P.Content align={align} sideOffset={6} className={cn('z-50 rounded-[12px] border border-border bg-card shadow-pop animate-fade-in focus:outline-none', className)}>
        {children}
      </P.Content>
    </P.Portal>
  )
}
