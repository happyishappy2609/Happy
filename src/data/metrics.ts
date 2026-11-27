import type { DailyMetric } from '@/types'
import { dayKey } from '@/utils/dates'
import { createRng, hashString } from '@/utils/random'

const DAYS = 200

function interp(points: [number, number][], d: number) {
  for (let i = 0; i < points.length - 1; i++) {
    const [d0, v0] = points[i]!
    const [d1, v1] = points[i + 1]!
    if (d >= d0 && d <= d1) return v0 + ((v1 - v0) * (d - d0)) / (d1 - d0)
  }
  return points[points.length - 1]![1]
}

let cache: { key: string; series: DailyMetric[] } | null = null

/**
 * Historical daily operations metrics (deterministic per calendar day).
 * Index 0 = today. Live values (active projects, open critical issues, quality)
 * are overlaid by selectors so today's numbers always reflect the current demo data.
 */
export function getDailySeries(today = new Date()): DailyMetric[] {
  const key = dayKey(today)
  if (cache?.key === key) return cache.series
  const raw: DailyMetric[] = []
  for (let d = 0; d < DAYS; d++) {
    const date = new Date(today)
    date.setDate(date.getDate() - d)
    const rng = createRng(hashString(`lp-${dayKey(date)}`))
    const dow = date.getDay()
    const weekday = dow === 0 || dow === 6 ? 0.55 : 1.18
    const words = 45_800 * (1 - 0.004736 * d) * weekday * (0.92 + rng() * 0.16)
    const automation = Math.min(96, Math.max(40, 81.72 - 0.2567 * d + (rng() - 0.5) * 3))
    const quality = Math.min(99, 94.2 - 0.075 * d + (rng() - 0.5) * 0.7)
    raw.push({
      date: date.toISOString(),
      daysAgo: d,
      words,
      quality,
      automation,
      hoursSaved: (words / 1000) * 0.145 * (0.97 + rng() * 0.06),
      scans: Math.max(1, Math.round(words / 4200 + (rng() - 0.5) * 3)),
      activeProjects: interp([[0, 24], [7, 23.2], [30, 21.43], [90, 19.5], [DAYS, 16]], d),
      criticalOpen: interp([[0, 18], [7, 20.1], [30, 23.4], [90, 26.5], [DAYS, 29]], d),
      reworkRate: Math.max(2, 6.1 + d * 0.035 + (rng() - 0.5) * 1.2),
    })
  }
  // Normalize so the last 30 days match the reference business scenario exactly.
  const sum = (f: (m: DailyMetric) => number, from: number, to: number) => raw.slice(from, to).reduce((s, m) => s + f(m), 0)
  const wScale = 1_280_000 / sum((m) => m.words, 0, 30)
  const hScale = 146 / sum((m) => m.hoursSaved, 0, 30)
  const series = raw.map((m) => ({ ...m, words: Math.round(m.words * wScale), hoursSaved: m.hoursSaved * hScale }))
  cache = { key, series }
  return series
}
