import type { LangCode, TMUnit } from '@/types'
import { LANGUAGES } from '@/utils/languages'

function tokens(s: string, cjk: boolean) {
  const norm = s.toLowerCase().replace(/[.,!?;:"“”'’()]/g, ' ')
  return cjk ? [...norm.replace(/\s+/g, '')] : norm.split(/\s+/).filter(Boolean)
}

function levenshtein(a: string[], b: string[]) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => i)
  for (let j = 1; j <= b.length; j++) {
    let prev = dp[0]!
    dp[0] = j
    for (let i = 1; i <= a.length; i++) {
      const tmp = dp[i]!
      dp[i] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[i]!, dp[i - 1]!)
      prev = tmp
    }
  }
  return dp[a.length]!
}

/** Fuzzy similarity (0–100) based on word-level edit distance; exact text match = 100. */
export function similarity(a: string, b: string, cjk = false) {
  if (a.trim() === b.trim()) return 100
  const ta = tokens(a, cjk)
  const tb = tokens(b, cjk)
  if (!ta.length || !tb.length) return 0
  const dist = levenshtein(ta, tb)
  const score = (1 - dist / Math.max(ta.length, tb.length)) * 100
  // Same words but different punctuation/case → near-exact
  return Math.min(99, Math.round(score))
}

export interface TMMatch {
  unit: TMUnit
  score: number
  kind: 'exact' | 'fuzzy-high' | 'fuzzy'
}

export function lookupTM(source: string, sourceLang: LangCode, targetLang: LangCode, units: TMUnit[], clientId?: string, limit = 3): TMMatch[] {
  const cjk = LANGUAGES[sourceLang].cjk
  return units
    .filter((u) => u.sourceLang === sourceLang && u.targetLang === targetLang)
    .map((u) => {
      let score = similarity(source, u.source, cjk)
      if (score === 100 && clientId && u.clientId && u.clientId !== clientId) score = 99
      return { unit: u, score }
    })
    .filter((m) => m.score >= 70)
    .sort((a, b) => b.score - a.score || (b.unit.clientId === clientId ? 1 : 0) - (a.unit.clientId === clientId ? 1 : 0))
    .slice(0, limit)
    .map((m) => ({ ...m, kind: m.score === 100 ? 'exact' : m.score >= 85 ? 'fuzzy-high' : 'fuzzy' }))
}

export function matchLabel(score: number | null) {
  if (score === null) return 'No match'
  if (score === 100) return 'Exact match'
  return `${score}% fuzzy match`
}
