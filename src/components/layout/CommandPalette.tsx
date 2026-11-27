import * as D from '@radix-ui/react-dialog'
import { BookText, Building2, CornerDownLeft, FolderKanban, Search, TriangleAlert, User } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/utils/cn'
import { NAV_SECTIONS } from './nav'

interface Result {
  id: string
  group: string
  label: string
  hint?: string
  to: string
  icon: typeof Search
}

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const projects = useAppStore((s) => s.projects)
  const issues = useAppStore((s) => s.issues)
  const glossary = useAppStore((s) => s.glossary)
  const team = useAppStore((s) => s.team)
  const clients = useAppStore((s) => s.clients)

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase()
    const pages: Result[] = NAV_SECTIONS.flatMap((s) => s.items).map((i) => ({ id: `nav-${i.to}`, group: 'Pages', label: i.label, to: i.to, icon: i.icon }))
    if (!term) return [...pages.slice(0, 6), ...projects.slice(0, 4).map((p) => ({ id: p.id, group: 'Recent projects', label: p.name, hint: p.code, to: `/projects/${p.id}`, icon: FolderKanban }))]
    const m = (s: string) => s.toLowerCase().includes(term)
    return [
      ...pages.filter((p) => m(p.label)),
      ...projects.filter((p) => m(p.name) || m(p.code)).slice(0, 6).map((p) => ({ id: p.id, group: 'Projects', label: p.name, hint: p.code, to: `/projects/${p.id}`, icon: FolderKanban })),
      ...issues.filter((i) => m(i.id) || m(i.source) || m(i.target)).slice(0, 6).map((i) => ({ id: i.id, group: 'Issues', label: i.source, hint: i.id, to: `/issues?issue=${i.id}`, icon: TriangleAlert })),
      ...glossary.filter((t) => m(t.source) || m(t.target)).slice(0, 5).map((t) => ({ id: t.id, group: 'Terminology', label: `${t.source} → ${t.target}`, hint: t.targetLang.toUpperCase(), to: `/terminology?q=${encodeURIComponent(t.source)}`, icon: BookText })),
      ...team.filter((t) => m(t.name)).slice(0, 4).map((t) => ({ id: t.id, group: 'People', label: t.name, hint: t.role, to: `/team?member=${t.id}`, icon: User })),
      ...clients.filter((c) => m(c.name)).slice(0, 4).map((c) => ({ id: c.id, group: 'Clients', label: c.name, hint: c.industry, to: `/clients/${c.id}`, icon: Building2 })),
    ]
  }, [q, projects, issues, glossary, team, clients])

  useEffect(() => setActive(0), [q])

  const go = (r: Result) => {
    navigate(r.to)
    onOpenChange(false)
    setQ('')
  }

  let lastGroup = ''
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)] animate-fade-in" />
        <D.Content className="fixed top-[12vh] left-1/2 z-50 w-[calc(100vw-32px)] max-w-[600px] -translate-x-1/2 overflow-hidden rounded-[14px] border border-border bg-card shadow-modal animate-fade-in focus:outline-none">
          <D.Title className="sr-only">Search</D.Title>
          <D.Description className="sr-only">Search projects, issues, terminology, people and pages</D.Description>
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="size-4 text-fg-3" aria-hidden />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setActive((a) => Math.min(results.length - 1, a + 1))
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setActive((a) => Math.max(0, a - 1))
                } else if (e.key === 'Enter' && results[active]) {
                  go(results[active])
                }
              }}
              placeholder="Search projects, issues, terms, people…"
              aria-label="Search"
              className="h-12 flex-1 bg-transparent text-[14px] text-fg placeholder:text-fg-3 focus:outline-none"
            />
          </div>
          <div className="max-h-[50vh] overflow-y-auto p-2 scrollbar-thin" role="listbox">
            {results.length === 0 && <p className="px-3 py-8 text-center text-[13px] text-fg-3">No results for “{q}”.</p>}
            {results.map((r, i) => {
              const header = r.group !== lastGroup ? r.group : null
              lastGroup = r.group
              return (
                <div key={`${r.group}-${r.id}`}>
                  {header && <div className="px-2 pt-2 pb-1 text-[11px] font-medium tracking-wide text-fg-3 uppercase">{header}</div>}
                  <button
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r)}
                    className={cn('flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-[13px]', i === active ? 'bg-hover text-fg' : 'text-fg-2')}
                  >
                    <r.icon className="size-4 shrink-0 text-fg-3" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-fg">{r.label}</span>
                    {r.hint && <span className="shrink-0 text-[11.5px] text-fg-3">{r.hint}</span>}
                    {i === active && <CornerDownLeft className="size-3.5 shrink-0 text-fg-3" aria-hidden />}
                  </button>
                </div>
              )
            })}
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}
