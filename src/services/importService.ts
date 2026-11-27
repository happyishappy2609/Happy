import type { ProjectFile } from '@/types'

export interface ParsedFile {
  format: Extract<ProjectFile['format'], 'CSV' | 'XLIFF' | 'JSON' | 'TXT'>
  segments: { source: string; target: string; key?: string }[]
  hasTargets: boolean
  warnings: string[]
}

export const ACCEPTED_EXTENSIONS = ['csv', 'xliff', 'xlf', 'json', 'txt'] as const
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024
export const MAX_SEGMENTS = 2000

export function extensionOf(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

export function validateFile(file: { name: string; size: number }): string | null {
  const ext = extensionOf(file.name)
  if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) return `Unsupported file type ".${ext}". Use CSV, XLIFF, JSON or TXT.`
  if (file.size === 0) return 'The file is empty.'
  if (file.size > MAX_IMPORT_BYTES) return 'File is larger than 5 MB — the demo import is limited to 5 MB.'
  return null
}

/** RFC 4180-ish CSV parser (quotes, escaped quotes, CRLF). */
export function parseCSVRows(text: string, delimiter?: string): string[][] {
  const delim = delimiter ?? (text.split('\n')[0]!.split(';').length > text.split('\n')[0]!.split(',').length ? ';' : text.includes('\t') && !text.includes(',') ? '\t' : ',')
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (c === '"') q = false
      else cell += c
    } else if (c === '"') q = true
    else if (c === delim) {
      row.push(cell)
      cell = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += c
  }
  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((x) => x.trim()))
}

function parseCSV(text: string): ParsedFile {
  const rows = parseCSVRows(text.replace(/^﻿/, ''))
  const warnings: string[] = []
  if (!rows.length) return { format: 'CSV', segments: [], hasTargets: false, warnings: ['No rows found.'] }
  const header = rows[0]!.map((h) => h.trim().toLowerCase())
  const srcIdx = header.findIndex((h) => ['source', 'src', 'en', 'english', 'source text', 'original'].includes(h))
  const tgtIdx = header.findIndex((h) => ['target', 'tgt', 'translation', 'target text', 'translated'].includes(h))
  const keyIdx = header.findIndex((h) => ['key', 'id', 'string id', 'segment id'].includes(h))
  const hasHeader = srcIdx >= 0 || tgtIdx >= 0
  const body = hasHeader ? rows.slice(1) : rows
  const si = srcIdx >= 0 ? srcIdx : 0
  const ti = tgtIdx >= 0 ? tgtIdx : body[0] && body[0].length > 1 ? 1 : -1
  if (!hasHeader) warnings.push('No header row detected — using column 1 as source and column 2 as target.')
  const segments = body
    .map((r) => ({ source: (r[si] ?? '').trim(), target: ti >= 0 ? (r[ti] ?? '').trim() : '', key: keyIdx >= 0 ? r[keyIdx]?.trim() : undefined }))
    .filter((s) => s.source)
  return { format: 'CSV', segments, hasTargets: segments.some((s) => s.target), warnings }
}

function parseTXT(text: string): ParsedFile {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const tabbed = lines.filter((l) => l.includes('\t')).length > lines.length / 2
  const segments = lines.map((l) => {
    if (tabbed) {
      const [s, t] = l.split('\t')
      return { source: (s ?? '').trim(), target: (t ?? '').trim() }
    }
    return { source: l, target: '' }
  })
  return { format: 'TXT', segments, hasTargets: tabbed, warnings: tabbed ? [] : ['Plain text detected: each line is imported as an untranslated source segment.'] }
}

function flattenJSON(obj: unknown, prefix = '', out: { key: string; value: string }[] = []) {
  if (typeof obj === 'string') out.push({ key: prefix, value: obj })
  else if (obj && typeof obj === 'object' && !Array.isArray(obj)) for (const [k, v] of Object.entries(obj)) flattenJSON(v, prefix ? `${prefix}.${k}` : k, out)
  return out
}

