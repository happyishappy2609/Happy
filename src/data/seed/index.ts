import type {
  Activity,
  AppNotification,
  Client,
  GlossaryTerm,
  Integration,
  Issue,
  LangCode,
  Project,
  ProjectFile,
  QAScan,
  Segment,
  Severity,
  TeamMember,
  TMUnit,
  WorkspaceSettings,
} from '@/types'
import { computeProjectStats, penaltyFactor, issuePenalty, round1, scanRating, scanRisk } from '@/utils/quality'
import { createRng, hashString } from '@/utils/random'
import { seedClients } from './clients'
import { CORPUS, NOVA_CATALOG_TEMPLATES, NOVA_PRODUCTS } from './corpus'
import { issueSeeds, latentSeeds } from './issues'
import { buildActivities, buildIntegrations, buildNotifications, defaultSettings } from './misc'
import { projectSeeds } from './projects'
import { seedTeam } from './team'
import { buildGlossary, buildTM } from './terminology'

export interface AppData {
  clients: Client[]
  team: TeamMember[]
  projects: Project[]
  segments: Segment[]
  issues: Issue[]
  scans: QAScan[]
  glossary: GlossaryTerm[]
  tm: TMUnit[]
  activities: Activity[]
  notifications: AppNotification[]
  integrations: Integration[]
  files: ProjectFile[]
  settings: WorkspaceSettings
  seededAt: number
}

const DAY = 86_400_000
const NOVA_SEGMENTS = 120

