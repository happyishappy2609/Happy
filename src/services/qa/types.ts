import type { GlossaryTerm, Issue, IssueCategory, LangCode, Project, QARuleId, ScanConfig, Segment, Severity } from '@/types'

export interface QAFinding {
  /** Stable key: one finding per segment & category. */
  key: string
  segmentId: string
  lang: LangCode
  category: IssueCategory
  severity: Severity
  confidence: number
  source: string
  target: string
  suggestion: string
  explanation: string
  preferredTerm?: string
  targetSpan?: string
  sourceSpan?: string
  detectedBy: 'ai' | 'rule'
  ruleId?: string
}

export interface QAScanInput {
  project: Project
  segments: Segment[]
  glossary: GlossaryTerm[]
  config: ScanConfig
  /** Existing issues for the project — used to carry over open findings and suppress dismissed ones. */
  existingIssues: Issue[]
}

export interface QAScanProgress {
  stageIndex: number
  stage: string
  percent: number
  processedSegments: number
  totalSegments: number
}

export interface QAScanOutput {
  findings: QAFinding[]
  suppressed: number
  skippedUntranslated: number
  totalSegments: number
  wordsAnalyzed: number
  durationMs: number
}

/**
 * Provider abstraction. The demo ships a deterministic simulation (`demoQAEngine`).
 * A production provider (LLM-backed service behind an API) can implement the same contract.
 */
export interface QAProvider {
  id: string
  label: string
  isSimulation: boolean
  stages: string[]
  scan(input: QAScanInput, onProgress?: (p: QAScanProgress) => void, signal?: AbortSignal): Promise<QAScanOutput>
}

export const RULE_TO_CATEGORIES: Record<QARuleId, IssueCategory[]> = {
  accuracy: ['accuracy', 'mistranslation'],
  omission: ['omission'],
  addition: ['addition'],
  terminology: ['terminology'],
  grammar: ['grammar'],
  fluency: ['fluency'],
  style: ['style'],
  locale: ['locale'],
  formatting: ['formatting'],
  consistency: ['consistency'],
  numbers: ['numbers'],
  punctuation: ['punctuation'],
}

export const ALL_RULES: { id: QARuleId; label: string; description: string }[] = [
  { id: 'accuracy', label: 'Accuracy', description: 'Meaning changes, reversals, mistranslations' },
  { id: 'omission', label: 'Omission', description: 'Source content missing in target' },
  { id: 'addition', label: 'Addition', description: 'Content added that is not in source' },
  { id: 'terminology', label: 'Terminology', description: 'Glossary and approved-term compliance' },
  { id: 'grammar', label: 'Grammar', description: 'Agreement, repeated words, syntax' },
  { id: 'fluency', label: 'Fluency', description: 'Natural, idiomatic target language' },
  { id: 'style', label: 'Style', description: 'Client style guide, tone and register' },
  { id: 'locale', label: 'Locale', description: 'Dates, currency and regional conventions' },
  { id: 'formatting', label: 'Formatting', description: 'Placeholders, tags, URLs, whitespace' },
  { id: 'consistency', label: 'Consistency', description: 'Same source translated the same way' },
  { id: 'numbers', label: 'Numbers and units', description: 'Figures, units and amounts match' },
  { id: 'punctuation', label: 'Punctuation', description: 'Sentence-final and locale punctuation' },
]
