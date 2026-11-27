import { slugKey } from '@/data/seed'
import type { LangCode, Project, Segment, StringKeyRow } from '@/types'

export const KEY_PATTERN = /^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)*$/

export function namespaceOf(key: string) {
  const i = key.indexOf('.')
  return i > 0 ? key.slice(0, i) : '(root)'
}

/** Returns an error message, or null when the key name is valid and unique in the project. */
export function validateKeyName(key: string, existing: Set<string>, currentKey?: string) {
  const k = key.trim()
  if (!k) return 'Key is required.'
  if (k.length > 120) return 'Keep keys under 120 characters.'
  if (!KEY_PATTERN.test(k)) return 'Use letters, numbers, "_" or "-", separated by dots (e.g. checkout.title).'
  if (k !== currentKey && existing.has(k)) return 'This key already exists in the project.'
  return null
}

/** Makes `base` unique against `taken` by appending _2, _3… */
export function uniqueKey(base: string, taken: Set<string>) {
  let key = base
  let n = 2
  while (taken.has(key)) key = `${base}_${n++}`
  taken.add(key)
  return key
}

export function suggestKey(source: string, namespace: string, taken: Set<string>) {
  return uniqueKey(`${namespace}.${slugKey(source)}`, new Set(taken))
}

/** Groups a project's segments into one row per key, with a value per target language. */
export function buildKeyRows(project: Project, segments: Segment[]): StringKeyRow[] {
  const map = new Map<string, StringKeyRow>()
  for (const s of segments) {
    if (s.projectId !== project.id) continue
    const key = s.key ?? `segment.${s.index}`
    let row = map.get(key)
    if (!row) {
      row = { key, namespace: namespaceOf(key), source: s.source, note: s.note, maxLength: s.maxLength, values: {} }
      map.set(key, row)
    }
    row.values[s.lang] = s
    if (!row.note && s.note) row.note = s.note
    if (!row.maxLength && s.maxLength) row.maxLength = s.maxLength
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key))
}

export const hasValue = (s: Segment | undefined) => !!s && s.target.trim().length > 0

export function keyCompletion(row: StringKeyRow, langs: LangCode[]) {
  const done = langs.filter((l) => hasValue(row.values[l])).length
  return { done, total: langs.length, complete: done === langs.length }
}

/** Flat `{ key: value }` JSON for one language (source when lang is 'en'). */
export function toFlatJSON(rows: StringKeyRow[], lang: LangCode | 'source') {
  const out: Record<string, string> = {}
  for (const r of rows) {
    if (lang === 'source') out[r.key] = r.source
    else if (hasValue(r.values[lang])) out[r.key] = r.values[lang]!.target
  }
  return out
}

/** Nested JSON (`checkout.title` → `{ checkout: { title } }`), the common i18n file layout. */
export function toNestedJSON(flat: Record<string, string>) {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.')
    let node = out
    parts.forEach((p, i) => {
      if (i === parts.length - 1) {
        // A key that is also a namespace keeps its value under "_".
        if (node[p] && typeof node[p] === 'object') (node[p] as Record<string, unknown>)._ = value
        else node[p] = value
      } else {
        if (typeof node[p] === 'string') node[p] = { _: node[p] }
        node[p] = (node[p] as Record<string, unknown>) ?? {}
        node = node[p] as Record<string, unknown>
      }
    })
  }
  return out
}
