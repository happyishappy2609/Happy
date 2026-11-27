import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { buildSeedData, type AppData } from '@/data/seed'
import { CURRENT_USER } from '@/data/seed/team'
import type { QAScanOutput } from '@/services/qa/types'
import { applyScanResult } from '@/services/scanService'
import { suggestKey, uniqueKey } from '@/services/stringKeyService'
import { safeStorage } from '@/services/storageService'
import type {
  AccessRole,
  Activity,
  ActivityType,
  AppNotification,
  Client,
  GlossaryTerm,
  Issue,
  LangCode,
  NotificationKind,
  Project,
  ProjectFile,
  QAScan,
  ScanConfig,
  Segment,
  TeamMember,
  TMUnit,
  WorkspaceSettings,
} from '@/types'
import { uid } from '@/utils/random'

export type ThemeMode = 'light' | 'dark' | 'system'

export type DemoStep = 'dashboard' | 'openNova' | 'runScan' | 'reviewFinding' | 'acceptFix' | 'analytics' | 'terminology' | 'close'

export interface ScanDialogState {
  open: boolean
  projectId?: string
  lang?: LangCode
}

interface UIState {
  signedIn: boolean
  viewAs: AccessRole
  theme: ThemeMode
  demoSteps: DemoStep[]
  demoGuideOpen: boolean
  scanDialog: ScanDialogState
  createProjectOpen: boolean
  importOpen: boolean
  lastScanId?: string
}

export interface NewProjectInput {
  name: string
  clientId: string
  sourceLang: LangCode
  targetLangs: LangCode[]
  words: number
  pmId: string
  deadline: string
  qualityThreshold: number
  type: Project['type']
  description?: string
}

export interface ImportedSegment {
  source: string
  target: string
  key?: string
}

export interface StringKeyInput {
  key: string
  source: string
  note?: string
  maxLength?: number
  values: Partial<Record<LangCode, string>>
}

interface Actions {
  signIn: () => void
  signOut: () => void
  setViewAs: (role: AccessRole) => void
  setTheme: (t: ThemeMode) => void
  markDemoStep: (s: DemoStep) => void
  setDemoGuideOpen: (open: boolean) => void
  openScanDialog: (opts?: Omit<ScanDialogState, 'open'>) => void
  closeScanDialog: () => void
  setCreateProjectOpen: (open: boolean) => void
  setImportOpen: (open: boolean) => void

  createProject: (input: NewProjectInput, segmentsByLang?: Partial<Record<LangCode, ImportedSegment[]>>, file?: Pick<ProjectFile, 'name' | 'format' | 'sizeKb'>) => string
  updateProject: (id: string, patch: Partial<Project>) => void
  deleteProject: (id: string) => void
  addProjectFile: (projectId: string, file: Omit<ProjectFile, 'id' | 'projectId' | 'uploadedAt' | 'uploadedBy'>) => void
  importTranslations: (projectId: string, lang: LangCode, segs: ImportedSegment[], file: Pick<ProjectFile, 'name' | 'format' | 'sizeKb'>) => { updated: number; added: number }
  addStringKey: (projectId: string, input: StringKeyInput, opts?: { silent?: boolean }) => void
  updateStringKey: (projectId: string, key: string, patch: { key?: string; source?: string; note?: string; maxLength?: number }) => void
  setKeyValue: (projectId: string, key: string, lang: LangCode, value: string) => void
  deleteStringKey: (projectId: string, key: string) => void
  importStringKeys: (projectId: string, rows: ImportedSegment[], lang: LangCode | null) => { created: number; updated: number }
  assignReviewer: (projectId: string, memberId: string) => void
  removeReviewer: (projectId: string, memberId: string) => void

  applyScan: (config: ScanConfig, output: QAScanOutput) => QAScan

