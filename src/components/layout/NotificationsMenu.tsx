import { Bell, CheckCheck, CircleAlert, Clock, FileBarChart, ScanSearch, UserCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAppStore } from '@/store/useAppStore'
import type { NotificationKind } from '@/types'
import { cn } from '@/utils/cn'
import { formatRelative } from '@/utils/dates'
import { useState } from 'react'

const ICON: Record<NotificationKind, typeof Bell> = {
  scanCompleted: ScanSearch,
  criticalIssue: CircleAlert,
  deadline: Clock,
  reviewerActivity: UserCheck,
  weeklyReport: FileBarChart,
  system: Bell,
}

export function NotificationsMenu() {
  const notifications = useAppStore((s) => s.notifications)
  const markRead = useAppStore((s) => s.markNotificationRead)
  const markAll = useAppStore((s) => s.markAllNotificationsRead)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const unread = notifications.filter((n) => !n.read).length
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className="relative">
          <Bell />
          {unread > 0 && <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-dot px-1 text-[10px] font-semibold text-white ring-2 ring-card tabular">{unread}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(380px,calc(100vw-24px))] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="text-[13.5px] font-semibold text-fg">Notifications</div>
          <Button size="sm" variant="ghost" onClick={markAll} disabled={unread === 0}>
            <CheckCheck /> Mark all read
          </Button>
        </div>
        <ul className="max-h-[420px] overflow-y-auto scrollbar-thin">
          {notifications.length === 0 && <li className="px-4 py-10 text-center text-[13px] text-fg-3">You're all caught up.</li>}
          {notifications.map((n) => {
            const Icon = ICON[n.kind]
            return (
              <li key={n.id}>
                <button
                  onClick={() => {
                    markRead(n.id)
                    setOpen(false)
                    if (n.link) navigate(n.link)
                  }}
                  className={cn('flex w-full gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-hover', !n.read && 'bg-primary-soft/40')}
                >
                  <span className={cn('mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full', n.kind === 'criticalIssue' ? 'bg-error-soft text-error' : n.kind === 'deadline' ? 'bg-warning-soft text-warning' : 'bg-primary-soft text-primary')}>
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-medium text-fg">{n.title}</span>
                      <span className="shrink-0 text-[11px] text-fg-3">{formatRelative(n.at)}</span>
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-fg-2">{n.body}</span>
                  </span>
                  {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                </button>
              </li>
            )
          })}
        </ul>
        <div className="border-t border-border px-4 py-2 text-center">
          <button
            className="text-[12.5px] font-medium text-primary hover:underline"
            onClick={() => {
              setOpen(false)
              navigate('/settings?tab=notifications')
            }}
          >
            Notification settings
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
