import { AlertTriangle, BookText, CheckCircle2, Database, FolderPlus, MessageSquare, Plug, ScanSearch, Settings2, UserPlus, FileCheck2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLookups } from '@/hooks/useData'
import { CURRENT_USER } from '@/data/seed/team'
import type { Activity, ActivityType } from '@/types'
import { formatRelative, formatDateTime } from '@/utils/dates'
import { Avatar } from './Avatar'
import { useAppStore } from '@/store/useAppStore'

const ICONS: Record<ActivityType, typeof ScanSearch> = {
  scan: ScanSearch,
  resolve: CheckCircle2,
  review: FileCheck2,
  alert: AlertTriangle,
  glossary: BookText,
  project: FolderPlus,
  assign: UserPlus,
  tm: Database,
  integration: Plug,
  comment: MessageSquare,
  settings: Settings2,
}

export function ActivityFeed({ items, limit = 8, compact }: { items: Activity[]; limit?: number; compact?: boolean }) {
  const { memberById } = useLookups()
  const projects = useAppStore((s) => s.projects)
  const shown = items.slice(0, limit)
  if (!shown.length) return <p className="py-6 text-center text-[13px] text-fg-3">No activity yet.</p>
  return (
    <ol className="relative">
      {shown.map((a, i) => {
        const Icon = ICONS[a.type]
        const actor = a.actorId === CURRENT_USER.id ? { name: CURRENT_USER.name, color: CURRENT_USER.color } : a.actorId === 'system' ? null : memberById.get(a.actorId)
        const project = a.projectId ? projects.find((p) => p.id === a.projectId) : undefined
        return (
          <li key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
            {i < shown.length - 1 && <span className="absolute top-8 bottom-0 left-[13px] w-px bg-border" aria-hidden />}
            {actor ? (
              <Avatar name={actor.name} color={actor.color} size={27} />
            ) : (
              <span className={`flex size-[27px] shrink-0 items-center justify-center rounded-full ring-2 ring-card ${a.type === 'alert' ? 'bg-warning-soft text-warning' : 'bg-primary-soft text-primary'}`}>
                <Icon className="size-3.5" aria-hidden />
              </span>
            )}
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[13px] leading-snug text-fg">
                {actor && <span className="font-medium">{actor.name} </span>}
                <span className={actor ? 'text-fg-2' : 'text-fg'}>{a.message}</span>
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-fg-3">
                <span className="inline-flex items-center gap-1">
                  {actor && <Icon className="size-3" aria-hidden />}
                  <time dateTime={a.at} title={formatDateTime(a.at)}>
                    {formatRelative(a.at)}
                  </time>
                </span>
                {project && !compact && (
                  <>
                    <span aria-hidden>·</span>
                    <Link to={`/projects/${project.id}`} className="truncate text-primary hover:underline">
                      {project.name}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
