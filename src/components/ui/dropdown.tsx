import * as DM from '@radix-ui/react-dropdown-menu'
import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export const DropdownMenu = DM.Root
export const DropdownTrigger = DM.Trigger

export function DropdownContent({ children, align = 'end', className, sideOffset = 6 }: { children: ReactNode; align?: 'start' | 'end' | 'center'; className?: string; sideOffset?: number }) {
  return (
    <DM.Portal>
      <DM.Content align={align} sideOffset={sideOffset} className={cn('z-50 min-w-[180px] rounded-[10px] border border-border bg-card p-1 shadow-pop animate-fade-in', className)}>
        {children}
      </DM.Content>
    </DM.Portal>
  )
}

export function DropdownItem({ children, onSelect, icon, danger, disabled, shortcut, className }: { children: ReactNode; onSelect?: (e: Event) => void; icon?: ReactNode; danger?: boolean; disabled?: boolean; shortcut?: string; className?: string }) {
  return (
    <DM.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-fg outline-none select-none data-[highlighted]:bg-hover data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45 [&_svg]:size-4 [&_svg]:text-fg-3',
        danger && 'text-error data-[highlighted]:bg-error-soft [&_svg]:text-error',
        className,
      )}
    >
      {icon}
      <span className="flex-1">{children}</span>
      {shortcut && <span className="text-[11px] text-fg-3">{shortcut}</span>}
    </DM.Item>
  )
}

export function DropdownCheckItem({ children, checked, onSelect }: { children: ReactNode; checked: boolean; onSelect: () => void }) {
  return (
    <DM.CheckboxItem
      checked={checked}
      onSelect={(e) => {
        e.preventDefault()
        onSelect()
      }}
      className="flex cursor-pointer items-center gap-2 rounded-md py-1.5 pr-2 pl-7 text-[13px] text-fg outline-none select-none data-[highlighted]:bg-hover relative"
    >
      <DM.ItemIndicator className="absolute left-2">
        <Check className="size-3.5 text-primary" />
      </DM.ItemIndicator>
      {children}
    </DM.CheckboxItem>
  )
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return <DM.Label className="px-2 pt-1.5 pb-1 text-[11px] font-medium tracking-wide text-fg-3 uppercase">{children}</DM.Label>
}

export function DropdownSeparator() {
  return <DM.Separator className="my-1 h-px bg-border" />
}
