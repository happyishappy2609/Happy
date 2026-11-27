import type { AppData } from '@/data/seed'
import type { Issue, QAScan, ScanConfig, Severity } from '@/types'
import { computeProjectStats, isOpen, round1, scanRating, scanRisk } from '@/utils/quality'
import type { QAScanOutput } from './qa/types'

export function nextIssueId(issues: Issue[]) {
  const max = issues.reduce((m, i) => Math.max(m, Number(i.id.replace(/\D/g, '')) || 0), 1000)
  return (n: number) => `QA-${max + 1 + n}`
}

export function pickReviewer(data: Pick<AppData, 'team' | 'projects'>, projectId: string, lang: string) {
  const p = data.projects.find((x) => x.id === projectId)
  if (!p) return undefined
  const reviewers = p.reviewerIds.map((id) => data.team.find((m) => m.id === id)).filter(Boolean)
  return (reviewers.find((m) => m!.languages.includes(lang as never)) ?? reviewers[0])?.id
}

export function segmentCountFor(data: Pick<AppData, 'segments'>, projectId: string) {
  return data.segments.filter((s) => s.projectId === projectId).length
}

/**
 * Applies a scan output to workspace data (pure — returns new arrays).
 * - Re-detected open issues are kept and linked to the new scan.
 * - New findings become issues.
 * - Open AI/rule issues whose segment text changed since detection (and weren't re-detected) are auto-resolved.
 * - The scanned language's share of the residual (manual-sampling) penalty is replaced by the scan result.
 */
export function applyScanResult(
  data: AppData,
  config: ScanConfig,
  output: QAScanOutput,
  actorId: string,
  nowIso = new Date().toISOString(),
): { data: AppData; scan: QAScan } {
  const scanId = `SC-${Date.now().toString(36).toUpperCase()}`
  const project = data.projects.find((p) => p.id === config.projectId)!
  const makeId = nextIssueId(data.issues)
  const byKey = new Map(data.issues.filter((i) => i.projectId === project.id && i.lang === config.lang && isOpen(i)).map((i) => [`${i.segmentId}:${i.category}`, i]))
  const detectedKeys = new Set(output.findings.map((f) => f.key))
  const segById = new Map(data.segments.filter((s) => s.projectId === project.id).map((s) => [s.id, s]))

  let issues = data.issues.map((i) => {
    if (i.projectId !== project.id || i.lang !== config.lang || !isOpen(i)) return i
    const key = `${i.segmentId}:${i.category}`
    if (detectedKeys.has(key)) return { ...i, scanId, history: [...i.history, { at: nowIso, by: 'system', action: 'Re-detected in scan', note: scanId }] }
    const seg = segById.get(i.segmentId)
    if (i.detectedBy !== 'reviewer' && seg && seg.target !== i.target) {
      return {
        ...i,
        status: 'resolved' as const,
        resolvedAt: nowIso,
        resolution: 'edited' as const,
        history: [...i.history, { at: nowIso, by: 'system', action: 'Auto-resolved', note: 'No longer detected after the translation was updated' }],
      }
    }
    return i
  })

  const created: Issue[] = []
  let n = 0
  for (const f of output.findings) {
    if (byKey.has(f.key)) continue
    const lowConf = data.settings.autoResolveLowConfidence && f.confidence < 70
    const assigneeId = data.settings.autoAssignReviewer ? pickReviewer(data, project.id, f.lang) : undefined
    created.push({
      id: makeId(n++),
      projectId: project.id,
      segmentId: f.segmentId,
      lang: f.lang,
      category: f.category,
      severity: f.severity,
      confidence: f.confidence,
      source: f.source,
      target: f.target,
      suggestion: f.suggestion,
      explanation: f.explanation,
      preferredTerm: f.preferredTerm,
      targetSpan: f.targetSpan,
      sourceSpan: f.sourceSpan,
      status: lowConf ? 'ignored' : 'open',
      ignoreReason: lowConf ? 'Auto-resolved: confidence below 70%' : undefined,
      resolvedAt: lowConf ? nowIso : undefined,
      assigneeId,
      createdAt: nowIso,
      detectedBy: f.detectedBy,
      ruleId: f.ruleId,
      scanId,
      history: [
        { at: nowIso, by: 'system', action: f.detectedBy === 'rule' ? 'Detected by rule-based QA check' : 'Detected by AI QA scan', note: scanId },
        ...(assigneeId ? [{ at: nowIso, by: 'system', action: 'Auto-assigned', note: assigneeId }] : []),
      ],
    })
  }
  issues = [...created, ...issues]

  const projects = data.projects.map((p) => {
    if (p.id !== project.id) return p
    let residual = p.qualityResidual
    let langs = p.residualLangs
    if (langs.includes(config.lang)) {
      residual = residual - residual / langs.length
      langs = langs.filter((l) => l !== config.lang)
    }
    return { ...p, qualityResidual: Math.max(0, residual), residualLangs: langs }
  })

  const updatedProject = projects.find((p) => p.id === project.id)!
  const stats = computeProjectStats(updatedProject, issues, segmentCountFor(data, project.id), data.settings.severityWeights)
  const score = round1(stats.langScores[config.lang] ?? stats.score)

  const scanIssues = issues.filter((i) => i.projectId === project.id && i.scanId === scanId)
  const sev: Record<Severity, number> = { critical: 0, major: 0, minor: 0, info: 0 }
  const cats: QAScan['summary']['categories'] = {}
  for (const i of scanIssues) {
    sev[i.severity]++
    cats[i.category] = (cats[i.category] ?? 0) + 1
  }

  const scan: QAScan = {
    id: scanId,
    projectId: project.id,
    lang: config.lang,
    startedAt: new Date(new Date(nowIso).getTime() - output.durationMs).toISOString(),
    completedAt: nowIso,
    config,
    engine: 'AI QA simulation (demo engine)',
    triggeredBy: actorId,
    issueIds: scanIssues.map((i) => i.id),
    summary: {
      score,
      rating: scanRating(score, project.qualityThreshold),
      totalSegments: output.totalSegments,
      wordsAnalyzed: output.wordsAnalyzed,
      issuesDetected: scanIssues.length,
      newIssues: created.length,
      carriedOver: scanIssues.length - created.length,
      severity: sev,
      categories: cats,
      risk: scanRisk(score, project.qualityThreshold, sev.critical),
      reviewMinutesSaved: Math.round(output.totalSegments * 0.9 + scanIssues.length * 4),
      durationMs: output.durationMs,
    },
  }

  const finalProjects = projects.map((p) =>
    p.id === project.id ? { ...p, qualityHistory: [...p.qualityHistory, { date: nowIso, score: stats.score, label: 'AI QA scan' }] } : p,
  )

  return { data: { ...data, issues, projects: finalProjects, scans: [scan, ...data.scans] }, scan }
}