function shuffle<T>(arr: T[], seed: number) {
  const rng = createRng(seed)
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function atHour(ts: number, hour: number, minute = 0) {
  const d = new Date(ts)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export function buildSeedData(nowDate = new Date()): AppData {
  const now = nowDate.getTime()
  const clients = structuredClone(seedClients)
  const team = structuredClone(seedTeam)

  // ── Projects ────────────────────────────────────────────────────────────────
  const projects: Project[] = projectSeeds.map((p, i) => {
    const client = clients.find((c) => c.id === p.clientId)!
    return {
      id: p.id,
      code: `NSL-${2401 + i}`,
      name: p.name,
      clientId: p.clientId,
      sourceLang: 'en',
      targetLangs: p.targets,
      words: p.words,
      translationProgress: p.tp,
      reviewProgress: p.rp,
      status: p.status,
      type: p.type,
      pmId: p.pm,
      translatorIds: p.translators,
      reviewerIds: p.reviewers,
      deadline: atHour(now + p.deadlineDays * DAY, 17),
      startDate: atHour(now - p.startDaysAgo * DAY, 9),
      createdAt: atHour(now - p.startDaysAgo * DAY, 9, 30),
      qualityThreshold: client.qualityTarget,
      qualityResidual: 0,
      residualLangs: [...p.targets],
      qualityHistory: [],
      description: p.description,
      tags: p.tags,
      pinned: i < 5,
    }
  })

  // ── Segments ────────────────────────────────────────────────────────────────
  const segments: Segment[] = []
  for (const p of projects) {
    for (const lang of p.targetLangs) {
      type Entry = { source: string; target: string; flagged: boolean }
      const entries: Entry[] = []
      const seen = new Set<string>()
      for (const s of issueSeeds) {
        if (s[0] !== p.id || s[1] !== lang || seen.has(s[5])) continue
        seen.add(s[5])
        const status = s[9]?.status ?? 'open'
        const resolvedByEdit = status === 'resolved' && s[9]?.resolution !== 'manual'
        entries.push({ source: s[5], target: resolvedByEdit ? s[7] : s[6], flagged: !resolvedByEdit })
      }
      for (const l of latentSeeds) {
        if (l.projectId !== p.id || l.lang !== lang || seen.has(l.source)) continue
        seen.add(l.source)
        entries.push({ source: l.source, target: l.target, flagged: true })
      }
      for (const [src, tr] of CORPUS) {
        const t = tr[lang]
        if (t && !seen.has(src)) {
          seen.add(src)
          entries.push({ source: src, target: t, flagged: false })
        }
      }
      if (p.id === 'p-nova-ecom') {
        outer: for (const [en, fr] of NOVA_CATALOG_TEMPLATES) {
          for (const prod of NOVA_PRODUCTS) {
            if (entries.length >= NOVA_SEGMENTS) break outer
            entries.push({ source: en.replace('{P}', prod), target: fr.replace('{P}', prod), flagged: false })
          }
        }
      }
      const ordered = shuffle(entries, hashString(`${p.id}-${lang}`))
      const reviewedCut = Math.round((p.reviewProgress / 100) * ordered.length)
      ordered.forEach((e, idx) => {
        const n = idx + 1
        segments.push({
          id: `${p.code}-${lang.toUpperCase()}-${String(n).padStart(3, '0')}`,
          projectId: p.id,
          lang,
          index: n,
          source: e.source,
          target: e.target,
          status: p.status === 'completed' ? 'approved' : !e.flagged && idx < reviewedCut ? 'reviewed' : 'translated',
        })
      })
    }
  }

  const segmentOf = (projectId: string, lang: LangCode, source: string) =>
    segments.find((s) => s.projectId === projectId && s.lang === lang && s.source === source)!

  // ── Issues ──────────────────────────────────────────────────────────────────
  const issues: Issue[] = issueSeeds.map((s, i) => {
    const [projectId, lang, severity, category, confidence, source, target, suggestion, explanation, x = {}] = s
    const seg = segmentOf(projectId, lang, source)
    const createdTs = now - (x.daysAgo ?? 2) * DAY - ((i * 37) % 600) * 60_000
    const status = x.status ?? 'open'
    const resolvedTs = x.resolvedDaysAgo !== undefined ? now - x.resolvedDaysAgo * DAY - ((i * 53) % 480) * 60_000 : undefined
    const detectedBy = x.detectedBy ?? 'ai'
    const history: Issue['history'] = [
      { at: new Date(createdTs).toISOString(), by: detectedBy === 'reviewer' ? (x.assignee ?? 'm-claire') : 'system', action: detectedBy === 'reviewer' ? 'Reported by reviewer' : detectedBy === 'rule' ? 'Detected by rule-based QA check' : 'Detected by AI QA scan' },
    ]
    if (x.assignee) history.push({ at: new Date(createdTs + 3_600_000).toISOString(), by: 'u-alex', action: 'Assigned', note: x.assignee })
    if (status === 'resolved' && resolvedTs) history.push({ at: new Date(resolvedTs).toISOString(), by: x.assignee ?? 'u-alex', action: x.resolution === 'accepted' ? 'Accepted AI suggestion' : x.resolution === 'edited' ? 'Edited translation and resolved' : 'Marked resolved' })
    if (status === 'ignored' && resolvedTs) history.push({ at: new Date(resolvedTs).toISOString(), by: x.assignee ?? 'u-alex', action: 'Ignored', note: x.ignoreReason })
    return {
      id: `QA-${1001 + i}`,
      projectId,
      segmentId: seg.id,
      lang,
      category,
      severity,
      confidence,
      source,
      target,
      suggestion,
      explanation,
      preferredTerm: x.preferredTerm,
      targetSpan: x.targetSpan,
      sourceSpan: x.sourceSpan,
      status,
      assigneeId: x.assignee,
      createdAt: new Date(createdTs).toISOString(),
      resolvedAt: resolvedTs ? new Date(resolvedTs).toISOString() : undefined,
      resolution: status === 'resolved' ? (x.resolution ?? 'manual') : undefined,
      ignoreReason: x.ignoreReason,
      detectedBy,
      ruleId: x.ruleId,
      history,
    }
  })

  // ── Residual penalty so each project starts at its reference score ────────
  const segCount = (pid: string) => segments.filter((s) => s.projectId === pid).length
  projectSeeds.forEach((ps, i) => {
    const p = projects[i]!
    const open = issues.filter((x) => x.projectId === p.id && (x.status === 'open' || x.status === 'in_review'))
    const penalty = issuePenalty(open) * penaltyFactor(segCount(p.id))
    p.qualityResidual = Math.max(0, 100 - ps.score - penalty)
    const rng = createRng(hashString(p.id))
    const points = 5
    const declining = p.id === 'p-nova-ecom'
    const hist: Project['qualityHistory'] = []
    const startTs = new Date(p.startDate).getTime()
    const endTs = Math.min(now - 0.2 * DAY, new Date(p.deadline).getTime())
    for (let k = 0; k < points; k++) {
      const ts = startTs + ((endTs - startTs) * (k + 1)) / points
      const back = points - 1 - k
      const drift = declining ? back * 1.25 : (rng() - 0.45) * 2.2 * back * 0.5
      const score = k === points - 1 ? ps.score : round1(Math.min(99.6, Math.max(80, ps.score + drift)))
      hist.push({ date: new Date(ts).toISOString(), score, label: k === points - 1 ? 'Latest' : `Scan ${k + 1}` })
    }
    p.qualityHistory = hist
  })

  // ── Seeded scans (history) ─────────────────────────────────────────────────
  const scanDefs: [projectId: string, lang: LangCode, hoursAgo: number, by: string][] = [
    ['p-aurora-app', 'de', 0.6, 'u-alex'],
    ['p-orbit-gaming', 'ko', 8.4, 'm-emma'],
    ['p-nova-ecom', 'fr', 40, 'u-alex'],
    ['p-helix-health', 'es', 50, 'm-priya'],
    ['p-finedge-platform', 'ja', 120, 'm-kenji'],
    ['p-helix-portal', 'pt', 20, 'm-priya'],
  ]
  const scans: QAScan[] = scanDefs.map(([projectId, lang, h, by], i) => {
    const p = projects.find((x) => x.id === projectId)!
    const completedTs = now - h * 3_600_000
    // A scan only reports issues that were still open when it ran.
    const own = issues.filter((x) => x.projectId === projectId && x.lang === lang && x.detectedBy !== 'reviewer' && new Date(x.createdAt).getTime() <= completedTs && (x.status === 'open' || (x.resolvedAt && new Date(x.resolvedAt).getTime() > completedTs)))
    const sev: Record<Severity, number> = { critical: 0, major: 0, minor: 0, info: 0 }
    const cats: QAScan['summary']['categories'] = {}
    for (const x of own) {
      sev[x.severity]++
      cats[x.category] = (cats[x.category] ?? 0) + 1
    }
    const segs = segments.filter((s) => s.projectId === projectId && s.lang === lang)
    const stats = computeProjectStats(p, issues, segCount(projectId))
    const score = stats.langScores[lang] ?? stats.score
    const completed = completedTs
    const id = `SC-${8101 + i}`
    for (const x of own) if (!x.scanId) x.scanId = id
    return {
      id,
      projectId,
      lang,
      startedAt: new Date(completed - 6_000).toISOString(),
      completedAt: new Date(completed).toISOString(),
      config: {
        projectId,
        lang,
        rules: [...defaultSettings.defaultRules],
        sensitivity: 'balanced',
        useClientGlossary: true,
        useProjectTerminology: true,
        checkStyleGuide: true,
        prioritizeCritical: true,
      },
      summary: {
        score,
        rating: scanRating(score, p.qualityThreshold),
        totalSegments: segs.length,
        wordsAnalyzed: segs.reduce((s, x) => s + x.source.split(/\s+/).length, 0),
        issuesDetected: own.length,
        newIssues: own.length,
        carriedOver: 0,
        severity: sev,
        categories: cats,
        risk: scanRisk(score, p.qualityThreshold, sev.critical),
        reviewMinutesSaved: Math.round(segs.length * 0.9 + own.length * 4),
        durationMs: 5600,
      },
      issueIds: own.map((x) => x.id),
      engine: 'AI QA simulation (demo engine)',
      triggeredBy: by,
    }
  })

  // ── Files ───────────────────────────────────────────────────────────────────
  const files: ProjectFile[] = []
  for (const p of projects) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
    const created = new Date(p.createdAt).getTime()
    const segs = segCount(p.id)
    files.push({ id: `f-${p.id}-src`, projectId: p.id, name: `${slug}_source_en.xliff`, format: 'XLIFF', sizeKb: Math.round(p.words / 9), segments: Math.round(segs / p.targetLangs.length), uploadedAt: new Date(created + 1_800_000).toISOString(), uploadedBy: p.pmId, kind: 'source' })
    for (const l of p.targetLangs) {
      files.push({ id: `f-${p.id}-${l}`, projectId: p.id, name: `${slug}_${l}.xliff`, format: 'XLIFF', sizeKb: Math.round(p.words / 8), segments: segments.filter((s) => s.projectId === p.id && s.lang === l).length, uploadedAt: new Date(created + (3 + p.targetLangs.indexOf(l)) * DAY).toISOString(), uploadedBy: p.translatorIds[0] ?? p.pmId, kind: 'translation' })
    }
    files.push({ id: `f-${p.id}-sg`, projectId: p.id, name: `${clients.find((c) => c.id === p.clientId)!.name.replace(/\s+/g, '_')}_Style_Guide.pdf`, format: 'PDF', sizeKb: 840, segments: 0, uploadedAt: new Date(created + 600_000).toISOString(), uploadedBy: p.pmId, kind: 'reference' })
  }

  return {
    clients,
    team,
    projects,
    segments,
    issues,
    scans,
    glossary: buildGlossary(now),
    tm: buildTM(now),
    activities: buildActivities(now),
    notifications: buildNotifications(now),
    integrations: buildIntegrations(now),
    files,
    settings: structuredClone(defaultSettings),
    seededAt: now,
  }
}
