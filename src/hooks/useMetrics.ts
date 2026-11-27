import { useMemo } from 'react'
import { getDailySeries } from '@/data/metrics'
import { useAppStore } from '@/store/useAppStore'
import type { DailyMetric, Issue, Project, QAScan } from '@/types'
import { daysBetween, startOfDay } from '@/utils/dates'
import { categoryGroup, isOpen, round1, type ProjectStats } from '@/utils/quality'

export type RangePreset = '7' | '30' | '90' | 'custom'

export interface DateRange {
  preset: RangePreset
  from?: string
  to?: string
}

/** Resolves a range into [startDaysAgo, endDaysAgo] (inclusive, 0 = today). */
export function resolveRange(r: DateRange): { start: number; end: number; days: number; label: string } {
  if (r.preset !== 'custom' || !r.from || !r.to) {
    const days = Number(r.preset === 'custom' ? 30 : r.preset)
    return { start: days - 1, end: 0, days, label: `Last ${days} days` }
  }
  const today = startOfDay(new Date()).toISOString()
  const a = Math.max(0, Math.round(daysBetween(startOfDay(new Date(r.from)).toISOString(), today)))
  const b = Math.max(0, Math.round(daysBetween(startOfDay(new Date(r.to)).toISOString(), today)))
  const start = Math.min(179, Math.max(a, b))
  const end = Math.min(start, Math.min(a, b))
  return { start, end, days: start - end + 1, label: 'Custom range' }
}

/** Historical issue mix across all workspace projects (per 30 days); in-session findings are added on top. */
export const BASELINE_CATEGORY_MIX = { Accuracy: 128, Terminology: 96, Fluency: 72, Style: 52, Locale: 32, Other: 20 } as const

export const isLiveScan = (s: QAScan) => s.id.length > 7

const smooth = (arr: number[], w = 7) => arr.map((_, i) => { const sl = arr.slice(Math.max(0, i - w + 1), i + 1); return sl.reduce((a, b) => a + b, 0) / sl.length })

const pct = (cur: number, prev: number) => (prev ? ((cur - prev) / Math.abs(prev)) * 100 : 0)

export function useDashboardMetrics(range: DateRange, statsMap: Map<string, ProjectStats>) {
  const projects = useAppStore((s) => s.projects)
  const issues = useAppStore((s) => s.issues)
  const scans = useAppStore((s) => s.scans)
  const seededAt = useAppStore((s) => s.seededAt)

  return useMemo(() => {
    const series = getDailySeries()
    const { start, end, days, label } = resolveRange(range)
    const win = (s: number, e: number) => series.filter((m) => m.daysAgo <= s && m.daysAgo >= e)
    const cur = win(start, end)
    const prev = win(start + days, end + days)
    const sum = (arr: DailyMetric[], f: (m: DailyMetric) => number) => arr.reduce((t, m) => t + f(m), 0)
    const avg = (arr: DailyMetric[], f: (m: DailyMetric) => number) => (arr.length ? sum(arr, f) / arr.length : 0)
    const at = (d: number) => series.find((m) => m.daysAgo === Math.min(series.length - 1, d))!

    const active = projects.filter((p) => p.status === 'active' || p.status === 'in_review')
    const liveQuality = active.length ? active.reduce((t, p) => t + (statsMap.get(p.id)?.score ?? 0), 0) / active.length : 0
    const criticalOpen = issues.filter((i) => isOpen(i) && i.severity === 'critical').length

    const inWindow = (iso: string) => {
      const d = Math.floor(daysBetween(iso, new Date().toISOString()))
      return d <= start && d >= end
    }
    const liveScans = scans.filter((s) => isLiveScan(s) && inWindow(s.completedAt))
    const liveWords = liveScans.reduce((t, s) => t + s.summary.wordsAnalyzed, 0)
    const liveHours = liveScans.reduce((t, s) => t + s.summary.reviewMinutesSaved / 60, 0)

    const isEndToday = end === 0
    const activeNow = isEndToday ? active.length : at(end).activeProjects
    const qualityNow = isEndToday ? liveQuality : at(end).quality
    const criticalNow = isEndToday ? criticalOpen : at(end).criticalOpen

    const words = sum(cur, (m) => m.words) + liveWords
    const wordsPrev = sum(prev, (m) => m.words)
    const hours = sum(cur, (m) => m.hoursSaved) + liveHours
    const hoursPrev = sum(prev, (m) => m.hoursSaved)
    const automation = avg(cur, (m) => m.automation)
    const automationPrev = avg(prev, (m) => m.automation)

    const chrono = [...cur].reverse()
    const trend = chrono.map((m) => ({ date: m.date, score: round1(m.daysAgo === 0 ? liveQuality : m.quality), target: 95 }))

    // Category mix: historical baseline scaled to the window + findings created in this session.
    const scale = days / 30
    const mix: Record<string, number> = {}
    for (const [k, v] of Object.entries(BASELINE_CATEGORY_MIX)) mix[k] = Math.round(v * scale)
    for (const i of issues) if (new Date(i.createdAt).getTime() > seededAt && inWindow(i.createdAt)) mix[categoryGroup(i.category)] = (mix[categoryGroup(i.category)] ?? 0) + 1

    return {
      label,
      days,
      kpis: {
        activeProjects: { value: activeNow, delta: pct(activeNow, at(end + days).activeProjects), spark: chrono.map((m, i) => (i === chrono.length - 1 && isEndToday ? activeNow : m.activeProjects)) },
        words: { value: words, delta: pct(words, wordsPrev), spark: smooth(chrono.map((m) => m.words)) },
        quality: { value: qualityNow, delta: pct(qualityNow, at(end + days).quality), spark: trend.map((t) => t.score) },
        critical: { value: criticalNow, delta: pct(criticalNow, at(end + days).criticalOpen), spark: chrono.map((m, i) => (i === chrono.length - 1 && isEndToday ? criticalNow : m.criticalOpen)) },
        automation: { value: automation, delta: pct(automation, automationPrev), spark: smooth(chrono.map((m) => m.automation), 5) },
        hours: { value: hours, delta: pct(hours, hoursPrev), spark: smooth(chrono.map((m) => m.hoursSaved)) },
      },
      trend,
      mix: Object.entries(mix).map(([name, value]) => ({ name, value })),
    }
  }, [range, statsMap, projects, issues, scans, seededAt])
}

export function topRiskProjects(projects: Project[], statsMap: Map<string, ProjectStats>, n = 3) {
  return projects
    .filter((p) => p.status !== 'completed')
    .map((p) => ({ project: p, stats: statsMap.get(p.id)! }))
    .filter((x) => x.stats)
    .sort((a, b) => b.stats.riskScore - a.stats.riskScore)
    .slice(0, n)
}

export function issuesInRange(issues: Issue[], days: number) {
  const cutoff = Date.now() - days * 86_400_000
  return issues.filter((i) => new Date(i.createdAt).getTime() >= cutoff)
}
