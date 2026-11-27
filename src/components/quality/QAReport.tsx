import { AlertOctagon, CheckCircle2, Clock, Layers, ScanSearch, ShieldAlert, ShieldCheck } from 'lucide-react'
import { severityMeta } from '@/components/common/badges'
import { qualityToneClasses } from '@/components/common/badges'
import { InfoTip } from '@/components/ui/tooltip'
import type { QAScan, RiskLevel, Severity } from '@/types'
import { cn } from '@/utils/cn'
import { formatNumber } from '@/utils/format'
import { CATEGORY_LABELS, QUALITY_SCORE_TOOLTIP, SEVERITY_ORDER } from '@/utils/quality'

const RISK_META: Record<RiskLevel, { label: string; cls: string; icon: typeof ShieldCheck }> = {
  low: { label: 'Low', cls: 'bg-success-soft text-success', icon: ShieldCheck },
  medium: { label: 'Medium', cls: 'bg-warning-soft text-warning', icon: ShieldAlert },
  high: { label: 'High', cls: 'bg-error-soft text-error', icon: AlertOctagon },
}

export function SeverityBars({ counts }: { counts: Record<Severity, number> }) {
  const total = Math.max(1, SEVERITY_ORDER.reduce((s, k) => s + counts[k], 0))
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-subtle" aria-hidden>
        {SEVERITY_ORDER.map((k) => (
          <div key={k} className={severityMeta[k].dot} style={{ width: `${(counts[k] / total) * 100}%` }} />
        ))}
      </div>
      <dl className="mt-3 grid grid-cols-4 gap-2">
        {SEVERITY_ORDER.map((k) => (
          <div key={k}>
            <dt className="flex items-center gap-1.5 text-[12px] text-fg-2">
              <span className={cn('size-2 rounded-full', severityMeta[k].dot)} /> {severityMeta[k].label}
            </dt>
            <dd className="mt-0.5 text-[18px] font-semibold text-fg tabular">{counts[k]}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function QAReportSummary({ scan, threshold, compact }: { scan: QAScan; threshold: number; compact?: boolean }) {
  const s = scan.summary
  const tone = qualityToneClasses(s.score)
  const risk = RISK_META[s.risk]
  const RiskIcon = risk.icon
  const cats = Object.entries(s.categories).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
  const maxCat = Math.max(1, ...cats.map(([, v]) => v ?? 0))
  return (
    <div className={cn('grid gap-4', compact ? 'lg:grid-cols-[220px_1fr_1fr]' : 'md:grid-cols-[230px_1fr]')}>
      <div className="flex flex-col justify-between rounded-[12px] border border-border bg-subtle/50 p-4">
        <div>
          <div className="flex items-center gap-1 text-[12px] font-medium text-fg-2">
            Quality Score <InfoTip content={QUALITY_SCORE_TOOLTIP} />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={cn('text-[34px] leading-none font-semibold tracking-tight tabular', tone.text)}>{s.score.toFixed(1)}</span>
            <span className="text-[13px] text-fg-3">/ 100</span>
          </div>
          <div className="mt-2 text-[13px] font-semibold text-fg">{s.rating}</div>
          <div className="text-[12px] text-fg-3">Threshold {threshold}%</div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[12px] text-fg-2">Quality risk</span>
          <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-medium', risk.cls)}>
            <RiskIcon className="size-3" /> {risk.label}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Layers, label: 'Total segments', value: formatNumber(s.totalSegments) },
            { icon: ScanSearch, label: 'Issues detected', value: formatNumber(s.issuesDetected) },
            { icon: CheckCircle2, label: 'New this scan', value: formatNumber(s.newIssues) },
            { icon: Clock, label: 'Review time saved', value: `${(s.reviewMinutesSaved / 60).toFixed(1)}h` },
          ].map((x) => (
            <div key={x.label} className="rounded-[10px] border border-border px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11.5px] text-fg-3">
                <x.icon className="size-3" /> {x.label}
              </div>
              <div className="mt-1 text-[17px] font-semibold text-fg tabular">{x.value}</div>
            </div>
          ))}
        </div>
        <div className="rounded-[10px] border border-border p-3">
          <div className="mb-2 text-[12px] font-medium text-fg-2">Severity breakdown</div>
          <SeverityBars counts={s.severity} />
        </div>
      </div>

      <div className={cn('rounded-[10px] border border-border p-3', !compact && 'md:col-span-2')}>
        <div className="mb-2 text-[12px] font-medium text-fg-2">Category breakdown</div>
        {cats.length === 0 ? (
          <p className="text-[12.5px] text-fg-3">No issues detected.</p>
        ) : (
          <ul className={cn('grid gap-x-6 gap-y-1.5', !compact && 'sm:grid-cols-2')}>
            {cats.map(([k, v]) => (
              <li key={k} className="flex items-center gap-2 text-[12.5px]">
                <span className="w-28 shrink-0 truncate text-fg-2">{CATEGORY_LABELS[k as keyof typeof CATEGORY_LABELS]}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle">
                  <span className="block h-full rounded-full bg-primary/80" style={{ width: `${((v ?? 0) / maxCat) * 100}%` }} />
                </span>
                <span className="w-6 text-right font-medium text-fg tabular">{v}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
