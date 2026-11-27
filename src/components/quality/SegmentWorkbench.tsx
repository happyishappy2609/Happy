import { BookText, Check, CornerDownLeft, Database, FileSearch, Pencil, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { SeverityBadge, SeverityDot } from '@/components/common/badges'
import { EmptyState, SearchBar, SectionTitle } from '@/components/common/misc'
import { Pagination } from '@/components/common/Table'
import { highlight } from '@/components/issues/highlight'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Segmented } from '@/components/ui/tabs'
import { useCan } from '@/hooks/useData'
import { sourceContainsTerm, termAppliesTo } from '@/services/qa/rules'
import { lookupTM, matchLabel } from '@/services/tmService'
import { useAppStore } from '@/store/useAppStore'
import type { Issue, LangCode, Segment } from '@/types'
import { cn } from '@/utils/cn'
import { LANGUAGES, pairLabel } from '@/utils/languages'
import { CATEGORY_LABELS, isOpen, SEVERITY_ORDER } from '@/utils/quality'

type Filter = 'all' | 'issues' | 'edited'
const PAGE = 20

export function SegmentWorkbench({ projectId, initialLang, focusSegmentId, onOpenIssue }: { projectId: string; initialLang?: LangCode; focusSegmentId?: string | null; onOpenIssue?: (id: string) => void }) {
  const project = useAppStore((s) => s.projects.find((p) => p.id === projectId))
  const allSegments = useAppStore((s) => s.segments)
  const issues = useAppStore((s) => s.issues)
  const tm = useAppStore((s) => s.tm)
  const glossary = useAppStore((s) => s.glossary)
  const editSegment = useAppStore((s) => s.editSegment)
  const can = useCan()
  const focusLang = focusSegmentId ? (allSegments.find((s) => s.id === focusSegmentId)?.lang ?? undefined) : undefined
  const [lang, setLang] = useState<LangCode>(focusLang ?? initialLang ?? project?.targetLangs[0] ?? 'fr')
  const [filter, setFilter] = useState<Filter>(focusSegmentId ? 'all' : 'all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<string | null>(focusSegmentId ?? null)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const segments = useMemo(() => allSegments.filter((s) => s.projectId === projectId && s.lang === lang).sort((a, b) => a.index - b.index), [allSegments, projectId, lang])
  const issuesBySeg = useMemo(() => {
    const m = new Map<string, Issue[]>()
    for (const i of issues) if (i.projectId === projectId && i.lang === lang && isOpen(i)) m.set(i.segmentId, [...(m.get(i.segmentId) ?? []), i])
    return m
  }, [issues, projectId, lang])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return segments.filter((s) => {
      if (filter === 'issues' && !issuesBySeg.has(s.id)) return false
      if (filter === 'edited' && !s.editedAt) return false
      if (term && !`${s.source} ${s.target}`.toLowerCase().includes(term)) return false
      return true
    })
  }, [segments, filter, q, issuesBySeg])

  useEffect(() => {
    if (focusSegmentId) {
      const idx = filtered.findIndex((s) => s.id === focusSegmentId)
      if (idx >= 0) setPage(Math.floor(idx / PAGE))
      setSelected(focusSegmentId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSegmentId])

  useEffect(() => setPage(0), [filter, q, lang])

  const sel = segments.find((s) => s.id === selected) ?? null
  const selIssues = sel ? (issuesBySeg.get(sel.id) ?? []) : []
  const tmMatches = useMemo(() => (sel ? lookupTM(sel.source, 'en', lang, tm, project?.clientId) : []), [sel, lang, tm, project?.clientId])
  const terms = useMemo(() => (sel && project ? glossary.filter((t) => termAppliesTo(t, lang, project.clientId) && sourceContainsTerm(sel.source, t.source)) : []), [sel, glossary, lang, project])

  if (!project) return null

  const startEdit = (s: Segment) => {
    if (!can('segment.edit')) return toast.error('Not allowed for your role', { description: 'Your current role cannot edit translations.' })
    setEditing(s.id)
    setSelected(s.id)
    setDraft(s.target)
  }

  const save = (s: Segment, value = draft) => {
    const v = value.trim()
    setEditing(null)
    if (v === s.target) return
    editSegment(s.id, v)
    const open = issuesBySeg.get(s.id) ?? []
    toast.success('Translation saved.', {
      description: open.length ? `${open.length} open ${open.length === 1 ? 'issue' : 'issues'} on this segment — resolve or re-run QA to verify.` : `Segment #${s.index} updated.`,
      action: open.length && can('issue.resolve') ? { label: 'Resolve', onClick: () => open.forEach((i) => useAppStore.getState().resolveIssue(i.id, 'Fixed by editing the segment', 'edited')) } : undefined,
    })
  }

  const pageRows = filtered.slice(page * PAGE, page * PAGE + PAGE)

  return (
    <div className="grid min-h-0 gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 border-border lg:border-r">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <Select size="sm" className="w-auto min-w-[120px]" aria-label="Language pair" value={lang} onValueChange={(v) => setLang(v as LangCode)} options={project.targetLangs.map((l) => ({ value: l, label: pairLabel(project.sourceLang, l), hint: LANGUAGES[l].name }))} />
          <Segmented<Filter>
            size="sm"
            value={filter}
            onChange={setFilter}
            aria-label="Segment filter"
            options={[
              { value: 'all', label: 'All', count: segments.length },
              { value: 'issues', label: 'With issues', count: issuesBySeg.size },
              { value: 'edited', label: 'Edited', count: segments.filter((s) => s.editedAt).length },
            ]}
          />
          <SearchBar value={q} onChange={setQ} placeholder="Search segments…" className="ml-auto w-full sm:w-56" />
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={<FileSearch />} title={segments.length ? 'No segments match' : 'No segments yet'} description={segments.length ? 'Try another filter or search term.' : 'Upload translations to start reviewing segments.'} />
        ) : (
          <div ref={listRef} role="list" aria-label="Segments">
            <div className="hidden grid-cols-[48px_1fr_1fr_72px] gap-3 border-b border-border bg-subtle/60 px-3 py-2 text-[11.5px] font-medium text-fg-2 md:grid">
              <span>#</span>
              <span>Source · EN</span>
              <span>Target · {lang.toUpperCase()}</span>
              <span className="text-right">QA</span>
            </div>
            {pageRows.map((s) => {
              const segIssues = (issuesBySeg.get(s.id) ?? []).sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))
              const top = segIssues[0]
              const isSel = s.id === selected
              return (
                <div
                  key={s.id}
                  role="listitem"
                  onClick={() => setSelected(s.id)}
                  className={cn('grid cursor-pointer grid-cols-[40px_1fr] gap-x-3 gap-y-1.5 border-b border-border px-3 py-2.5 text-[13.5px] leading-relaxed transition-colors md:grid-cols-[48px_1fr_1fr_72px]', isSel ? 'bg-primary-soft/50' : 'hover:bg-hover', top && !isSel && 'bg-error-soft/20')}
                >
                  <span className={cn('pt-0.5 text-[12px] text-fg-3 tabular', top && 'font-medium text-error')}>{s.index}</span>
                  <div className="min-w-0 text-fg">{top ? highlight(s.source, top.sourceSpan, 'hl-source') : s.source}</div>
                  <div className="col-start-2 min-w-0 md:col-start-auto">
                    {editing === s.id ? (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Textarea
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              save(s)
                            }
                            if (e.key === 'Escape') setEditing(null)
                          }}
                          className="min-h-[60px] text-[13.5px]"
                          aria-label={`Edit translation for segment ${s.index}`}
                        />
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <Button size="sm" variant="primary" onClick={() => save(s)}>
                            <Check /> Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                            <X /> Cancel
                          </Button>
                          <span className="ml-auto hidden items-center gap-1 text-[11px] text-fg-3 sm:flex">
                            <CornerDownLeft className="size-3" /> save · Esc cancel
                          </span>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onDoubleClick={() => startEdit(s)} onKeyDown={(e) => e.key === 'Enter' && startEdit(s)} className="group w-full rounded text-left text-fg" aria-label={`Segment ${s.index} translation. Press Enter to edit.`}>
                        {s.target ? top ? highlight(s.target, top.targetSpan) : s.target : <i className="text-fg-3">Untranslated</i>}
                        {s.editedAt && <span className="ml-1.5 rounded bg-info-soft px-1 text-[10.5px] font-medium text-info">edited</span>}
                        <Pencil className="ml-1.5 inline size-3 text-fg-3 opacity-0 group-hover:opacity-100" aria-hidden />
                      </button>
                    )}
                  </div>
                  <div className="col-start-2 flex items-start gap-1 md:col-start-auto md:justify-end">
                    {segIssues.length ? (
                      <span className="flex items-center gap-1 rounded-md bg-card px-1.5 py-0.5 text-[11.5px] font-medium text-fg-2 ring-1 ring-border" title={segIssues.map((i) => `${i.severity}: ${CATEGORY_LABELS[i.category]}`).join('\n')}>
                        {segIssues.slice(0, 3).map((i) => (
                          <SeverityDot key={i.id} severity={i.severity} />
                        ))}
                        {segIssues.length}
                      </span>
                    ) : (
                      <Check className="size-3.5 text-success" aria-label="No open issues" />
                    )}
                  </div>
                </div>
              )
            })}
            <Pagination page={page} pageCount={Math.ceil(filtered.length / PAGE)} total={filtered.length} pageSize={PAGE} onPage={setPage} label="segments" />
          </div>
        )}
      </div>

      <aside className="min-w-0 border-t border-border p-4 lg:border-t-0" aria-label="Segment details">
        {!sel ? (
          <EmptyState className="py-10" icon={<FileSearch />} title="Select a segment" description="View QA findings, translation memory matches and glossary terms. Double-click a target to edit inline." />
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-semibold text-fg">Segment #{sel.index}</div>
              <Button size="sm" onClick={() => startEdit(sel)} disabled={!can('segment.edit')}>
                <Pencil /> Edit
              </Button>
            </div>
            <div>
              <SectionTitle>QA findings</SectionTitle>
              {selIssues.length === 0 ? (
                <p className="text-[12.5px] text-fg-3">No open findings on this segment.</p>
              ) : (
                <ul className="space-y-2">
                  {selIssues.map((i) => (
                    <li key={i.id} className="rounded-lg border border-border p-2.5">
                      <div className="flex items-center gap-1.5">
                        <SeverityBadge severity={i.severity} />
                        <span className="text-[12px] text-fg-2">{CATEGORY_LABELS[i.category]}</span>
                        <span className="ml-auto text-[11.5px] text-fg-3 tabular">{i.confidence}%</span>
                      </div>
                      <p className="mt-1.5 text-[12.5px] leading-snug text-fg-2">{i.explanation}</p>
                      {i.suggestion && (
                        <p className="mt-1.5 rounded-md bg-success-soft/60 px-2 py-1 text-[12.5px] text-fg">
                          <span className="text-[11px] font-medium text-success">Suggested: </span>
                          {i.suggestion}
                        </p>
                      )}
                      {onOpenIssue && (
                        <button className="mt-1.5 text-[12px] font-medium text-primary hover:underline" onClick={() => onOpenIssue(i.id)}>
                          Open {i.id}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <SectionTitle>
                <span className="flex items-center gap-1.5">
                  <Database className="size-3.5" /> Translation memory
                </span>
              </SectionTitle>
              {tmMatches.length === 0 ? (
                <p className="text-[12.5px] text-fg-3">No match.</p>
              ) : (
                <ul className="space-y-2">
                  {tmMatches.map((m) => (
                    <li key={m.unit.id} className="rounded-lg border border-border p-2.5 text-[12.5px]">
                      <div className="mb-1 flex items-center justify-between">
                        <Badge tone={m.score === 100 ? 'success' : m.score >= 85 ? 'primary' : 'neutral'}>{matchLabel(m.score)}</Badge>
                        <Button size="sm" variant="ghost" disabled={!can('segment.edit') || m.unit.target === sel.target} onClick={() => save(sel, m.unit.target)}>
                          Use
                        </Button>
                      </div>
                      <div className="text-fg-3">{m.unit.source}</div>
                      <div className="text-fg">{m.unit.target}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <SectionTitle>
                <span className="flex items-center gap-1.5">
                  <BookText className="size-3.5" /> Glossary
                </span>
              </SectionTitle>
              {terms.length === 0 ? (
                <p className="text-[12.5px] text-fg-3">No approved terms in this segment.</p>
              ) : (
                <ul className="space-y-1.5">
                  {terms.map((t) => {
                    const ok = sel.target.toLowerCase().includes(t.target.toLowerCase())
                    return (
                      <li key={t.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-2.5 py-1.5 text-[12.5px]">
                        <span className="text-fg-2">{t.source}</span>
                        <span className={cn('flex items-center gap-1 font-medium', ok ? 'text-success' : 'text-error')}>
                          {ok ? <Check className="size-3" /> : <X className="size-3" />}
                          {t.target}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