  editSegment: (segmentId: string, target: string) => void
  acceptSuggestion: (issueId: string) => void
  resolveIssue: (issueId: string, note?: string, resolution?: Issue['resolution']) => void
  ignoreIssue: (issueId: string, reason: string) => void
  reopenIssue: (issueId: string) => void
  assignIssue: (issueId: string, memberId: string | undefined) => void
  setIssueInReview: (issueId: string) => void
  bulkResolve: (ids: string[]) => void
  bulkAssign: (ids: string[], memberId: string) => void
  editIssueTarget: (issueId: string, target: string) => void

  addTerm: (t: Omit<GlossaryTerm, 'id' | 'updatedAt' | 'updatedBy'>) => void
  updateTerm: (id: string, patch: Partial<GlossaryTerm>) => void
  deleteTerm: (id: string) => void
  importTerms: (terms: Omit<GlossaryTerm, 'id' | 'updatedAt' | 'updatedBy'>[]) => number

  addTM: (u: Omit<TMUnit, 'id' | 'updatedAt' | 'updatedBy' | 'usageCount'>) => void
  updateTM: (id: string, patch: Partial<TMUnit>) => void
  deleteTM: (id: string) => void

  updateClient: (id: string, patch: Partial<Client>) => void
  updateMember: (id: string, patch: Partial<TeamMember>) => void
  inviteMember: (m: Pick<TeamMember, 'name' | 'email' | 'role' | 'accessRole' | 'languages'>) => void

  connectIntegration: (id: string) => void
  disconnectIntegration: (id: string) => void
  toggleWaitlist: (id: string) => void

  updateSettings: (patch: Partial<WorkspaceSettings>) => void

  notify: (kind: NotificationKind, title: string, body: string, link?: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  logActivity: (type: ActivityType, message: string, projectId?: string, actorId?: string) => void

  resetDemo: () => void
}

export type AppState = AppData & UIState & Actions

const initialUI: UIState = {
  signedIn: false,
  viewAs: 'admin',
  theme: 'light',
  demoSteps: [],
  demoGuideOpen: false,
  scanDialog: { open: false },
  createProjectOpen: false,
  importOpen: false,
}

const nowIso = () => new Date().toISOString()
const ME = CURRENT_USER.id

function patchIssue(issues: Issue[], id: string, fn: (i: Issue) => Issue) {
  return issues.map((i) => (i.id === id ? fn(i) : i))
}

export const STORAGE_KEY = 'lingopilot-demo'
export const STORAGE_VERSION = 4

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const activity = (type: ActivityType, message: string, projectId?: string, actorId = ME): Activity => ({
        id: uid('a'),
        type,
        actorId,
        message,
        projectId,
        at: nowIso(),
      })
      const pushActivity = (a: Activity) => set((s) => ({ activities: [a, ...s.activities].slice(0, 300) }))

