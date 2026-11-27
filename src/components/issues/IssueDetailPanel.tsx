import { ArrowRight, BookText, Check, CheckCircle2, Database, EyeOff, Pencil, RotateCcw, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/common/Avatar'
import { ConfidenceMeter, IssueStatusBadge, SeverityBadge } from '@/components/common/badges'
import { LangChip, SectionTitle } from '@/components/common/misc'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { useCan, useLookups, usePersonName } from '@/hooks/useData'
import { lookupTM } from '@/services/tmService'
import { sourceContainsTerm, termAppliesTo } from '@/services/qa/rules'
import { useAppStore } from '@/store/useAppStore'
import type { Issue } from '@/types'
import { cn } from '@/utils/cn'
import { formatDateTime, formatRelative } from '@/utils/dates'
import { langName } from '@/utils/languages'
import { CATEGORY_LABELS } from '@/utils/quality'
import { AssignMenu } from './AssignMenu'
import { diffHighlight, highlight } from './highlight'
import { IgnoreDialog } from './IgnoreDialog'
import { useIssueActions } from './useIssueActions'

function TextBlock({ label, children, tone, lang }: { label: string; children: React.ReactNode; tone?: 'fix'; lang?: string }) {
  return (
    <div className={cn('rounded-[10px] border px-3 py-2.5', tone === 'fix' ? 'border-success-dot/30 bg-success-soft/50' : 'border-border bg-subtle/50')}>
      <div className="mb-1 flex items-center justify-between text-[11px] font-medium tracking-wide text-fg-3 uppercase">
        <span>{label}</span>
        {lang && <span className="normal-case tracking-normal">{lang}</span>}
      </div>
      <div className="text-[14px] leading-relaxed text-fg">{children}</div>
    </div>
  )
}

export function IssueDetailPanel({ issue, showProject = true, onAfterAction }: { issue: Issue; showProject?: boolean; onAfterAction?: () => void }) {
  const actions = useIssueActions()
  const can = useCan()
  const personName = usePersonName()
  const { memberById, clientById } = useLookups()
  const project = useAppStore((s) => s.projects.find((p) => p.id === issue.projectId))
  const segment = useAppStore((s) => s.segments.find((x) => x.id === issue.segmentId))
  const tm = useAppStore((s) => s.tm)
  const glossary = useAppStore((s) => s.glossary)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [ignoreOpen, setIgnoreOpen] = useState(false)
  const open = issue.status === 'open' || issue.status === 'in_review'
  const currentTarget = segment?.target ?? issue.target
  const assignee = issue.assigneeId ? memberById.get(issue.assigneeId) : undefined

  useEffect(() => {
    setEditing(false)
    setDraft(issue.suggestion || currentTarget)
    if (issue.projectId === 'p-nova-ecom') useAppStore.getState().markDemoStep('reviewFinding')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issue.id])

  const tmMatches = useMemo(() => lookupTM(issue.source, 'en', issue.lang, tm, project?.clientId), [issue.source, issue.lang, tm, project?.clientId])
  const terms = useMemo(() => glossary.filter((t) => project && termAppliesTo(t, issue.lang, project.clientId) && sourceContainsTerm(issue.source, t.source)), [glossary, issue, project])

  const done = () => onAfterAction?.()

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={issue.severity} />
        <Badge tone="outline">{CATEGORY_LABELS[issue.category]}</Badge>
        <IssueStatusBadge status={issue.status} />
        <ConfidenceMeter value={issue.confidence} className="ml-auto" />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px] sm:grid-cols-4">
        <div>
          <dt className="text-fg-3">Issue ID</dt>
          <dd className="font-medium text-fg">{issue.id}</dd>
        </div>
        <div>
          <dt className="text-fg-3">Segment</dt>
          <dd className="truncate font-medium text-fg" title={issue.segmentId}>
            #{issue.segmentId.split('-').pop()}
          </dd>
        </div>
        <div>
          <dt className="text-fg-3">Language</dt>
          <dd className="flex items-center gap-1 font-medium text-fg">
            EN <ArrowRight className="size-3 text-fg-3" /> <LangChip lang={issue.lang} />
          </dd>
        </div>
        <div>
          <dt className="text-fg-3">Detected</dt>
          <dd className="font-medium text-fg" title={formatDateTime(issue.createdAt)}>
            {formatRelative(issue.createdAt)} · {issue.detectedBy === 'reviewer' ? 'Reviewer' : issue.detectedBy === 'rule' ? 'Rule check' : 'AI QA'}
          </dd>
        </div>
      </dl>

      {showProject && project && (
        <div className="flex items-center justify-between gap-3 rounded-[10px] border border-border px-3 py-2 text-[12.5px]">
          <div className="min-w-0">
            <Link to={`/projects/${project.id}`} className="font-medium text-fg hover:underline">
              {project.name}
            </Link>
            <div className="truncate text-fg-3">
              {clientById.get(project.clientId)?.name} · {project.type}
            </div>
          </div>
          <Link to={`/projects/${project.id}?tab=segments&segment=${issue.segmentId}`} className="shrink-0 text-[12px] font-medium text-primary hover:underline">
            View context
          </Link>
        </div>
      )}

      <div className="space-y-2">
        <TextBlock label="Source" lang="English">
          {highlight(issue.source, issue.sourceSpan, 'hl-source')}
        </TextBlock>
        <TextBlock label={open ? 'Target' : 'Target (at detection)'} lang={langName(issue.lang)}>
          {highlight(issue.target, issue.targetSpan)}
        </TextBlock>
        {!open && currentTarget !== issue.target && (
          <TextBlock label="Current translation" tone="fix" lang={langName(issue.lang)}>
            {currentTarget}
          </TextBlock>
        )}
      </div>

      <div>
        <SectionTitle>
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" /> Explanation
          </span>
        </SectionTitle>
        <p className="text-[13px] leading-relaxed text-fg">{issue.explanation}</p>
        {issue.preferredTerm && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary-soft px-2 py-1 text-[12.5px] text-primary">
            <BookText className="size-3.5" /> Preferred term: <b>{issue.preferredTerm}</b>
          </p>
        )}
      </div>

      {issue.suggestion && (
        <div>
          <SectionTitle>Recommended correction</SectionTitle>
          <TextBlock label="Suggestion" tone="fix" lang={langName(issue.lang)}>
            {diffHighlight(issue.target, issue.suggestion)}
          </TextBlock>
          <p className="mt-1.5 text-[11.5px] text-fg-3">AI QA simulation output. Suggestions should be confirmed by a qualified linguist.</p>
        </div>
      )}

      {editing && (
        <div>
          <SectionTitle>Edit translation</SectionTitle>
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-[88px] text-[14px]" autoFocus aria-label="Edited translation" />
          <div className="mt-2 flex justify-end gap-2">
            <Button size="sm" onClick={() => setEditing(false)}>
              <X /> Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={!draft.trim() || draft === currentTarget}
              onClick={() => {
                if (actions.editAndResolve(issue, draft.trim())) {
                  setEditing(false)
                  done()
                }
              }}
            >
              <Check /> Save & resolve
            </Button>
          </div>
        </div>
      )}

      {open ? (
        <div className="flex flex-wrap gap-2">
          {issue.suggestion && (
            <Button variant="primary" disabled={!can('issue.resolve')} onClick={() => actions.accept(issue) && done()}>
              <CheckCircle2 /> Accept suggestion
            </Button>
          )}
          <Button disabled={!can('segment.edit')} onClick={() => setEditing(true)}>
            <Pencil /> Edit translation
          </Button>
          <Button disabled={!can('issue.resolve')} onClick={() => actions.resolve(issue) && done()}>
            <Check /> Mark resolved
          </Button>
          <Button variant="ghost" disabled={!can('issue.ignore')} onClick={() => setIgnoreOpen(true)}>
            <EyeOff /> Ignore
          </Button>
          <AssignMenu lang={issue.lang} currentId={issue.assigneeId} onAssign={(id) => actions.assign(issue, id)} disabled={!can('issue.assign')} />
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-border bg-subtle/50 px-3 py-2.5 text-[12.5px] text-fg-2">
          <span>
            {issue.status === 'ignored' ? (
              <>
                Ignored — <i>{issue.ignoreReason}</i>
              </>
            ) : (
              <>Resolved {issue.resolvedAt ? formatRelative(issue.resolvedAt) : ''}{issue.resolution === 'accepted' ? ' · AI suggestion accepted' : issue.resolution === 'edited' ? ' · translation edited' : ''}</>
            )}
          </span>
          <Button size="sm" variant="ghost" onClick={() => actions.reopen(issue)} disabled={!can('issue.resolve')}>
            <RotateCcw /> Reopen
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 text-[12.5px] text-fg-2">
        <span>Assigned to</span>
        {assignee ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-fg">
            <Avatar name={assignee.name} color={assignee.color} size={20} /> {assignee.name}
          </span>
        ) : (
          <span className="text-fg-3">Unassigned</span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <SectionTitle>
            <span className="flex items-center gap-1.5">
              <Database className="size-3.5" /> Translation memory
            </span>
          </SectionTitle>
          {tmMatches.length === 0 ? (
            <p className="text-[12.5px] text-fg-3">No match (below 70%).</p>
          ) : (
            <ul className="space-y-2">
              {tmMatches.map((m) => (
                <li key={m.unit.id} className="rounded-lg border border-border px-2.5 py-2 text-[12.5px]">
                  <div className="mb-1 flex items-center justify-between">
                    <Badge tone={m.score === 100 ? 'success' : m.score >= 85 ? 'primary' : 'neutral'}>{m.score === 100 ? 'Exact match' : `${m.score}% match`}</Badge>
                    <span className="text-[11px] text-fg-3">{m.unit.status === 'approved' ? 'Approved' : 'Unapproved'}</span>
                  </div>
                  <div className="text-fg-2">{m.unit.source}</div>
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
              {terms.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-lg border border-border px-2.5 py-1.5 text-[12.5px]">
                  <span className="text-fg-2">{t.source}</span>
                  <span className="font-medium text-fg">{t.target}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <SectionTitle>History</SectionTitle>
        <ol className="space-y-2.5 border-l border-border pl-4">
          {[...issue.history].reverse().map((h, i) => (
            <li key={i} className="relative text-[12.5px]">
              <span className="absolute top-1.5 -left-[19.5px] size-2 rounded-full bg-border-strong ring-2 ring-card" />
              <span className="font-medium text-fg">{h.action}</span>
              {h.note && <span className="text-fg-2"> — {h.action.includes('ssign') ? personName(h.note) : h.note}</span>}
              <div className="text-[11.5px] text-fg-3">
                {personName(h.by)} · {formatDateTime(h.at)}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <IgnoreDialog open={ignoreOpen} onOpenChange={setIgnoreOpen} onConfirm={(r) => actions.ignore(issue, r) && done()} />
    </div>
  )
}
