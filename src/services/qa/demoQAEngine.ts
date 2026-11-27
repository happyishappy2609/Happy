import { latentSeeds } from '@/data/seed/issues'
import type { Issue, IssueCategory, ScanSensitivity } from '@/types'
import { SEVERITY_ORDER } from '@/utils/quality'
import { runRuleChecks } from './rules'
import { RULE_TO_CATEGORIES, type QAFinding, type QAProvider, type QAScanInput, type QAScanOutput } from './types'

export const SCAN_STAGES = [
  'Preparing segments',
  'Checking terminology',
  'Evaluating translation accuracy',
  'Analyzing fluency',
  'Checking locale conventions',
  'Scoring quality',
  'Generating report',
]

const MIN_CONFIDENCE: Record<ScanSensitivity, number> = {
  balanced: 60,
  strict: 50,
  high_precision: 85,
}

const issueKey = (i: Pick<Issue, 'segmentId' | 'category'>) => `${i.segmentId}:${i.category}`

/**
 * Pure, synchronous analysis. Deterministic: the same input always yields the same findings.
 *
 * Sources of findings:
 *  1. Rule-based checks (placeholders, numbers, glossary, punctuation, whitespace, repeated words, length).
 *  2. Simulated AI findings — predefined semantic findings for the demo dataset (latent defects and
 *     still-present open issues), standing in for what an LLM-backed provider would return.
 */
export function analyzeSegments(input: QAScanInput): QAScanOutput {
  const { project, segments, glossary, config, existingIssues } = input
  const segs = segments.filter((s) => s.projectId === project.id && s.lang === config.lang)
  const enabled = new Set<IssueCategory>(config.rules.flatMap((r) => RULE_TO_CATEGORIES[r]))
  if (!config.checkStyleGuide) enabled.delete('style')
  const minConfidence = MIN_CONFIDENCE[config.sensitivity]

  const dismissed = new Set(
    existingIssues.filter((i) => i.projectId === project.id && (i.status === 'resolved' || i.status === 'ignored')).map(issueKey),
  )
  const openByKey = new Map(
    existingIssues.filter((i) => i.projectId === project.id && i.lang === config.lang && (i.status === 'open' || i.status === 'in_review')).map((i) => [issueKey(i), i]),
  )

  const terms = glossary.filter((t) => (t.clientId === null ? config.useProjectTerminology : t.clientId === project.clientId && config.useClientGlossary))

  const found = new Map<string, QAFinding>()
  let suppressed = 0
  let skippedUntranslated = 0
  let words = 0

  const consider = (f: QAFinding) => {
    if (!enabled.has(f.category)) return
    if (f.confidence < minConfidence) return
    if (dismissed.has(f.key)) {
      suppressed++
      return
    }
    const prev = found.get(f.key)
    if (!prev) found.set(f.key, f)
    else if (!prev.suggestion && f.suggestion) found.set(f.key, { ...f, preferredTerm: f.preferredTerm ?? prev.preferredTerm })
  }

  for (const seg of segs) {
    words += seg.source.split(/\s+/).filter(Boolean).length
    if (seg.status === 'draft' && !seg.target.trim()) {
      skippedUntranslated++
      continue
    }

    // Still-present open issues (target unchanged since detection) are re-detected.
    for (const issue of openByKey.values()) {
      if (issue.segmentId !== seg.id || issue.detectedBy === 'reviewer') continue
      if (issue.target !== seg.target) continue
      consider({
        key: issueKey(issue),
        segmentId: seg.id,
        lang: seg.lang,
        category: issue.category,
        severity: issue.severity,
        confidence: issue.confidence,
        source: seg.source,
        target: seg.target,
        suggestion: issue.suggestion,
        explanation: issue.explanation,
        preferredTerm: issue.preferredTerm,
        targetSpan: issue.targetSpan,
        sourceSpan: issue.sourceSpan,
        detectedBy: issue.detectedBy === 'rule' ? 'rule' : 'ai',
        ruleId: issue.ruleId,
      })
    }

    // Simulated AI semantic findings for the demo dataset.
    for (const l of latentSeeds) {
      if (l.projectId !== project.id || l.lang !== seg.lang || l.source !== seg.source || l.target !== seg.target) continue
      if (l.strictOnly && config.sensitivity !== 'strict') continue
      consider({
        key: `${seg.id}:${l.category}`,
        segmentId: seg.id,
        lang: seg.lang,
        category: l.category,
        severity: l.severity,
        confidence: l.confidence,
        source: seg.source,
        target: seg.target,
        suggestion: l.suggestion,
        explanation: l.explanation,
        preferredTerm: l.preferredTerm,
        targetSpan: l.targetSpan,
        sourceSpan: l.sourceSpan,
        detectedBy: 'ai',
      })
    }

    for (const f of runRuleChecks(seg, terms, project.clientId)) consider(f)
  }

  const findings = [...found.values()].sort((a, b) => {
    const s = SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
    if (config.prioritizeCritical && s !== 0) return s
    return s !== 0 ? s : b.confidence - a.confidence
  })

  return { findings, suppressed, skippedUntranslated, totalSegments: segs.length, wordsAnalyzed: words, durationMs: 0 }
}

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new DOMException('Scan cancelled', 'AbortError'))
    })
  })
}

/** Deterministic AI QA simulation — clearly labelled in the UI as a simulation. */
export const demoQAEngine: QAProvider = {
  id: 'demo-simulation',
  label: 'AI QA simulation (demo engine)',
  isSimulation: true,
  stages: SCAN_STAGES,
  async scan(input, onProgress, signal) {
    const started = performance.now()
    const result = analyzeSegments(input)
    const total = result.totalSegments
    const totalMs = input.config.sensitivity === 'strict' ? 6200 : input.config.sensitivity === 'high_precision' ? 5000 : 5600
    const weights = [0.1, 0.17, 0.24, 0.17, 0.12, 0.1, 0.1]
    let elapsedShare = 0
    for (let i = 0; i < SCAN_STAGES.length; i++) {
      const stageMs = totalMs * weights[i]!
      const ticks = Math.max(2, Math.round(stageMs / 90))
      for (let t = 1; t <= ticks; t++) {
        await wait(stageMs / ticks, signal)
        const share = elapsedShare + (weights[i]! * t) / ticks
        onProgress?.({
          stageIndex: i,
          stage: SCAN_STAGES[i]!,
          percent: Math.min(100, Math.round(share * 100)),
          processedSegments: Math.min(total, Math.round(total * Math.min(1, share / 0.82))),
          totalSegments: total,
        })
      }
      elapsedShare += weights[i]!
    }
    return { ...result, durationMs: Math.round(performance.now() - started) }
  },
}

export const activeQAProvider: QAProvider = demoQAEngine
