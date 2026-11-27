import type { GlossaryTerm, LangCode, Segment } from '@/types'
import { LANGUAGES } from '@/utils/languages'
import type { QAFinding } from './types'

/**
 * Lightweight, deterministic rule-based checks. These are real string checks — not AI.
 * They complement the simulated AI analysis and run on any segment (including imported ones).
 */

const PLACEHOLDER_RE = /\{\{\s*[\w.]+\s*\}\}|\{[\w.]+\}|%\d*\$?[sd@]|<\/?[a-z][a-z0-9]*[^>]*>|https?:\/\/[^\s)]+/gi

export function extractPlaceholders(text: string) {
  return (text.match(PLACEHOLDER_RE) ?? []).map((p) => p.replace(/\s+/g, '')).sort()
}

/** Numbers normalized so "1,250.50" and "1 250,50" compare equal. */
export function extractNumbers(text: string) {
  const stripped = text.replace(PLACEHOLDER_RE, ' ')
  const matches = stripped.match(/\d[\d.,   ]*\d|\d/g) ?? []
  return matches
    .map((m) => m.replace(/[.,   ]/g, ''))
    .map((m) => m.replace(/^0+(?=\d)/, ''))
    .sort()
}

function multisetDiff(a: string[], b: string[]) {
  const missing: string[] = []
  const extra: string[] = []
  const pool = [...b]
  for (const x of a) {
    const idx = pool.indexOf(x)
    if (idx >= 0) pool.splice(idx, 1)
    else missing.push(x)
  }
  extra.push(...pool)
  return { missing, extra }
}

type EndClass = 'period' | 'question' | 'exclamation' | 'colon' | 'none'

function endClass(text: string): EndClass {
  const t = text.trim()
  const c = t.charAt(t.length - 1)
  if ('.。．'.includes(c) && c !== '') return 'period'
  if ('?？'.includes(c) && c !== '') return 'question'
  if ('!！'.includes(c) && c !== '') return 'exclamation'
  if (':：'.includes(c) && c !== '') return 'colon'
  return 'none'
}

const END_CHAR: Record<EndClass, { latin: string; cjk: string }> = {
  period: { latin: '.', cjk: '。' },
  question: { latin: '?', cjk: '？' },
  exclamation: { latin: '!', cjk: '！' },
  colon: { latin: ':', cjk: '：' },
  none: { latin: '', cjk: '' },
}

const REFLEXIVE_OK = new Set(['nous', 'vous', 'sie'])

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function termAppliesTo(term: GlossaryTerm, lang: LangCode, clientId: string) {
  return term.status === 'approved' && term.targetLang === lang && (term.clientId === null || term.clientId === clientId)
}

export function sourceContainsTerm(source: string, term: string) {
  return new RegExp(`(^|[^\\p{L}])${escapeRe(term)}($|[^\\p{L}])`, 'iu').test(source)
}