function parseJSON(text: string): ParsedFile {
  const data = JSON.parse(text.replace(/^﻿/, '')) as unknown
  // Array of { source, target } objects
  if (Array.isArray(data)) {
    const segments = data
      .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
      .map((x) => ({ source: String(x.source ?? x.src ?? x.en ?? ''), target: String(x.target ?? x.translation ?? ''), key: x.key ? String(x.key) : x.id ? String(x.id) : undefined }))
      .filter((s) => s.source)
    return { format: 'JSON', segments, hasTargets: segments.some((s) => s.target), warnings: [] }
  }
  // { key: { source, target } }
  if (data && typeof data === 'object') {
    const values = Object.values(data as Record<string, unknown>)
    if (values.length && values.every((v) => v && typeof v === 'object' && 'source' in (v as object))) {
      const segments = Object.entries(data as Record<string, { source: string; target?: string }>).map(([key, v]) => ({ key, source: String(v.source), target: String(v.target ?? '') }))
      return { format: 'JSON', segments, hasTargets: segments.some((s) => s.target), warnings: [] }
    }
  }
  // i18n key-value (possibly nested) — source strings only
  const flat = flattenJSON(data)
  return { format: 'JSON', segments: flat.map((f) => ({ key: f.key, source: f.value, target: '' })), hasTargets: false, warnings: ['Key-value i18n file detected: values are imported as source strings.'] }
}

function parseXLIFF(text: string): ParsedFile {
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length) throw new Error('The XLIFF file is not valid XML.')
  const units = [...Array.from(doc.getElementsByTagName('trans-unit')), ...Array.from(doc.getElementsByTagName('segment'))]
  const segments = units
    .map((u) => {
      const src = u.getElementsByTagName('source')[0]?.textContent ?? ''
      const tgt = u.getElementsByTagName('target')[0]?.textContent ?? ''
      const key = u.getAttribute('id') ?? u.parentElement?.getAttribute('id') ?? undefined
      return { source: src.trim(), target: tgt.trim(), key }
    })
    .filter((s) => s.source)
  return { format: 'XLIFF', segments, hasTargets: segments.some((s) => s.target), warnings: segments.length ? [] : ['No <trans-unit> or <segment> elements found.'] }
}

export async function parseImportFile(file: File): Promise<ParsedFile> {
  const text = await file.text()
  const ext = extensionOf(file.name)
  let parsed: ParsedFile
  if (ext === 'csv') parsed = parseCSV(text)
  else if (ext === 'txt') parsed = parseTXT(text)
  else if (ext === 'json') {
    try {
      parsed = parseJSON(text)
    } catch {
      throw new Error('The JSON file could not be parsed.')
    }
  } else parsed = parseXLIFF(text)
  if (parsed.segments.length > MAX_SEGMENTS) {
    parsed.warnings.push(`Only the first ${MAX_SEGMENTS} segments were imported (demo limit).`)
    parsed.segments = parsed.segments.slice(0, MAX_SEGMENTS)
  }
  return parsed
}

/** Sample files so the import flow can be demonstrated without preparing a file. */
export function buildSampleFile(kind: 'csv' | 'xliff' | 'json' | 'txt'): File {
  const rows: [string, string][] = [
    ['Welcome to Nova Rewards', 'Bienvenue chez Nova Rewards'],
    ['Earn {points} points on every order.', 'Gagnez des points sur chaque commande.'],
    ['Free shipping on orders over €40.', 'Livraison gratuite dès 40 € d’achat.'],
    ['Redeem your points at checkout.', 'Utilisez vos points lors du paiement.'],
    ['Your reward expires in 30 days.', 'Votre récompense expire dans 60 jours.'],
    ['View your wishlist', 'Voir vos favoris'],
    ['Need help? Chat with us', "Besoin d'aide ? Discutez avec nous"],
    ['Points cannot be transferred.', 'Les points peuvent être transférés.'],
  ]
  let content = ''
  let type = 'text/plain'
  if (kind === 'csv') {
    content = 'source,target\n' + rows.map(([s, t]) => `"${s.replace(/"/g, '""')}","${t.replace(/"/g, '""')}"`).join('\n')
    type = 'text/csv'
  } else if (kind === 'json') {
    content = JSON.stringify(rows.map(([source, target], i) => ({ key: `rewards.${i + 1}`, source, target })), null, 2)
    type = 'application/json'
  } else if (kind === 'xliff') {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    content = `<?xml version="1.0" encoding="UTF-8"?>\n<xliff version="1.2"><file source-language="en" target-language="fr" datatype="plaintext" original="rewards.json"><body>\n${rows
      .map(([s, t], i) => `<trans-unit id="r${i + 1}"><source>${esc(s)}</source><target>${esc(t)}</target></trans-unit>`)
      .join('\n')}\n</body></file></xliff>`
    type = 'application/xml'
  } else content = rows.map(([s, t]) => `${s}\t${t}`).join('\n')
  return new File([content], `nova_rewards_sample.${kind}`, { type })
}
