import { Check, ChevronsUpDown, LifeBuoy, Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { toast } from 'sonner'
import { DropdownContent, DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator, DropdownTrigger } from '@/components/ui/dropdown'
import { CURRENT_USER } from '@/data/seed/team'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/utils/cn'
import { ROLE_LABELS } from '@/utils/permissions'
import { Avatar } from '../common/Avatar'
import { Logo } from './Logo'
import { NAV_SECTIONS } from './nav'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const workspace = useAppStore((s) => s.settings.workspaceName)
  const initials = useAppStore((s) => s.settings.logoInitials)
  const openIssues = useAppStore((s) => s.issues.filter((i) => i.status === 'open' || i.status === 'in_review').length)
  const viewAs = useAppStore((s) => s.viewAs)
  const setDemoGuideOpen = useAppStore((s) => s.setDemoGuideOpen)

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-14 items-center px-4">
        <Logo />
      </div>

      <div className="px-3 pb-2">
        <DropdownMenu>
          <DropdownTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-card px-2 py-1.5 text-left transition-colors hover:bg-hover" aria-label="Switch workspace">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#17B890] text-[11px] font-bold text-white">{initials}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-fg">{workspace}</span>
                <span className="block text-[11px] text-fg-3">Growth plan · 10 seats</span>
              </span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-fg-3" />
            </button>
          </DropdownTrigger>
          <DropdownContent align="start" className="w-[220px]">
            <DropdownLabel>Workspaces</DropdownLabel>
            <DropdownItem icon={<span className="flex size-4 items-center justify-center rounded bg-[#17B890] text-[8px] font-bold text-white">{initials}</span>}>
              <span className="flex items-center justify-between">
                {workspace}
                <Check className="size-3.5 text-primary" />
              </span>
            </DropdownItem>
            <DropdownItem
              icon={<span className="flex size-4 items-center justify-center rounded bg-[#8B5CF6] text-[8px] font-bold text-white">NS</span>}
              onSelect={() => toast('Northstar Sandbox is a demo placeholder', { description: 'Multi-workspace switching is simulated in this demo.' })}
            >
              Northstar Sandbox
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem icon={<Plus />} onSelect={() => toast('Create workspace', { description: 'Workspace creation is not available in the demo.' })}>
              Create workspace
            </DropdownItem>
          </DropdownContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin" aria-label="Main navigation">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <div className="px-2 pb-1 text-[11px] font-medium tracking-wide text-fg-3 uppercase">{section.label}</div>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'group flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] font-medium transition-colors',
                        isActive ? 'bg-primary-soft text-primary' : 'text-fg-2 hover:bg-hover hover:text-fg',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn('size-4 shrink-0', isActive ? 'text-primary' : 'text-fg-3 group-hover:text-fg-2')} aria-hidden />
                        <span className="flex-1 truncate">{item.label}</span>
                        {'badge' in item && item.badge === 'issues' && openIssues > 0 && (
                          <span className={cn('rounded-full px-1.5 text-[11px] leading-[18px] tabular', isActive ? 'bg-primary/15 text-primary' : 'bg-subtle text-fg-2')}>{openIssues}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        <button onClick={() => setDemoGuideOpen(true)} className="flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-[13px] font-medium text-fg-2 hover:bg-hover hover:text-fg">
          <LifeBuoy className="size-4 text-fg-3" aria-hidden />
          Help & demo guide
        </button>
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <Avatar name={CURRENT_USER.name} color={CURRENT_USER.color} size={28} />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-fg">{CURRENT_USER.name}</div>
            <div className="truncate text-[11px] text-fg-3">{viewAs === 'admin' ? CURRENT_USER.title : `Viewing as ${ROLE_LABELS[viewAs]}`}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