export function runRuleChecks(segment: Segment, glossary: GlossaryTerm[], clientId: string): QAFinding[] {
  const { source, target, lang } = segment
  const out: QAFinding[] = []
  const cjk = LANGUAGES[lang].cjk
  const base = { segmentId: segment.id, lang, source, target, detectedBy: 'rule' as const }

  if (!target.trim()) {
    if (segment.status === 'draft') return out
    out.push({ ...base, key: `${segment.id}:omission`, category: 'omission', severity: 'major', confidence: 99, suggestion: '', explanation: 'The target segment is empty.', ruleId: 'empty' })
    return out
  }

  // Placeholders, HTML tags and URLs
  const ph = multisetDiff(extractPlaceholders(source), extractPlaceholders(target))
  if (ph.missing.length || ph.extra.length) {
    const parts = []
    if (ph.missing.length) parts.push(`missing ${ph.missing.join(', ')}`)
    if (ph.extra.length) parts.push(`unexpected ${ph.extra.join(', ')}`)
    out.push({
      ...base,
      key: `${segment.id}:formatting`,
      category: 'formatting',
      severity: 'major',
      confidence: 98,
      suggestion: '',
      explanation: `Placeholder or tag mismatch: ${parts.join('; ')}. Variables and markup must be preserved exactly.`,
      targetSpan: ph.extra[0],
      ruleId: 'placeholder',
    })
  }

  // Numbers
  const nums = multisetDiff(extractNumbers(source), extractNumbers(target))
  if (nums.missing.length || nums.extra.length) {
    out.push({
      ...base,
      key: `${segment.id}:numbers`,
      category: 'numbers',
      severity: 'major',
      confidence: 95,
      suggestion: '',
      explanation: `Number mismatch between source and target${nums.missing.length ? ` (source has ${nums.missing.join(', ')})` : ''}${nums.extra.length ? ` (target has ${nums.extra.join(', ')})` : ''}.`,
      ruleId: 'numbers',
    })
  }

  // Glossary
  for (const term of glossary) {
    if (!termAppliesTo(term, lang, clientId)) continue
    if (!sourceContainsTerm(source, term.source)) continue
    if (target.toLowerCase().includes(term.target.toLowerCase())) continue
    const forbidden = term.forbidden?.find((f) => target.toLowerCase().includes(f.toLowerCase()))
    out.push({
      ...base,
      key: `${segment.id}:terminology`,
      category: 'terminology',
      severity: 'major',
      confidence: forbidden ? 96 : 88,
      suggestion: '',
      preferredTerm: term.target,
      targetSpan: forbidden,
      explanation: `Approved term "${term.source}" → "${term.target}" is not used${forbidden ? `; found forbidden variant "${forbidden}"` : ''}.`,
      ruleId: 'glossary',
    })
    break
  }

  // Sentence-final punctuation
  const se = endClass(source)
  const te = endClass(target)
  if (se !== te) {
    const expected = cjk ? END_CHAR[se].cjk : END_CHAR[se].latin
    out.push({
      ...base,
      key: `${segment.id}:punctuation`,
      category: 'punctuation',
      severity: 'minor',
      confidence: 86,
      suggestion: se === 'none' ? target.trim().replace(/[.。!！?？:：]$/, '') : target.trim().replace(/[.。!！?？:：]$/, '') + expected,
      explanation: se === 'none' ? 'Target ends with punctuation that is not in the source.' : `Sentence-final punctuation differs from the source (expected "${expected}").`,
      ruleId: 'punctuation',
    })
  }

  // Whitespace
  const ws: string[] = []
  if (/^\s/.test(target) && !/^\s/.test(source)) ws.push('leading whitespace')
  if (/\s$/.test(target) && !/\s$/.test(source)) ws.push('trailing whitespace')
  if (/ {2,}/.test(target) && !/ {2,}/.test(source)) ws.push('double space')
  if (ws.length && !out.some((f) => f.category === 'formatting')) {
    out.push({
      ...base,
      key: `${segment.id}:formatting`,
      category: 'formatting',
      severity: 'minor',
      confidence: 94,
      suggestion: target.trim().replace(/ {2,}/g, ' '),
      explanation: `Whitespace issue: ${ws.join(', ')}.`,
      ruleId: 'whitespace',
    })
  }

  // Repeated words
  if (!cjk) {
    const rep = /(^|[\s(])([\p{L}]{2,})\s+\2(?=$|[\s.,;:!?])/iu.exec(target)
    if (rep && !REFLEXIVE_OK.has(rep[2]!.toLowerCase())) {
      const word = rep[2]!
      out.push({
        ...base,
        key: `${segment.id}:grammar`,
        category: 'grammar',
        severity: 'minor',
        confidence: 90,
        suggestion: target.replace(new RegExp(`${escapeRe(word)}\\s+${escapeRe(word)}`, 'iu'), word),
        targetSpan: `${word} ${word}`,
        explanation: `Repeated word "${word}".`,
        ruleId: 'repeated',
      })
    }
  }

  // Length anomaly
  if (source.length >= 15) {
    const ratio = target.length / source.length
    const [lo, hi] = cjk ? [0.12, 1.3] : [0.45, 2.2]
    if (ratio < lo || ratio > hi) {
      const short = ratio < lo
      out.push({
        ...base,
        key: `${segment.id}:${short ? 'omission' : 'addition'}`,
        category: short ? 'omission' : 'addition',
        severity: 'minor',
        confidence: 64,
        suggestion: '',
        explanation: `Target is ${Math.round(ratio * 100)}% of the source length — possible ${short ? 'omission' : 'addition'}.`,
        ruleId: 'length',
      })
    }
  }

  return out
}
