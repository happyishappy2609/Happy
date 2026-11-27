import { beforeEach, describe, expect, it } from 'vitest'
import { analyzeSegments } from '@/services/qa/demoQAEngine'
import { buildKeyRows, keyCompletion, toFlatJSON, toNestedJSON, validateKeyName } from '@/services/stringKeyService'
import { useAppStore } from '@/store/useAppStore'

const P = 'p-aurora-help' // EN → DE, FR, JA
const get = () => useAppStore.getState()
const row = (key: string) => buildKeyRows(get().projects.find((p) => p.id === P)!, get().segments).find((r) => r.key === key)

describe('string keys', () => {
  beforeEach(() => get().resetDemo())

  it('seeded segments all carry a key', () => {
    expect(get().segments.every((s) => !!s.key)).toBe(true)
  })

  it('validates key names', () => {
    const taken = new Set(['checkout.title'])
    expect(validateKeyName('', taken)).toMatch(/required/)
    expect(validateKeyName('checkout title', taken)).toMatch(/letters/)
    expect(validateKeyName('checkout..title', taken)).toMatch(/letters/)
    expect(validateKeyName('checkout.title', taken)).toMatch(/already exists/)
    expect(validateKeyName('checkout.title', taken, 'checkout.title')).toBeNull()
    expect(validateKeyName('checkout.cta-label_2', taken)).toBeNull()
  })

  it('creates a key with a segment per target language, then adds values', () => {
    get().addStringKey(P, { key: 'help.reset_title', source: 'Reset your device', maxLength: 20, values: { de: 'Gerät zurücksetzen' } })
    let r = row('help.reset_title')!
    expect(Object.keys(r.values).sort()).toEqual(['de', 'fr', 'ja'])
    expect(keyCompletion(r, ['de', 'fr', 'ja'])).toEqual({ done: 1, total: 3, complete: false })
    expect(r.values.fr!.status).toBe('draft')

    get().setKeyValue(P, 'help.reset_title', 'fr', 'Réinitialiser votre appareil')
    get().setKeyValue(P, 'help.reset_title', 'ja', 'デバイスをリセット')
    r = row('help.reset_title')!
    expect(keyCompletion(r, ['de', 'fr', 'ja']).complete).toBe(true)
    expect(r.values.fr!.status).toBe('translated')
  })

  it('renames, flags over-length values in QA, and deletes keys', () => {
    get().addStringKey(P, { key: 'help.cta', source: 'Contact support', maxLength: 10, values: { fr: 'Contacter le support technique' } })
    get().updateStringKey(P, 'help.cta', { key: 'help.contact_cta' })
    expect(row('help.cta')).toBeUndefined()
    expect(row('help.contact_cta')!.values.fr!.target).toBe('Contacter le support technique')

    const s = get()
    const out = analyzeSegments({
      project: s.projects.find((p) => p.id === P)!,
      segments: s.segments,
      glossary: s.glossary,
      existingIssues: s.issues,
      config: { projectId: P, lang: 'fr', rules: ['formatting'], sensitivity: 'balanced', useClientGlossary: true, useProjectTerminology: true, checkStyleGuide: true, prioritizeCritical: true },
    })
    expect(out.findings.some((f) => f.ruleId === 'max-length' && f.segmentId === row('help.contact_cta')!.values.fr!.id)).toBe(true)

    get().deleteStringKey(P, 'help.contact_cta')
    expect(row('help.contact_cta')).toBeUndefined()
  })

  it('imports values by key and exports flat and nested JSON', () => {
    const existing = buildKeyRows(get().projects.find((p) => p.id === P)!, get().segments)[0]!
    const r = get().importStringKeys(P, [{ key: existing.key, source: '', target: 'Neuer Wert' }, { key: 'help.new_one', source: 'New one', target: '' }], 'de')
    expect(r).toEqual({ created: 1, updated: 1 })
    expect(row(existing.key)!.values.de!.target).toBe('Neuer Wert')
    const flat = toFlatJSON([row(existing.key)!], 'de')
    expect(flat[existing.key]).toBe('Neuer Wert')
    expect(toNestedJSON({ 'a.b.c': 'x', 'a.d': 'y' })).toEqual({ a: { b: { c: 'x' }, d: 'y' } })
  })
})