      return {
        ...buildSeedData(),
        ...initialUI,

        signIn: () => set({ signedIn: true }),
        signOut: () => set({ signedIn: false }),
        setViewAs: (viewAs) => set({ viewAs }),
        setTheme: (theme) => set({ theme }),
        markDemoStep: (step) => set((s) => (s.demoSteps.includes(step) ? s : { demoSteps: [...s.demoSteps, step] })),
        setDemoGuideOpen: (demoGuideOpen) => set({ demoGuideOpen }),
        openScanDialog: (opts) => set({ scanDialog: { open: true, ...opts } }),
        closeScanDialog: () => set((s) => ({ scanDialog: { ...s.scanDialog, open: false } })),
        setCreateProjectOpen: (createProjectOpen) => set({ createProjectOpen }),
        setImportOpen: (importOpen) => set({ importOpen }),

        createProject: (input, segmentsByLang, file) => {
          const s = get()
          const maxCode = s.projects.reduce((m, p) => Math.max(m, Number(p.code.split('-')[1]) || 0), 2400)
          const code = `NSL-${maxCode + 1}`
          const id = `p-${uid('new').slice(4)}`
          const client = s.clients.find((c) => c.id === input.clientId)
          const reviewers = s.team.filter((m) => (m.role === 'Reviewer' || m.role === 'Senior Reviewer') && m.languages.some((l) => input.targetLangs.includes(l)))
          const translators = s.team.filter((m) => m.role === 'Translator' && m.languages.some((l) => input.targetLangs.includes(l)))
          const project: Project = {
            id,
            code,
            name: input.name.trim(),
            clientId: input.clientId,
            sourceLang: input.sourceLang,
            targetLangs: input.targetLangs,
            words: input.words,
            translationProgress: segmentsByLang ? 100 : 0,
            reviewProgress: 0,
            status: 'active',
            type: input.type,
            pmId: input.pmId,
            translatorIds: translators.slice(0, 2).map((m) => m.id),
            reviewerIds: reviewers.slice(0, 1).map((m) => m.id),
            deadline: input.deadline,
            startDate: nowIso(),
            createdAt: nowIso(),
            qualityThreshold: input.qualityThreshold || client?.qualityTarget || s.settings.defaultThreshold,
            qualityResidual: 0,
            residualLangs: [],
            qualityHistory: [],
            description: input.description,
            tags: ['New'],
          }
          const segments: Segment[] = []
          const takenKeys = new Set<string>()
          const keyBySource = new Map<string, string>()
          const keyOf = (r: ImportedSegment) => {
            const existing = keyBySource.get(r.source)
            if (existing) return existing
            const k = r.key && /^[A-Za-z0-9_.-]+$/.test(r.key) && !takenKeys.has(r.key) ? (takenKeys.add(r.key), r.key) : suggestKey(r.source, 'strings', takenKeys)
            takenKeys.add(k)
            keyBySource.set(r.source, k)
            return k
          }
          for (const lang of input.targetLangs) {
            const rows = segmentsByLang?.[lang] ?? []
            rows.forEach((r, i) =>
              segments.push({
                id: `${code}-${lang.toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
                projectId: id,
                lang,
                index: i + 1,
                source: r.source,
                target: r.target,
                status: r.target.trim() ? 'translated' : 'draft',
                key: keyOf(r),
              }),
            )
          }
          const files: ProjectFile[] = file
            ? [{ id: uid('f'), projectId: id, name: file.name, format: file.format, sizeKb: file.sizeKb, segments: segments.length, uploadedAt: nowIso(), uploadedBy: ME, kind: segmentsByLang ? 'translation' : 'source' }]
            : []
          set((st) => ({ projects: [project, ...st.projects], segments: [...st.segments, ...segments], files: [...st.files, ...files] }))
          pushActivity(activity('project', `created project ${project.name} (${input.targetLangs.length} target ${input.targetLangs.length === 1 ? 'language' : 'languages'})`, id))
          return id
        },

        updateProject: (id, patch) => set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

        deleteProject: (id) => {
          const p = get().projects.find((x) => x.id === id)
          set((s) => ({
            projects: s.projects.filter((x) => x.id !== id),
            segments: s.segments.filter((x) => x.projectId !== id),
            issues: s.issues.filter((x) => x.projectId !== id),
            files: s.files.filter((x) => x.projectId !== id),
            scans: s.scans.filter((x) => x.projectId !== id),
          }))
          if (p) pushActivity(activity('project', `deleted project ${p.name}`))
        },

        addProjectFile: (projectId, file) => {
          set((s) => ({ files: [...s.files, { ...file, id: uid('f'), projectId, uploadedAt: nowIso(), uploadedBy: ME }] }))
          pushActivity(activity('project', `uploaded ${file.name}`, projectId))
        },

        importTranslations: (projectId, lang, rows, file) => {
          const s = get()
          const project = s.projects.find((p) => p.id === projectId)!
          let updated = 0
          let added = 0
          const existing = s.segments.filter((x) => x.projectId === projectId && x.lang === lang)
          const bySource = new Map(existing.map((x) => [x.source, x]))
          const byKey = new Map(existing.filter((x) => x.key).map((x) => [x.key!, x]))
          const projectKeys = new Set(s.segments.filter((x) => x.projectId === projectId && x.key).map((x) => x.key!))
          const keyForSource = new Map(s.segments.filter((x) => x.projectId === projectId && x.key).map((x) => [x.source, x.key!]))
          let maxIndex = existing.reduce((m, x) => Math.max(m, x.index), 0)
          const changed = new Map<string, string>()
          const newSegs: Segment[] = []
          for (const r of rows) {
            const seg = (r.key ? byKey.get(r.key) : undefined) ?? bySource.get(r.source)
            if (seg) {
              if (r.target && r.target !== seg.target) {
                changed.set(seg.id, r.target)
                updated++
              }
            } else {
              maxIndex++
              added++
              const key = keyForSource.get(r.source) ?? (r.key && !projectKeys.has(r.key) ? r.key : suggestKey(r.source, 'strings', projectKeys))
              projectKeys.add(key)
              keyForSource.set(r.source, key)
              newSegs.push({ id: `${project.code}-${lang.toUpperCase()}-${String(maxIndex).padStart(3, '0')}`, projectId, lang, index: maxIndex, source: r.source, target: r.target, status: r.target.trim() ? 'translated' : 'draft', key })
            }
          }
          set((st) => ({
            segments: [...st.segments.map((x) => (changed.has(x.id) ? { ...x, target: changed.get(x.id)!, editedAt: nowIso(), editedBy: ME, status: 'translated' as const } : x)), ...newSegs],
            projects: st.projects.map((p) => (p.id === projectId && !p.targetLangs.includes(lang) ? { ...p, targetLangs: [...p.targetLangs, lang] } : p)),
            files: [...st.files, { id: uid('f'), projectId, name: file.name, format: file.format, sizeKb: file.sizeKb, segments: rows.length, uploadedAt: nowIso(), uploadedBy: ME, kind: 'translation' }],
          }))
          pushActivity(activity('project', `uploaded translations ${file.name} — ${updated} updated, ${added} new segments`, projectId))
          return { updated, added }
        },

        addStringKey: (projectId, input, opts) => {
          const s = get()
          const project = s.projects.find((p) => p.id === projectId)
          if (!project) return
          const own = s.segments.filter((x) => x.projectId === projectId)
          const at = nowIso()
          const newSegs: Segment[] = project.targetLangs.map((lang) => {
            const idx = own.filter((x) => x.lang === lang).reduce((m, x) => Math.max(m, x.index), 0) + 1
            const value = input.values[lang]?.trim() ?? ''
            return {
              id: `${project.code}-${lang.toUpperCase()}-${String(idx).padStart(3, '0')}`,
              projectId,
              lang,
              index: idx,
              source: input.source.trim(),
              target: value,
              status: value ? 'translated' : 'draft',
              key: input.key.trim(),
              note: input.note?.trim() || undefined,
              maxLength: input.maxLength || undefined,
              editedAt: value ? at : undefined,
              editedBy: value ? ME : undefined,
            }
          })
          set((st) => ({ segments: [...st.segments, ...newSegs] }))
          if (!opts?.silent) pushActivity(activity('project', `created string key "${input.key.trim()}" in ${project.name}`, projectId))
        },

        updateStringKey: (projectId, key, patch) => {
          const at = nowIso()
          set((st) => ({
            segments: st.segments.map((x) => {
              if (x.projectId !== projectId || x.key !== key) return x
              const sourceChanged = patch.source !== undefined && patch.source.trim() !== x.source
              return {
                ...x,
                key: patch.key?.trim() ?? x.key,
                source: patch.source !== undefined ? patch.source.trim() : x.source,
                note: patch.note !== undefined ? patch.note.trim() || undefined : x.note,
                maxLength: patch.maxLength !== undefined ? patch.maxLength || undefined : x.maxLength,
                // A changed source needs its translations re-checked.
                status: sourceChanged && x.target ? 'translated' : x.status,
                editedAt: sourceChanged ? at : x.editedAt,
              }
            }),
          }))
          const p = get().projects.find((x) => x.id === projectId)
          pushActivity(activity('project', patch.key && patch.key !== key ? `renamed string key "${key}" to "${patch.key}"` : `updated string key "${key}"`, p?.id))
        },

        setKeyValue: (projectId, key, lang, value) => {
          const s = get()
          const project = s.projects.find((p) => p.id === projectId)
          if (!project) return
          const at = nowIso()
          const v = value.trim()
          const seg = s.segments.find((x) => x.projectId === projectId && x.key === key && x.lang === lang)
          if (seg) {
            set((st) => ({ segments: st.segments.map((x) => (x.id === seg.id ? { ...x, target: v, status: v ? 'translated' : 'draft', editedAt: at, editedBy: ME } : x)) }))
            return
          }
          const template = s.segments.find((x) => x.projectId === projectId && x.key === key)
          if (!template) return
          const idx = s.segments.filter((x) => x.projectId === projectId && x.lang === lang).reduce((m, x) => Math.max(m, x.index), 0) + 1
          set((st) => ({
            segments: [
              ...st.segments,
              { id: `${project.code}-${lang.toUpperCase()}-${String(idx).padStart(3, '0')}`, projectId, lang, index: idx, source: template.source, target: v, status: v ? 'translated' : 'draft', key, note: template.note, maxLength: template.maxLength, editedAt: at, editedBy: ME },
            ],
          }))
        },

        deleteStringKey: (projectId, key) => {
          const ids = new Set(get().segments.filter((x) => x.projectId === projectId && x.key === key).map((x) => x.id))
          set((st) => ({ segments: st.segments.filter((x) => !ids.has(x.id)), issues: st.issues.filter((i) => !ids.has(i.segmentId)) }))
          pushActivity(activity('project', `deleted string key "${key}"`, projectId))
        },

        importStringKeys: (projectId, rows, lang) => {
          const s = get()
          const project = s.projects.find((p) => p.id === projectId)
          if (!project) return { created: 0, updated: 0 }
          const existingKeys = new Set(s.segments.filter((x) => x.projectId === projectId && x.key).map((x) => x.key!))
          let created = 0
          let updated = 0
          const taken = new Set(existingKeys)
          for (const r of rows) {
            const key = r.key && /^[A-Za-z0-9_.-]+$/.test(r.key) ? r.key : uniqueKey(`strings.${r.source.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30)}`, taken)
            if (existingKeys.has(key)) {
              if (lang && r.target.trim()) {
                get().setKeyValue(projectId, key, lang, r.target)
                updated++
              } else if (!lang && r.source.trim()) {
                set((st) => ({ segments: st.segments.map((x) => (x.projectId === projectId && x.key === key && x.source !== r.source.trim() ? { ...x, source: r.source.trim() } : x)) }))
                updated++
              }
            } else {
              get().addStringKey(projectId, { key, source: r.source || r.target, values: lang ? { [lang]: r.target } : {} }, { silent: true })
              existingKeys.add(key)
              created++
            }
          }
          pushActivity(activity('project', `imported string keys — ${created} created, ${updated} updated`, projectId))
          return { created, updated }
        },

        assignReviewer: (projectId, memberId) => {
          const s = get()
          const m = s.team.find((x) => x.id === memberId)
          const p = s.projects.find((x) => x.id === projectId)
          if (!m || !p || p.reviewerIds.includes(memberId)) return
          set((st) => ({ projects: st.projects.map((x) => (x.id === projectId ? { ...x, reviewerIds: [...x.reviewerIds, memberId] } : x)) }))
          pushActivity(activity('assign', `assigned ${m.name} as reviewer on ${p.name}`, projectId))
          get().notify('reviewerActivity', 'Reviewer assigned', `${m.name} was assigned to ${p.name}.`, `/projects/${projectId}?tab=reviewers`)
        },

        removeReviewer: (projectId, memberId) => {
          const s = get()
          const m = s.team.find((x) => x.id === memberId)
          const p = s.projects.find((x) => x.id === projectId)
          set((st) => ({ projects: st.projects.map((x) => (x.id === projectId ? { ...x, reviewerIds: x.reviewerIds.filter((r) => r !== memberId) } : x)) }))
          if (m && p) pushActivity(activity('assign', `removed ${m.name} from ${p.name}`, projectId))
        },

        applyScan: (config, output) => {
          const s = get()
          const { data, scan } = applyScanResult(s, config, output, ME)
          const p = s.projects.find((x) => x.id === config.projectId)!
          set({ issues: data.issues, projects: data.projects, scans: data.scans, lastScanId: scan.id })
          pushActivity(activity('scan', `AI QA scan completed for ${p.name} (${config.lang.toUpperCase()}) — score ${scan.summary.score.toFixed(1)}, ${scan.summary.issuesDetected} issues`, p.id))
          get().notify('scanCompleted', 'QA scan completed', `${p.name} (${config.lang.toUpperCase()}) scored ${scan.summary.score.toFixed(1)} with ${scan.summary.issuesDetected} issues.`, `/quality?scan=${scan.id}`)
          if (scan.summary.severity.critical > 0)
            get().notify('criticalIssue', 'Critical issues detected', `${scan.summary.severity.critical} critical ${scan.summary.severity.critical === 1 ? 'issue' : 'issues'} in ${p.name}.`, `/issues?project=${p.id}&severity=critical`)
          return scan
        },

        editSegment: (segmentId, target) => {
          set((s) => ({ segments: s.segments.map((x) => (x.id === segmentId ? { ...x, target, editedAt: nowIso(), editedBy: ME, status: 'translated' } : x)) }))
        },

        acceptSuggestion: (issueId) => {
          const s = get()
          const issue = s.issues.find((i) => i.id === issueId)
          if (!issue || !issue.suggestion) return
          const at = nowIso()
          set((st) => ({
            segments: st.segments.map((x) => (x.id === issue.segmentId ? { ...x, target: issue.suggestion, editedAt: at, editedBy: ME, status: 'reviewed' } : x)),
            issues: patchIssue(st.issues, issueId, (i) => ({ ...i, status: 'resolved', resolution: 'accepted', resolvedAt: at, history: [...i.history, { at, by: ME, action: 'Accepted AI suggestion', note: i.suggestion }] })),
          }))
          get().markDemoStep('acceptFix')
          const p = s.projects.find((x) => x.id === issue.projectId)
          pushActivity(activity('resolve', `accepted the suggested correction for ${issue.id} in ${p?.name ?? 'a project'}`, issue.projectId))
        },

        resolveIssue: (issueId, note, resolution = 'manual') => {
          const at = nowIso()
          const issue = get().issues.find((i) => i.id === issueId)
          set((st) => ({ issues: patchIssue(st.issues, issueId, (i) => ({ ...i, status: 'resolved', resolution, resolvedAt: at, history: [...i.history, { at, by: ME, action: 'Marked resolved', note }] })) }))
          if (issue) pushActivity(activity('resolve', `resolved ${issue.id} (${issue.category})`, issue.projectId))
        },

        ignoreIssue: (issueId, reason) => {
          const at = nowIso()
          const issue = get().issues.find((i) => i.id === issueId)
          set((st) => ({ issues: patchIssue(st.issues, issueId, (i) => ({ ...i, status: 'ignored', ignoreReason: reason, resolvedAt: at, history: [...i.history, { at, by: ME, action: 'Ignored', note: reason }] })) }))
          if (issue) pushActivity(activity('resolve', `ignored ${issue.id}: ${reason}`, issue.projectId))
        },

        reopenIssue: (issueId) => {
          const at = nowIso()
          set((st) => ({ issues: patchIssue(st.issues, issueId, (i) => ({ ...i, status: 'open', resolvedAt: undefined, resolution: undefined, ignoreReason: undefined, history: [...i.history, { at, by: ME, action: 'Reopened' }] })) }))
        },

        assignIssue: (issueId, memberId) => {
          const at = nowIso()
          const s = get()
          const m = s.team.find((x) => x.id === memberId)
          set((st) => ({ issues: patchIssue(st.issues, issueId, (i) => ({ ...i, assigneeId: memberId, history: [...i.history, { at, by: ME, action: memberId ? 'Assigned' : 'Unassigned', note: memberId }] })) }))
          const issue = s.issues.find((i) => i.id === issueId)
          if (m && issue) pushActivity(activity('assign', `assigned ${issue.id} to ${m.name}`, issue.projectId))
        },

        setIssueInReview: (issueId) => {
          const at = nowIso()
          set((st) => ({ issues: patchIssue(st.issues, issueId, (i) => ({ ...i, status: 'in_review', history: [...i.history, { at, by: ME, action: 'Moved to In review' }] })) }))
        },

        bulkResolve: (ids) => {
          const at = nowIso()
          const set_ = new Set(ids)
          set((st) => ({ issues: st.issues.map((i) => (set_.has(i.id) && (i.status === 'open' || i.status === 'in_review') ? { ...i, status: 'resolved', resolution: 'bulk', resolvedAt: at, history: [...i.history, { at, by: ME, action: 'Resolved (bulk action)' }] } : i)) }))
          pushActivity(activity('resolve', `bulk-resolved ${ids.length} issues`))
        },

        bulkAssign: (ids, memberId) => {
          const at = nowIso()
          const set_ = new Set(ids)
          const m = get().team.find((x) => x.id === memberId)
          set((st) => ({ issues: st.issues.map((i) => (set_.has(i.id) ? { ...i, assigneeId: memberId, history: [...i.history, { at, by: ME, action: 'Assigned', note: memberId }] } : i)) }))
          if (m) pushActivity(activity('assign', `assigned ${ids.length} issues to ${m.name}`))
        },

        editIssueTarget: (issueId, target) => {
          const s = get()
          const issue = s.issues.find((i) => i.id === issueId)
          if (!issue) return
          const at = nowIso()
          set((st) => ({
            segments: st.segments.map((x) => (x.id === issue.segmentId ? { ...x, target, editedAt: at, editedBy: ME, status: 'reviewed' } : x)),
            issues: patchIssue(st.issues, issueId, (i) => ({ ...i, status: 'resolved', resolution: 'edited', resolvedAt: at, history: [...i.history, { at, by: ME, action: 'Edited translation and resolved', note: target }] })),
          }))
          pushActivity(activity('resolve', `edited the translation and resolved ${issue.id}`, issue.projectId))
        },

        addTerm: (t) => {
          set((s) => ({ glossary: [{ ...t, id: uid('t'), updatedAt: nowIso(), updatedBy: ME }, ...s.glossary] }))
          pushActivity(activity('glossary', `added glossary term "${t.source} → ${t.target}"`))
        },
        updateTerm: (id, patch) => set((s) => ({ glossary: s.glossary.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: nowIso(), updatedBy: ME } : t)) })),
        deleteTerm: (id) => {
          const t = get().glossary.find((x) => x.id === id)
          set((s) => ({ glossary: s.glossary.filter((x) => x.id !== id) }))
          if (t) pushActivity(activity('glossary', `deleted glossary term "${t.source} → ${t.target}"`))
        },
        importTerms: (terms) => {
          const at = nowIso()
          set((s) => ({ glossary: [...terms.map((t) => ({ ...t, id: uid('t'), updatedAt: at, updatedBy: ME })), ...s.glossary] }))
          pushActivity(activity('glossary', `imported ${terms.length} glossary terms`))
          return terms.length
        },

        addTM: (u) => {
          set((s) => ({ tm: [{ ...u, id: uid('tm'), usageCount: 0, updatedAt: nowIso(), updatedBy: ME }, ...s.tm] }))
          pushActivity(activity('tm', 'added a translation unit to the translation memory'))
        },
        updateTM: (id, patch) => set((s) => ({ tm: s.tm.map((u) => (u.id === id ? { ...u, ...patch, updatedAt: nowIso(), updatedBy: ME } : u)) })),
        deleteTM: (id) => set((s) => ({ tm: s.tm.filter((u) => u.id !== id) })),

        updateClient: (id, patch) => {
          set((s) => ({
            clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
            projects:
              patch.profile?.minQuality !== undefined
                ? s.projects.map((p) => (p.clientId === id && p.status !== 'completed' ? { ...p, qualityThreshold: patch.profile!.minQuality } : p))
                : s.projects,
          }))
          const c = get().clients.find((x) => x.id === id)
          if (c) pushActivity(activity('settings', `updated the quality profile for ${c.name}`))
        },

        updateMember: (id, patch) => set((s) => ({ team: s.team.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
        inviteMember: (m) => {
          const initials = m.name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()
          const member: TeamMember = {
            id: uid('m'),
            initials,
            specializations: [],
            status: 'invited',
            workload: 0,
            vendor: 'Freelance',
            timezone: 'UTC',
            qualityTrend: [],
            wordsThisMonth: 0,
            reviewsCompleted: 0,
            onTimeRate: 0,
            avgTurnaroundHours: 0,
            feedbackAcceptance: 0,
            joined: nowIso(),
            color: '#64748B',
            ...m,
          }
          set((s) => ({ team: [...s.team, member] }))
          pushActivity(activity('settings', `invited ${m.name} as ${m.role}`))
        },

        connectIntegration: (id) => {
          const i = get().integrations.find((x) => x.id === id)
          set((s) => ({ integrations: s.integrations.map((x) => (x.id === id ? { ...x, status: 'connected', connectedAt: nowIso() } : x)) }))
          if (i) pushActivity(activity('integration', `connected ${i.name} (demo connection)`))
        },
        disconnectIntegration: (id) => {
          const i = get().integrations.find((x) => x.id === id)
          set((s) => ({ integrations: s.integrations.map((x) => (x.id === id ? { ...x, status: 'available', connectedAt: undefined } : x)) }))
          if (i) pushActivity(activity('integration', `disconnected ${i.name}`))
        },
        toggleWaitlist: (id) => set((s) => ({ integrations: s.integrations.map((x) => (x.id === id ? { ...x, waitlisted: !x.waitlisted } : x)) })),

        updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

        notify: (kind, title, body, link) => {
          const s = get()
          if (kind !== 'system' && !s.settings.notifications[kind]) return
          const n: AppNotification = { id: uid('n'), kind, title, body, link, at: nowIso(), read: false }
          set((st) => ({ notifications: [n, ...st.notifications].slice(0, 60) }))
        },
        markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
        markAllNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
        logActivity: (type, message, projectId, actorId) => pushActivity(activity(type, message, projectId, actorId)),

        resetDemo: () => {
          const { signedIn, theme } = get()
          set({ ...buildSeedData(), ...initialUI, signedIn, theme })
        },
      }
    },
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => safeStorage),
      migrate: () => ({ ...buildSeedData(), ...initialUI }) as unknown as AppState,
      partialize: (s) => {
        // Transient dialog state is not persisted.
        const { scanDialog: _scan, createProjectOpen: _c, importOpen: _i, ...rest } = s
        void _scan
        void _c
        void _i
        return rest
      },
    },
  ),
)

export const currentUser = CURRENT_USER
