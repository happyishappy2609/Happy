import { describe, expect, it } from 'vitest'
import { buildSeedData } from '@/data/seed'
import { projectSeeds } from '@/data/seed/projects'
import { latentSeeds } from '@/data/seed/issues'
import { analyzeSegments } from '@/services/qa/demoQAEngine'
import { runRuleChecks } from '@/services/qa/rules'
import { applyScanResult, segmentCountFor } from '@/services/scanService'
import { computeProjectStats, isOpen } from '@/utils/quality'
import type { ScanConfig } from '@/types'

const data = buildSeedData()
const statsFor = (d: typeof data, id: string) => computeProjectStats(d.projects.find((p) => p.id === id)!, d.issues, segmentCountFor(d, id))

const baseConfig = (projectId: string, lang: ScanConfig['lang']): ScanConfig => ({
  projectId, lang, rules: [...data.settings.defaultRules], sensitivity: 'balanced', useClientGlossary: true, useProjectTerminology: true, checkStyleGuide: true, prioritizeCritical: true,
})

describe('seed data consistency', () => {
  it('has enough records', () => {
    expect(data.projects.length).toBeGreaterThanOrEqual(12)
    expect(data.issues.length).toBeGreaterThanOrEqual(40)
    expect(data.team.length).toBeGreaterThanOrEqual(8)
    expect(data.glossary.length).toBeGreaterThanOrEqual(20)
    expect(data.tm.length).toBeGreaterThanOrEqual(30)
    expect(data.activities.length).toBeGreaterThanOrEqual(15)
    expect(data.clients.length).toBeGreaterThanOrEqual(5)
  })

  it('every project starts at its reference score with non-negative residual', () => {
    for (const ps of projectSeeds) {
      const p = data.projects.find((x) => x.id === ps.id)!
      const st = statsFor(data, ps.id)
      expect(p.qualityResidual, ps.id).toBeGreaterThanOrEqual(0)
      expect(st.score, ps.id).toBeCloseTo(ps.score, 1)
    }
  })

  it('matches dashboard reference KPIs', () => {
    const active = data.projects.filter((p) => p.status === 'active' || p.status === 'in_review')
    expect(active.length).toBe(24)
    const crit = data.issues.filter((i) => isOpen(i) && i.severity === 'critical').length
    expect(crit).toBe(18)
    const avg = active.reduce((s, p) => s + statsFor(data, p.id).score, 0) / active.length
    expect(Math.round(avg * 10) / 10).toBe(94.2)
  })

  it('example projects have the expected risk levels', () => {
    expect(statsFor(data, 'p-aurora-app').risk).toBe('low')
    expect(statsFor(data, 'p-nova-ecom').risk).toBe('high')
    expect(statsFor(data, 'p-finedge-platform').risk).toBe('low')
    expect(statsFor(data, 'p-helix-health').risk).toBe('medium')
    expect(statsFor(data, 'p-orbit-gaming').risk).toBe('medium')
  })

  it('Nova has 120 segments', () => {
    expect(data.segments.filter((s) => s.projectId === 'p-nova-ecom').length).toBe(120)
  })

  it('rule checks only flag known defects', () => {
    const known = new Set([
      ...data.issues.filter((i) => i.status !== 'resolved').map((i) => `${i.segmentId}:${i.category}`),
    ])
    const latentKeys = new Set(
      latentSeeds.map((l) => {
        const seg = data.segments.find((s) => s.projectId === l.projectId && s.lang === l.lang && s.source === l.source)!
        return `${seg.id}:${l.category}`
      }),
    )
    const unexpected: string[] = []
    for (const seg of data.segments) {
      const p = data.projects.find((x) => x.id === seg.projectId)!
      for (const f of runRuleChecks(seg, data.glossary, p.clientId)) {
        if (!known.has(f.key) && !latentKeys.has(f.key)) unexpected.push(`${f.key} [${f.ruleId}] ${seg.source} => ${seg.target}`)
      }
    }
    expect(unexpected).toEqual([])
  })
})

describe('demo QA scan — Nova E-commerce', () => {
  it('finds 23 issues and scores 87.4', () => {
    const cfg = baseConfig('p-nova-ecom', 'fr')
    const out = analyzeSegments({ project: data.projects.find((p) => p.id === 'p-nova-ecom')!, segments: data.segments, glossary: data.glossary, config: cfg, existingIssues: data.issues })
    expect(out.totalSegments).toBe(120)
    expect(out.findings.length).toBe(23)
    const { data: next, scan } = applyScanResult(data, cfg, { ...out, durationMs: 5600 }, 'u-alex')
    expect(scan.summary.issuesDetected).toBe(23)
    expect(scan.summary.severity).toEqual({ critical: 2, major: 8, minor: 10, info: 3 })
    expect(scan.summary.score).toBe(87.4)
    expect(scan.summary.newIssues).toBe(13)
    expect(scan.summary.rating).toBe('Needs Review')
    expect(statsFor(next, 'p-nova-ecom').score).toBe(87.4)
    // Re-running the scan is deterministic and creates no duplicates.
    const out2 = analyzeSegments({ project: next.projects.find((p) => p.id === 'p-nova-ecom')!, segments: next.segments, glossary: next.glossary, config: cfg, existingIssues: next.issues })
    const { scan: scan2 } = applyScanResult(next, cfg, { ...out2, durationMs: 5600 }, 'u-alex')
    expect(scan2.summary.issuesDetected).toBe(23)
    expect(scan2.summary.newIssues).toBe(0)
  })

  it('strict sensitivity surfaces 2 extra style suggestions', () => {
    const cfg = { ...baseConfig('p-nova-ecom', 'fr'), sensitivity: 'strict' as const }
    const out = analyzeSegments({ project: data.projects.find((p) => p.id === 'p-nova-ecom')!, segments: data.segments, glossary: data.glossary, config: cfg, existingIssues: data.issues })
    expect(out.findings.length).toBe(25)
  })
})
