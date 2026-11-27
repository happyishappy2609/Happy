import type { Issue, IssueCategory, LangCode, Project, RiskLevel, Severity } from '@/types'
import { daysBetween, daysUntil } from './dates'

/** Demo product rules — not industry standards. */
export const QUALITY_BANDS = [
  { min: 98, label: 'Excellent', tone: 'success' },
  { min: 95, label: 'Good', tone: 'accent' },
  { min: 90, label: 'Needs Attention', tone: 'warning' },
  { min: 0, label: 'At Risk', tone: 'error' },
] as const

export type QualityTone = (typeof QUALITY_BANDS)[number]['tone']

export function qualityBand(score: number) {
  return QUALITY_BANDS.find((b) => score >= b.min) ?? QUALITY_BANDS[3]
}

export const QUALITY_SCORE_TOOLTIP =
  'Quality Score is an estimated quality indicator based on detected issues and severity. It should not replace professional linguistic review.'

export const CONFIDENCE_TOOLTIP =
  'Confidence reflects how certain the QA engine is that a finding is a real issue. It is not proof of linguistic correctness.'

export const SEVERITY_ORDER: Severity[] = ['critical', 'major', 'minor', 'info']

export const DEFAULT_SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 2,
  major: 0.75,
  minor: 0.25,
  info: 0.03,
}

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  accuracy: 'Accuracy',
  mistranslation: 'Mistranslation',
  omission: 'Omission',
  addition: 'Addition',
  terminology: 'Terminology',
  grammar: 'Grammar',
  fluency: 'Fluency',
  style: 'Style',
  locale: 'Locale',
  formatting: 'Formatting',
  consistency: 'Consistency',
  numbers: 'Numbers & units',
  punctuation: 'Punctuation',
}

/** Groups fine-grained categories into the six reporting buckets used on dashboards. */
export function categoryGroup(c: IssueCategory): 'Accuracy' | 'Terminology' | 'Fluency' | 'Style' | 'Locale' | 'Other' {
  switch (c) {
    case 'accuracy':
    case 'mistranslation':
    case 'omission':
    case 'addition':
      return 'Accuracy'
    case 'terminology':
    case 'consistency':
      return 'Terminology'
    case 'fluency':
    case 'grammar':
      return 'Fluency'
    case 'style':
      return 'Style'
    case 'locale':
    case 'numbers':
      return 'Locale'
    default:
      return 'Other'
  }
}

export const isOpen = (i: Issue) => i.status === 'open' || i.status === 'in_review'

/** Scaling so that small batches don't get punished disproportionately. Reference batch = 120 segments. */
export function penaltyFactor(segmentCount: number) {
  if (segmentCount <= 0) return 1
  return Math.min(1.2, Math.max(0.5, 120 / segmentCount))
}

export function issuePenalty(issues: Issue[], weights = DEFAULT_SEVERITY_WEIGHTS) {
  return issues.reduce((sum, i) => sum + (isOpen(i) ? weights[i.severity] : 0), 0)
}

export function round1(n: number) {
  return Math.round(n * 10 + Number.EPSILON) / 10
}

export function clampScore(n: number) {
  return Math.max(0, Math.min(100, n))
}

export interface ProjectStats {
  score: number
  open: number
  openBySeverity: Record<Severity, number>
  total: number
  resolved: number
  ignored: number
  progress: number
  risk: RiskLevel
  riskScore: number
  riskReasons: string[]
  langScores: Partial<Record<LangCode, number>>
  langOpen: Partial<Record<LangCode, number>>
  segmentCount: number
}

export function overallProgress(p: Pick<Project, 'translationProgress' | 'reviewProgress' | 'status'>) {
  if (p.status === 'completed') return 100
  return Math.round(p.translationProgress * 0.6 + p.reviewProgress * 0.4)
}

