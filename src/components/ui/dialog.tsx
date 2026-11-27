import * as D from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (o: boolean) => void; children: ReactNode }) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </D.Root>
  )
}

export function DialogContent({
  title,
  description,
  children,
  footer,
  className,
  size = 'md',
  hideClose,
  onInteractOutside,
}: {
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hideClose?: boolean
  onInteractOutside?: (e: Event) => void
}) {
  const w = { sm: 'max-w-[420px]', md: 'max-w-[560px]', lg: 'max-w-[720px]', xl: 'max-w-[920px]' }[size]
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)] animate-fade-in" />
      <D.Content
        onInteractOutside={onInteractOutside}
        className={cn(
          'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[14px] border border-border bg-card shadow-modal animate-pop-in focus:outline-none',
          w,
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <D.Title className="text-[15px] font-semibold text-fg">{title}</D.Title>
            {description ? <D.Description className="mt-0.5 text-[12.5px] text-fg-2">{description}</D.Description> : <D.Description className="sr-only">Dialog</D.Description>}
          </div>
          {!hideClose && (
            <D.Close className="-mt-0.5 -mr-1 rounded-md p-1 text-fg-3 hover:bg-hover hover:text-fg" aria-label="Close">
              <X className="size-4" />
            </D.Close>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-subtle/50 px-5 py-3 rounded-b-[14px]">{footer}</div>}
      </D.Content>
    </D.Portal>
  )
}

export function Drawer({ open, onOpenChange, title, description, children, footer, width = 'max-w-[560px]', headerExtra }: { open: boolean; onOpenChange: (o: boolean) => void; title: ReactNode; description?: ReactNode; children: ReactNode; footer?: ReactNode; width?: string; headerExtra?: ReactNode }) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)] animate-fade-in" />
        <D.Content className={cn('fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-card shadow-modal animate-slide-in focus:outline-none', width)}>
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0 flex-1">
              <D.Title className="text-[15px] font-semibold text-fg">{title}</D.Title>
              {description ? <D.Description className="mt-0.5 text-[12.5px] text-fg-2">{description}</D.Description> : <D.Description className="sr-only">Details</D.Description>}
              {headerExtra}
            </div>
            <D.Close className="-mt-0.5 -mr-1 rounded-md p-1 text-fg-3 hover:bg-hover hover:text-fg" aria-label="Close">
              <X className="size-4" />
            </D.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">{children}</div>
          {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>}
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}

export const DialogClose = D.Close
