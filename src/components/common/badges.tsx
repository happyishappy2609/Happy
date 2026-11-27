import { AlertOctagon, AlertTriangle, CircleCheck, CircleDot, Info, OctagonAlert, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Badge, Dot } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import type { IssueStatus, ProjectStatus, RiskLevel, Severity } from '@/types'
import { cn } from '@/utils/cn'
import { QUALITY_SCORE_TOOLTIP, qualityBand } from '@/utils/quality'

const SEVERITY: Record<Severity, { label: string; tone: 'error' | 'major' | 'warning' | 'info'; dot: string; icon: typeof AlertOctagon }> = {
  critical: { label: 'Critical', tone: 'error', dot: 'bg-error-dot', icon: OctagonAlert },
  major: { label: 'Major', tone: 'major', dot: 'bg-major-dot', icon: AlertTriangle },
  minor: { label: 'Minor', tone: 'warning', dot: 'bg-warning-dot', icon: CircleDot },
  info: { label: 'Info', tone: 'info', dot: 'bg-info-dot', icon: Info },
}

export const severityMeta = SEVERITY

export function SeverityBadge({ severity, compact }: { severity: Severity; compact?: boolean }) {
  const m = SEVERITY[severity]
  const Icon = m.icon
  return (
    <Badge tone={m.tone} className={compact ? 'px-1' : undefined}>
      <Icon aria-hidden />
      {compact ? <span className="sr-only">{m.label}</span> : m.label}
    </Badge>
  )
}

export function SeverityDot({ severity }: { severity: Severity }) {
  return <Dot className={SEVERITY[severity].dot} />
}

const ISSUE_STATUS: Record<IssueStatus, { label: string; tone: 'neutral' | 'primary' | 'success' | 'outline' }> = {
  open: { label: 'Open', tone: 'outline' },
  in_review: { label: 'In review', tone: 'primary' },
  resolved: { label: 'Resolved', tone: 'success' },
  ignored: { label: 'Ignored', tone: 'neutral' },
}

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  const m = ISSUE_STATUS[status]
  return (
    <Badge tone={m.tone}>
      {status === 'resolved' ? <CircleCheck aria-hidden /> : <Dot className={status === 'open' ? 'bg-fg-3' : status === 'in_review' ? 'bg-primary' : 'bg-fg-3/60'} />}
      {m.label}
    </Badge>
  )
}

const PROJECT_STATUS: Record<ProjectStatus, { label: string; tone: 'primary' | 'info' | 'success' | 'neutral'; dot: string }> = {
  active: { label: 'Active', tone: 'primary', dot: 'bg-primary' },
  in_review: { label: 'In Review', tone: 'info', dot: 'bg-info-dot' },
  completed: { label: 'Completed', tone: 'success', dot: 'bg-success-dot' },
  on_hold: { label: 'On Hold', tone: 'neutral', dot: 'bg-fg-3' },
}

export const projectStatusLabel = (s: ProjectStatus) => PROJECT_STATUS[s].label

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const m = PROJECT_STATUS[status]
  return (
    <Badge tone={m.tone}>
      <Dot className={m.dot} />
      {m.label}
    </Badge>
  )
}

const RISK: Record<RiskLevel, { label: string; tone: 'success' | 'warning' | 'error'; icon: typeof ShieldCheck }> = {
  low: { label: 'Low', tone: 'success', icon: ShieldCheck },
  medium: { label: 'Medium', tone: 'warning', icon: ShieldAlert },
  high: { label: 'High', tone: 'error', icon: AlertOctagon },
}

export function RiskBadge({ risk, reasons, showLabel = true }: { risk: RiskLevel; reasons?: string[]; showLabel?: boolean }) {
  const m = RISK[risk]
  const Icon = m.icon
  const badge = (
    <Badge tone={m.tone}>
      <Icon aria-hidden />
      {showLabel ? m.label : <span className="sr-only">{m.label}</span>}
      <span className="sr-only"> risk</span>
    </Badge>
  )
  if (!reasons?.length) return badge
  return (
    <Tooltip
      content={
        <div>
          <div className="mb-1 font-medium">{m.label} risk</div>
          <ul className="list-disc space-y-0.5 pl-4">
            {reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      }
    >
      <span tabIndex={0} className="inline-flex rounded-md">
        {badge}
      </span>
    </Tooltip>
  )
}

const toneText = { success: 'text-success', accent: 'text-accent', warning: 'text-warning', error: 'text-error' } as const
const toneBg = { success: 'bg-success-soft', accent: 'bg-accent-soft', warning: 'bg-warning-soft', error: 'bg-error-soft' } as const
const toneDot = { success: 'bg-success-dot', accent: 'bg-accent', warning: 'bg-warning-dot', error: 'bg-error-dot' } as const

export function qualityToneClasses(score: number) {
  const b = qualityBand(score)
  return { text: toneText[b.tone], bg: toneBg[b.tone], dot: toneDot[b.tone], label: b.label, tone: b.tone }
}

export function QualityScoreBadge({ score, showLabel, className, tooltip = true }: { score: number; showLabel?: boolean; className?: string; tooltip?: boolean }) {
  const t = qualityToneClasses(score)
  const el = (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-1.5 py-[1px] text-[12.5px] font-semibold tabular', t.bg, t.text, className)}>
      <Dot className={t.dot} />
      {score.toFixed(1)}
      {showLabel && <span className="font-medium">· {t.label}</span>}
      {!showLabel && <span className="sr-only">({t.label})</span>}
    </span>
  )
  if (!tooltip) return el
  return (
    <Tooltip content={<span><b>{t.label}</b> — {QUALITY_SCORE_TOOLTIP}</span>}>
      <span tabIndex={0} className="inline-flex rounded-md">
        {el}
      </span>
    </Tooltip>
  )
}

export function ConfidenceMeter({ value, className }: { value: number; className?: string }) {
  const tone = value >= 90 ? 'bg-primary' : value >= 75 ? 'bg-primary/70' : 'bg-fg-3'
  return (
    <Tooltip content="Confidence reflects how certain the QA engine is that this is a real issue. It is not proof of linguistic correctness.">
      <span tabIndex={0} className={cn('inline-flex items-center gap-1.5 rounded text-[12px] text-fg-2 tabular', className)}>
        <span className="flex h-1.5 w-10 overflow-hidden rounded-full bg-subtle" aria-hidden>
          <span className={cn('h-full rounded-full', tone)} style={{ width: `${value}%` }} />
        </span>
        {value}%<span className="sr-only"> confidence</span>
      </span>
    </Tooltip>
  )
}