export function computeProjectStats(
  project: Project,
  issues: Issue[],
  segmentCount: number,
  weights = DEFAULT_SEVERITY_WEIGHTS,
): ProjectStats {
  const own = issues.filter((i) => i.projectId === project.id)
  const open = own.filter(isOpen)
  const factor = penaltyFactor(segmentCount)
  const penalty = issuePenalty(open, weights) * factor
  const score = round1(clampScore(100 - project.qualityResidual - penalty))

  const openBySeverity: Record<Severity, number> = { critical: 0, major: 0, minor: 0, info: 0 }
  for (const i of open) openBySeverity[i.severity]++

  // Per-language scores: distribute the project score around the mean language penalty,
  // so languages with more open issues score lower and the average equals the project score.
  const langs = project.targetLangs
  const langPenalty: Partial<Record<LangCode, number>> = {}
  const langOpen: Partial<Record<LangCode, number>> = {}
  for (const l of langs) {
    const li = open.filter((i) => i.lang === l)
    langPenalty[l] = issuePenalty(li, weights) * factor * langs.length
    langOpen[l] = li.length
  }
  const mean = langs.reduce((s, l) => s + (langPenalty[l] ?? 0), 0) / Math.max(1, langs.length)
  const langScores: Partial<Record<LangCode, number>> = {}
  for (const l of langs) langScores[l] = round1(clampScore(score + (mean - (langPenalty[l] ?? 0)) / Math.max(1, langs.length)))

  const progress = overallProgress(project)
  const { risk, riskScore, reasons } = computeRisk(project, score, openBySeverity.critical, progress)

  return {
    score,
    open: open.length,
    openBySeverity,
    total: own.length,
    resolved: own.filter((i) => i.status === 'resolved').length,
    ignored: own.filter((i) => i.status === 'ignored').length,
    progress,
    risk,
    riskScore,
    riskReasons: reasons,
    langScores,
    langOpen,
    segmentCount,
  }
}

/**
 * Risk combines quality gap vs. threshold, unresolved critical issues,
 * deadline proximity and schedule lag (completion vs. elapsed time).
 */
export function computeRisk(project: Project, score: number, criticalOpen: number, progress: number) {
  if (project.status === 'completed') return { risk: 'low' as RiskLevel, riskScore: 0, reasons: ['Delivered'] }
  const reasons: string[] = []
  let total = 0

  const gap = project.qualityThreshold - score
  if (gap > 0) {
    total += Math.min(40, gap * 6)
    reasons.push(`Quality ${gap.toFixed(1)} pts below ${project.qualityThreshold}% target`)
  }
  if (criticalOpen > 0) {
    total += Math.min(32, criticalOpen * 8)
    reasons.push(`${criticalOpen} unresolved critical ${criticalOpen === 1 ? 'issue' : 'issues'}`)
  }
  const days = daysUntil(project.deadline)
  const remaining = 1 - progress / 100
  if (days < 0) {
    total += 24
    reasons.push(`Deadline passed ${Math.abs(days)}d ago`)
  } else if (days <= 3) {
    total += 20 * Math.max(0.4, remaining * 1.6)
    reasons.push(days === 0 ? 'Due today' : `Due in ${days} ${days === 1 ? 'day' : 'days'}`)
  } else if (days <= 7) {
    total += 14 * Math.max(0.4, remaining * 1.6)
    reasons.push(`Due in ${days} days`)
  } else if (days <= 14) {
    total += 6 * Math.max(0.4, remaining * 1.6)
  }

  const span = Math.max(1, daysBetween(project.startDate, project.deadline))
  const elapsed = Math.min(1, Math.max(0, daysBetween(project.startDate, new Date().toISOString()) / span))
  const lag = elapsed * 100 - progress
  if (lag > 8) {
    total += Math.min(20, lag * 0.5)
    reasons.push(`${Math.round(lag)}% behind schedule`)
  }

  const riskScore = Math.round(Math.min(100, total))
  const risk: RiskLevel = riskScore >= 55 ? 'high' : riskScore >= 28 ? 'medium' : 'low'
  if (reasons.length === 0) reasons.push('On track')
  return { risk, riskScore, reasons }
}

export function scanRating(score: number, threshold: number) {
  if (score >= threshold + 2) return 'Ready for Delivery'
  if (score >= threshold) return 'Meets Threshold'
  if (score >= threshold - 10) return 'Needs Review'
  return 'Requires Rework'
}

export function scanRisk(score: number, threshold: number, critical: number): RiskLevel {
  if (critical >= 2 || score < threshold - 5) return 'high'
  if (critical >= 1 || score < threshold) return 'medium'
  return 'low'
}
