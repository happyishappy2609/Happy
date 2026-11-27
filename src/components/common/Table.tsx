import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('w-full overflow-x-auto scrollbar-thin', className)}>{children}</div>
}

export function Table({ className, ...p }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full border-collapse text-left text-[13px]', className)} {...p} />
}

export function Th({ className, ...p }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('h-9 border-b border-border bg-subtle/60 px-3 text-[11.5px] font-medium whitespace-nowrap text-fg-2 first:pl-5 last:pr-5', className)} {...p} />
}

export function Td({ className, ...p }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('border-b border-border px-3 py-2.5 align-middle first:pl-5 last:pr-5', className)} {...p} />
}

export function Tr({ className, onClick, ...p }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('transition-colors last:[&>td]:border-b-0', onClick && 'cursor-pointer hover:bg-hover focus-visible:bg-hover', className)}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
                e.preventDefault()
                onClick(e as never)
              }
            }
          : undefined
      }
      {...p}
    />
  )
}

export function SortHeader({ label, dir, onClick, align = 'left' }: { label: ReactNode; dir: false | 'asc' | 'desc'; onClick?: (e: unknown) => void; align?: 'left' | 'right' }) {
  const Icon = dir === 'asc' ? ArrowUp : dir === 'desc' ? ArrowDown : ArrowUpDown
  return (
    <button type="button" onClick={onClick} className={cn('group inline-flex items-center gap-1 rounded hover:text-fg', align === 'right' && 'flex-row-reverse')}>
      {label}
      <Icon className={cn('size-3', dir ? 'text-fg' : 'text-fg-3 opacity-0 group-hover:opacity-100')} aria-hidden />
      <span className="sr-only">{dir ? `sorted ${dir === 'asc' ? 'ascending' : 'descending'}` : 'sortable'}</span>
    </button>
  )
}

export function Pagination({ page, pageCount, total, pageSize, onPage, label = 'results' }: { page: number; pageCount: number; total: number; pageSize: number; onPage: (p: number) => void; label?: string }) {
  if (total === 0) return null
  const from = page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-2.5 text-[12.5px] text-fg-2">
      <span className="tabular">
        {from}–{to} of {total} {label}
      </span>
      <div className="flex items-center gap-1">
        <Button size="icon-sm" variant="ghost" disabled={page === 0} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft />
        </Button>
        <span className="px-1 tabular">
          {page + 1} / {Math.max(1, pageCount)}
        </span>
        <Button size="icon-sm" variant="ghost" disabled={page >= pageCount - 1} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
