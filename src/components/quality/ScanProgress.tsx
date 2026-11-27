import { Check, Loader2 } from 'lucide-react'
import { ProgressBar } from '@/components/ui/controls'
import type { QAScanProgress } from '@/services/qa/types'
import { cn } from '@/utils/cn'

export function ScanProgress({ stages, progress, label }: { stages: string[]; progress: QAScanProgress | null; label: string }) {
  const idx = progress?.stageIndex ?? 0
  const pct = progress?.percent ?? 0
  return (
    <div aria-live="polite">
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Loader2 className="size-5 animate-spin" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-fg">Analyzing {label}</div>
          <div className="text-[12.5px] text-fg-2">
            {progress ? `${progress.processedSegments} of ${progress.totalSegments} segments processed` : 'Starting…'}
          </div>
        </div>
        <div className="text-[22px] font-semibold text-fg tabular">{pct}%</div>
      </div>
      <ProgressBar value={pct} label="Scan progress" />
      <ol className="mt-5 space-y-2.5">
        {stages.map((s, i) => {
          const done = i < idx || pct >= 100
          const current = i === idx && pct < 100
          return (
            <li key={s} className="flex items-center gap-2.5 text-[13px]">
              <span className={cn('flex size-5 items-center justify-center rounded-full', done ? 'bg-accent text-white' : current ? 'bg-primary-soft text-primary' : 'bg-subtle text-fg-3')}>
                {done ? <Check className="size-3" strokeWidth={3} /> : current ? <span className="size-1.5 rounded-full bg-primary scan-pulse" /> : <span className="size-1.5 rounded-full bg-fg-3/50" />}
              </span>
              <span className={cn(done ? 'text-fg-2' : current ? 'font-medium text-fg' : 'text-fg-3')}>{s}</span>
              {current && <span className="text-[12px] text-fg-3">…</span>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
