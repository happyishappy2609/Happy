export type LangCode = 'en' | 'de' | 'fr' | 'es' | 'ja' | 'ko' | 'it' | 'pt' | 'zh'

export type Severity = 'critical' | 'major' | 'minor' | 'info'

export type IssueCategory =
  | 'accuracy'
  | 'mistranslation'
  | 'omission'
  | 'addition'
  | 'terminology'
  | 'grammar'
  | 'fluency'
  | 'style'
  | 'locale'
  | 'formatting'
  | 'consistency'
  | 'numbers'
  | 'punctuation'

export type IssueStatus = 'open' | 'in_review' | 'resolved' | 'ignored'

export type ProjectStatus = 'active' | 'in_review' | 'completed' | 'on_hold'

export type ProjectType =
  | 'Software Localization'
  | 'Website Localization'
  | 'Marketing Content'
  | 'Product Documentation'
  | 'Game Localization'
  | 'Legal'
  | 'Medical'

export type RiskLevel = 'low' | 'medium' | 'high'

export type AccessRole = 'admin' | 'pm' | 'reviewer' | 'translator' | 'viewer'

export type ScanSensitivity = 'balanced' | 'strict' | 'high_precision'

export type QARuleId =
  | 'accuracy'
  | 'omission'
  | 'addition'
  | 'terminology'
  | 'grammar'
  | 'fluency'
  | 'style'
  | 'locale'
  | 'formatting'
  | 'consistency'
  | 'numbers'
  | 'punctuation'

export interface ClientQualityProfile {
  minQuality: number
  enforceTerminology: boolean
  stylePreferences: string
  localeConventions: string
  criticalRules: string[]
  autoQARules: QARuleId[]
}

export interface Client {
  id: string
  name: string
  industry: string
  status: 'active' | 'onboarding' | 'paused'
  qualityTarget: number
  contactName: string
  contactEmail: string
  since: string
  color: string
  styleGuide: string
  profile: ClientQualityProfile
  wordsThisMonth: number
}

export type MemberRole = 'Senior Reviewer' | 'Reviewer' | 'Translator' | 'Project Manager' | 'Vendor Manager'

export interface TeamMember {
  id: string
  name: string
  initials: string
  email: string
  role: MemberRole
  accessRole: AccessRole
  languages: LangCode[]
  specializations: string[]
  status: 'available' | 'busy' | 'away' | 'invited'
  workload: number
  vendor: 'In-house' | 'Freelance' | 'Vendor partner'
  timezone: string
  qualityTrend: number[]
  wordsThisMonth: number
  reviewsCompleted: number
  onTimeRate: number
  avgTurnaroundHours: number
  feedbackAcceptance: number
  joined: string
  color: string
}

export interface ProjectFile {
  id: string
  projectId: string
  name: string
  format: 'XLIFF' | 'CSV' | 'JSON' | 'TXT' | 'DOCX' | 'PDF'
  sizeKb: number
  segments: number
  uploadedAt: string
  uploadedBy: string
  kind: 'source' | 'translation' | 'reference' | 'report'
}

export interface Project {
  id: string
  code: string
  name: string
  clientId: string
  sourceLang: LangCode
  targetLangs: LangCode[]
  words: number
  translationProgress: number
  reviewProgress: number
  status: ProjectStatus
  type: ProjectType
  pmId: string
  translatorIds: string[]
  reviewerIds: string[]
  deadline: string
  startDate: string
  createdAt: string
  qualityThreshold: number
  /** Residual penalty from earlier manual LQA sampling. Cleared once an AI QA scan re-evaluates the project. */
  qualityResidual: number
  /** Languages whose share of the residual has not yet been replaced by a scan. */
  residualLangs: LangCode[]
  /** Historical score points (per scan / review milestone). */
  qualityHistory: { date: string; score: number; label: string }[]
  description?: string
  tags?: string[]
  pinned?: boolean
}

export interface Segment {
  id: string
  projectId: string
  lang: LangCode
  index: number
  source: string
  target: string
  status: 'draft' | 'translated' | 'reviewed' | 'approved'
  editedAt?: string
  editedBy?: string
}

