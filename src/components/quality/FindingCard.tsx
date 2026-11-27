import { Check, CheckCircle2 } from 'lucide-react'
import { ConfidenceMeter, IssueStatusBadge, SeverityBadge } from '@/components/common/badges'
import { LangChip } from '@/components/common/misc'
import { highlight } from '@/components/issues/highlight'
import { useIssueActions } from '@/components/issues/useIssueActions'
import { Button } from '@/components/ui/button'
import { useCan } from '@/hooks/useData'
import type { Issue } from '@/types'
import { cn } from '@/utils/cn'
import { CATEGORY_LABELS, isOpen } from '@/utils/quality'

export function FindingCard({ issue, projectName, selected, onSelect }: { issue: Issue; projectName?: string; selected?: boolean; onSelect: () => void }) {
  const actions = useIssueActions()
  const can = useCan()
  const open = isOpen(issue)
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target === e.currentTarget) onSelect()
      }}
      className={cn(
        'group relative block w-full cursor-pointer border-b border-border px-4 py-3 text-left transition-colors focus-visible:outline-offset-[-2px]',
        selected ? 'bg-primary-soft/60' : 'hover:bg-hover',
        !open && 'opacity-70',
      )}
    >
      {selected && <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" aria-hidden />}
      <div className="flex flex-wrap items-center gap-1.5">
        <SeverityBadge severity={issue.severity} />
        <span className="text-[12px] font-medium text-fg-2">{CATEGORY_LABELS[issue.category]}</span>
        {!open && <IssueStatusBadge status={issue.status} />}
        <span className="ml-auto">
          <ConfidenceMeter value={issue.confidence} />
        </span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-fg">{highlight(issue.source, issue.sourceSpan, 'hl-source')}</p>
      <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-fg-2">{highlight(issue.target, issue.targetSpan)}</p>
      <div className="mt-2 flex items-center gap-2 text-[11.5px] text-fg-3">
        <span className="font-medium text-fg-2">{issue.id}</span>
        <span>#{issue.segmentId.split('-').pop()}</span>
        <LangChip lang={issue.lang} />
        {projectName && <span className="truncate">{projectName}</span>}
        {open && (
          <span className="ml-auto flex shrink-0 gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            {issue.suggestion && (
              <Button
                size="sm"
                variant="secondary"
                disabled={!can('issue.resolve')}
                onClick={(e) => {
                  e.stopPropagation()
                  actions.accept(issue)
                }}
              >
                <CheckCircle2 /> Accept
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              disabled={!can('issue.resolve')}
              onClick={(e) => {
                e.stopPropagation()
                actions.resolve(issue)
              }}
              aria-label={`Mark ${issue.id} resolved`}
            >
              <Check />
            </Button>
          </span>
        )}
      </div>
    </div>
  )
}
