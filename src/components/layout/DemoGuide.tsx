import { Check, ChevronRight, Presentation, RotateCcw, X } from 'lucide-react'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAppStore, type DemoStep } from '@/store/useAppStore'
import { cn } from '@/utils/cn'

const STEPS: { id: DemoStep; title: string; action: string; to?: string; script: string }[] = [
  { id: 'dashboard', title: 'Dashboard overview', action: 'Show operational health, quality and risk at a glance.', to: '/dashboard', script: '“LingoPilot gives us visibility into localization quality across every project, rather than waiting for the final reviewer to discover problems.”' },
  { id: 'openNova', title: 'Open Nova E-commerce', action: 'Progress, quality score, deadline, risk and issues.', to: '/projects/p-nova-ecom', script: 'High-volume French storefront, due in 4 days and below the 95% client threshold.' },
  { id: 'runScan', title: 'Run AI QA', action: 'Click “Run AI QA” and walk through the scan stages.', to: '/projects/p-nova-ecom?scan=1', script: 'The platform checks terminology, accuracy, omissions, fluency, formatting and locale rules.' },
  { id: 'reviewFinding', title: 'Review critical findings', action: 'Open the subscription-renewal mistranslation.', to: '/quality?severity=critical&project=p-nova-ecom', script: 'Source, target, AI explanation, suggested correction and confidence — side by side.' },
  { id: 'acceptFix', title: 'Resolve an issue', action: 'Accept the suggested correction.', to: '/quality?severity=critical&project=p-nova-ecom', script: 'The issue resolves, the score updates and the issue count drops immediately.' },
  { id: 'analytics', title: 'Review analytics', action: 'Quality trend, issues by category, time saved, team performance.', to: '/analytics', script: 'Quality becomes measurable — per client, language and reviewer.' },
  { id: 'terminology', title: 'Show terminology', action: 'Client-approved terms enforced during QA.', to: '/terminology?client=c-nova', script: 'Approved terms and forbidden variants are checked on every scan.' },
  { id: 'close', title: 'Close', action: 'Summarize the value.', script: '“LingoPilot is not just another translation editor. It is a quality intelligence layer that helps localization agencies reduce rework, control delivery risk, and scale quality operations.”' },
]

export function useDemoTracking() {
  const { pathname } = useLocation()
  const mark = useAppStore((s) => s.markDemoStep)
  useEffect(() => {
    if (pathname === '/dashboard') mark('dashboard')
    if (pathname === '/projects/p-nova-ecom') mark('openNova')
    if (pathname === '/analytics') mark('analytics')
    if (pathname === '/terminology') mark('terminology')
  }, [pathname, mark])
}

export function DemoGuide() {
  const open = useAppStore((s) => s.demoGuideOpen)
  const setOpen = useAppStore((s) => s.setDemoGuideOpen)
  const done = useAppStore((s) => s.demoSteps)
  const mark = useAppStore((s) => s.markDemoStep)
  const navigate = useNavigate()
  const completed = STEPS.filter((s) => done.includes(s.id)).length
  const next = STEPS.find((s) => !done.includes(s.id))

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pr-3.5 pl-2 text-[12.5px] font-medium text-fg shadow-pop transition-colors hover:bg-hover no-print"
        aria-label="Open demo guide"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-navy text-card dark:bg-primary dark:text-white">
          <Presentation className="size-3.5" />
        </span>
        Demo guide
        <span className="text-fg-3 tabular">
          {completed}/{STEPS.length}
        </span>
      </button>
    )
  }

  return (
    <aside className="fixed right-4 bottom-4 z-40 flex max-h-[min(640px,calc(100dvh-88px))] w-[min(360px,calc(100vw-32px))] flex-col rounded-[14px] border border-border bg-card shadow-modal no-print" aria-label="Demo guide">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <div className="text-[13.5px] font-semibold text-fg">Demo guide · 5–7 min</div>
          <div className="text-[12px] text-fg-2">French e-commerce project below client threshold, tight deadline.</div>
        </div>
        <button onClick={() => setOpen(false)} className="rounded-md p-1 text-fg-3 hover:bg-hover hover:text-fg" aria-label="Close demo guide">
          <X className="size-4" />
        </button>
      </div>
      <div className="h-1 bg-subtle">
        <div className="h-full bg-accent transition-[width]" style={{ width: `${(completed / STEPS.length) * 100}%` }} />
      </div>
      <ol className="min-h-0 flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
        {STEPS.map((s, i) => {
          const isDone = done.includes(s.id)
          const isNext = next?.id === s.id
          return (
            <li key={s.id} className={cn('rounded-lg px-2 py-2', isNext && 'bg-primary-soft/60')}>
              <div className="flex gap-2.5">
                <span className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold', isDone ? 'bg-accent text-white' : isNext ? 'bg-primary text-white' : 'bg-subtle text-fg-2')}>
                  {isDone ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('text-[13px] font-medium', isDone ? 'text-fg-2' : 'text-fg')}>{s.title}</span>
                    {s.to ? (
                      <button onClick={() => navigate(s.to!)} className="flex shrink-0 items-center text-[12px] font-medium text-primary hover:underline">
                        Go <ChevronRight className="size-3" />
                      </button>
                    ) : (
                      !isDone && (
                        <button onClick={() => mark(s.id)} className="shrink-0 text-[12px] font-medium text-primary hover:underline">
                          Done
                        </button>
                      )
                    )}
                  </div>
                  <p className="mt-0.5 text-[12px] text-fg-2">{s.action}</p>
                  {(isNext || s.id === 'close') && <p className="mt-1.5 rounded-md border-l-2 border-accent bg-subtle/70 px-2 py-1.5 text-[12px] leading-snug text-fg-2 italic">{s.script}</p>}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
        <span className="text-[11.5px] text-fg-3">Steps tick off automatically as you go.</span>
        <Button size="sm" variant="ghost" onClick={() => useAppStore.setState({ demoSteps: [] })}>
          <RotateCcw /> Restart
        </Button>
      </div>
    </aside>
  )
}