export interface IssueHistoryEntry {
  at: string
  by: string
  action: string
  note?: string
}

export interface Issue {
  id: string
  projectId: string
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
  /** Problematic span in the target text (for highlighting). */
  targetSpan?: string
  /** Relevant span in the source text (e.g. omitted content). */
  sourceSpan?: string
  status: IssueStatus
  assigneeId?: string
  createdAt: string
  resolvedAt?: string
  resolution?: 'accepted' | 'edited' | 'manual' | 'bulk'
  ignoreReason?: string
  detectedBy: 'ai' | 'rule' | 'reviewer'
  scanId?: string
  ruleId?: string
  history: IssueHistoryEntry[]
}

export interface ScanConfig {
  projectId: string
  lang: LangCode
  rules: QARuleId[]
  sensitivity: ScanSensitivity
  useClientGlossary: boolean
  useProjectTerminology: boolean
  checkStyleGuide: boolean
  prioritizeCritical: boolean
}

export interface ScanSummary {
  score: number
  rating: string
  totalSegments: number
  wordsAnalyzed: number
  issuesDetected: number
  newIssues: number
  carriedOver: number
  severity: Record<Severity, number>
  categories: Partial<Record<IssueCategory, number>>
  risk: RiskLevel
  reviewMinutesSaved: number
  durationMs: number
}

export interface QAScan {
  id: string
  projectId: string
  lang: LangCode
  startedAt: string
  completedAt: string
  config: ScanConfig
  summary: ScanSummary
  issueIds: string[]
  engine: string
  triggeredBy: string
}

export interface GlossaryTerm {
  id: string
  source: string
  target: string
  sourceLang: LangCode
  targetLang: LangCode
  clientId: string | null
  domain: string
  definition: string
  usageNotes: string
  status: 'approved' | 'pending' | 'deprecated'
  forbidden?: string[]
  updatedAt: string
  updatedBy: string
}

export interface TMUnit {
  id: string
  source: string
  target: string
  sourceLang: LangCode
  targetLang: LangCode
  clientId: string | null
  lastMatch: number
  status: 'approved' | 'draft' | 'needs_review'
  usageCount: number
  projectId?: string
  updatedAt: string
  updatedBy: string
}

export type ActivityType =
  | 'scan'
  | 'resolve'
  | 'review'
  | 'alert'
  | 'glossary'
  | 'project'
  | 'assign'
  | 'tm'
  | 'integration'
  | 'comment'
  | 'settings'

export interface Activity {
  id: string
  type: ActivityType
  actorId: string
  message: string
  projectId?: string
  at: string
}

export type NotificationKind = 'scanCompleted' | 'criticalIssue' | 'deadline' | 'reviewerActivity' | 'weeklyReport' | 'system'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  body: string
  at: string
  read: boolean
  link?: string
}

export type IntegrationCategory =
  | 'CAT Tools'
  | 'Translation Management'
  | 'Project Management'
  | 'File Import / Export'
  | 'AI Providers'
  | 'Storage'

export interface Integration {
  id: string
  name: string
  description: string
  category: IntegrationCategory
  status: 'connected' | 'available' | 'coming_soon'
  monogram: string
  color: string
  connectedAt?: string
  waitlisted?: boolean
  capabilities: string[]
}

export interface WorkspaceSettings {
  workspaceName: string
  timezone: string
  defaultLanguage: LangCode
  defaultCurrency: string
  logoInitials: string
  logoDataUrl?: string
  plan: 'growth' | 'scale' | 'enterprise'
  defaultThreshold: number
  severityWeights: Record<Severity, number>
  defaultRules: QARuleId[]
  sensitivity: ScanSensitivity
  autoAssignReviewer: boolean
  autoResolveLowConfidence: boolean
  notifications: Record<Exclude<NotificationKind, 'system'>, boolean>
}

export interface DailyMetric {
  date: string
  daysAgo: number
  words: number
  quality: number
  automation: number
  hoursSaved: number
  scans: number
  activeProjects: number
  criticalOpen: number
  reworkRate: number
}
