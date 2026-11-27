import { BookOpen, ChevronRight, CircleHelp, Eye, Keyboard, LogOut, Mail, Menu, Monitor, Moon, Search, Settings, Sun, UserCircle } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/controls'
import { DropdownCheckItem, DropdownContent, DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator, DropdownTrigger } from '@/components/ui/dropdown'
import { CURRENT_USER } from '@/data/seed/team'
import { useAppStore, type ThemeMode } from '@/store/useAppStore'
import type { AccessRole } from '@/types'
import { ROLE_LABELS } from '@/utils/permissions'
import { Avatar } from '../common/Avatar'
import { CommandPalette } from './CommandPalette'
import { NotificationsMenu } from './NotificationsMenu'
import { ROUTE_LABELS } from './nav'

function useBreadcrumbs() {
  const { pathname } = useLocation()
  const projects = useAppStore((s) => s.projects)
  const clients = useAppStore((s) => s.clients)
  const parts = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; to?: string }[] = [{ label: 'Northstar Localization', to: '/dashboard' }]
  if (parts[0]) crumbs.push({ label: ROUTE_LABELS[parts[0]] ?? parts[0], to: parts[1] ? `/${parts[0]}` : undefined })
  if (parts[0] === 'projects' && parts[1]) crumbs.push({ label: projects.find((p) => p.id === parts[1])?.name ?? 'Project' })
  if (parts[0] === 'clients' && parts[1]) crumbs.push({ label: clients.find((c) => c.id === parts[1])?.name ?? 'Client' })
  return crumbs
}

const THEMES: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const crumbs = useBreadcrumbs()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const viewAs = useAppStore((s) => s.viewAs)
  const setViewAs = useAppStore((s) => s.setViewAs)
  const signOut = useAppStore((s) => s.signOut)
  const setDemoGuideOpen = useAppStore((s) => s.setDemoGuideOpen)
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const ThemeIcon = THEMES.find((t) => t.value === theme)?.icon ?? Sun

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/85 px-4 backdrop-blur-md md:px-6 no-print">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open navigation">
        <Menu />
      </Button>
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1 text-[13px]">
          {crumbs.map((c, i) => (
            <Fragment key={i}>
              {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-fg-3" aria-hidden />}
              <li className={i === 0 ? 'hidden truncate sm:block' : i < crumbs.length - 1 ? 'hidden truncate md:block' : 'min-w-0 truncate'}>
                {c.to && i < crumbs.length - 1 ? (
                  <Link to={c.to} className="text-fg-2 hover:text-fg">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="font-medium text-fg">
                    {c.label}
                  </span>
                )}
              </li>
            </Fragment>
          ))}
        </ol>
      </nav>

      <button
        onClick={() => setPaletteOpen(true)}
        className="hidden h-8 w-56 items-center gap-2 rounded-lg border border-border bg-subtle/60 px-2.5 text-[13px] text-fg-3 transition-colors hover:border-border-strong md:flex"
        aria-label="Search (Ctrl+K)"
      >
        <Search className="size-3.5" aria-hidden />
        <span className="flex-1 text-left">Search…</span>
        <Kbd>⌘K</Kbd>
      </button>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setPaletteOpen(true)} aria-label="Search">
        <Search />
      </Button>

      <DropdownMenu>
        <DropdownTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Theme: ${theme}`}>
            <ThemeIcon />
          </Button>
        </DropdownTrigger>
        <DropdownContent className="w-40">
          <DropdownLabel>Appearance</DropdownLabel>
          {THEMES.map((t) => (
            <DropdownCheckItem key={t.value} checked={theme === t.value} onSelect={() => setTheme(t.value)}>
              <span className="flex items-center gap-2">
                <t.icon className="size-3.5 text-fg-3" /> {t.label}
              </span>
            </DropdownCheckItem>
          ))}
        </DropdownContent>
      </DropdownMenu>

      <NotificationsMenu />

      <DropdownMenu>
        <DropdownTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Help and support" className="hidden sm:inline-flex">
            <CircleHelp />
          </Button>
        </DropdownTrigger>
        <DropdownContent className="w-56">
          <DropdownItem icon={<BookOpen />} onSelect={() => setDemoGuideOpen(true)}>
            Demo guide
          </DropdownItem>
          <DropdownItem icon={<Keyboard />} onSelect={() => toast('Keyboard shortcuts', { description: '⌘K / Ctrl+K — search · Esc — close dialogs · Tab — move focus' })}>
            Keyboard shortcuts
          </DropdownItem>
          <DropdownItem icon={<Mail />} onSelect={() => toast.success('Support request drafted', { description: 'In the demo, support requests are not sent.' })}>
            Contact support
          </DropdownItem>
        </DropdownContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownTrigger asChild>
          <button className="ml-1 rounded-full focus-visible:outline-2" aria-label="Account menu">
            <Avatar name={CURRENT_USER.name} color={CURRENT_USER.color} size={30} />
          </button>
        </DropdownTrigger>
        <DropdownContent className="w-64">
          <div className="px-2 py-2">
            <div className="text-[13px] font-medium text-fg">{CURRENT_USER.name}</div>
            <div className="text-[12px] text-fg-3">{CURRENT_USER.title}</div>
          </div>
          <DropdownSeparator />
          <DropdownLabel>
            <span className="flex items-center gap-1.5">
              <Eye className="size-3" /> View as role
            </span>
          </DropdownLabel>
          {(['admin', 'pm', 'reviewer', 'translator', 'viewer'] as AccessRole[]).map((r) => (
            <DropdownCheckItem
              key={r}
              checked={viewAs === r}
              onSelect={() => {
                setViewAs(r)
                toast(`Viewing as ${ROLE_LABELS[r]}`, { description: r === 'admin' ? 'Full access restored.' : 'Actions outside this role are disabled.' })
              }}
            >
              {ROLE_LABELS[r]}
            </DropdownCheckItem>
          ))}
          <DropdownSeparator />
          <DropdownItem icon={<UserCircle />} onSelect={() => navigate('/settings?tab=users')}>
            Profile & roles
          </DropdownItem>
          <DropdownItem icon={<Settings />} onSelect={() => navigate('/settings')}>
            Settings
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem
            icon={<LogOut />}
            onSelect={() => {
              signOut()
              navigate('/login')
            }}
          >
            Sign out
          </DropdownItem>
        </DropdownContent>
      </DropdownMenu>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      {viewAs !== 'admin' && <span className="sr-only">Viewing as {ROLE_LABELS[viewAs]}</span>}
    </header>
  )
}
