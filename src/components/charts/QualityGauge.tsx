import { InfoTip } from '@/components/ui/tooltip'
import { qualityToneClasses } from '@/components/common/badges'
import { QUALITY_SCORE_TOOLTIP } from '@/utils/quality'

const TONE_COLOR = { success: 'var(--success-dot)', accent: 'var(--accent)', warning: 'var(--warning-dot)', error: 'var(--error-dot)' } as const

/** Semi-circular quality gauge with threshold marker. Pure SVG. */
export function QualityGauge({ score, threshold, size = 200, label = 'Quality score' }: { score: number; threshold: number; size?: number; label?: string }) {
  const t = qualityToneClasses(score)
  const min = 70
  const pct = Math.max(0, Math.min(1, (score - min) / (100 - min)))
  const thPct = Math.max(0, Math.min(1, (threshold - min) / (100 - min)))
  const r = size / 2 - 12
  const cx = size / 2
  const cy = size / 2
  const arc = (p: number) => {
    const a = Math.PI * (1 - p)
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const
  }
  const [ex, ey] = arc(pct)
  const [tx1, ty1] = [cx + (r - 11) * Math.cos(Math.PI * (1 - thPct)), cy - (r - 11) * Math.sin(Math.PI * (1 - thPct))]
  const [tx2, ty2] = [cx + (r + 11) * Math.cos(Math.PI * (1 - thPct)), cy - (r + 11) * Math.sin(Math.PI * (1 - thPct))]
  const below = score < threshold
  return (
    <div className="flex flex-col items-center" role="img" aria-label={`${label}: ${score.toFixed(1)} out of 100, threshold ${threshold}. ${t.label}.`}>
      <svg width={size} height={size / 2 + 14} viewBox={`0 0 ${size} ${size / 2 + 14}`} aria-hidden>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="var(--subtle)" strokeWidth={14} strokeLinecap="round" />
        {pct > 0 && <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${ex} ${ey}`} fill="none" stroke={TONE_COLOR[t.tone]} strokeWidth={14} strokeLinecap="round" style={{ transition: 'all 600ms ease' }} />}
        <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke="var(--navy)" strokeWidth={2} strokeLinecap="round" />
        <text x={cx - r} y={cy + 14} textAnchor="middle" fontSize={10} fill="var(--fg-3)">
          {min}
        </text>
        <text x={cx + r} y={cy + 14} textAnchor="middle" fontSize={10} fill="var(--fg-3)">
          100
        </text>
      </svg>
      <div className="-mt-[58px] flex flex-col items-center">
        <div className="flex items-baseline gap-1">
          <span className="text-[30px] leading-none font-semibold tracking-tight text-fg tabular">{score.toFixed(1)}</span>
          <span className="text-[13px] text-fg-3">/ 100</span>
        </div>
        <div className={`mt-1 flex items-center gap-1 text-[12px] font-medium ${t.text}`}>
          {t.label}
          <InfoTip content={QUALITY_SCORE_TOOLTIP} />
        </div>
      </div>
      <div className="mt-2 text-[12px] text-fg-2">
        Threshold <span className="font-medium text-fg tabular">{threshold}%</span>
        <span className={below ? 'text-error' : 'text-success'}>
          {' '}
          · {below ? `${(threshold - score).toFixed(1)} pts below` : `${(score - threshold).toFixed(1)} pts above`}
        </span>
      </div>
    </div>
  )
}
