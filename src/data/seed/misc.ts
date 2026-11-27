import type { Activity, ActivityType, AppNotification, Integration, NotificationKind, WorkspaceSettings } from '@/types'
import { DEFAULT_SEVERITY_WEIGHTS } from '@/utils/quality'

type A = [type: ActivityType, actor: string, message: string, projectId: string | undefined, hoursAgo: number]

const activityRows: A[] = [
  ['scan', 'u-alex', 'AI QA scan completed for Aurora Mobile App (EN → DE) — score 96.4', 'p-aurora-app', 0.6],
  ['resolve', 'm-maria', 'resolved 12 critical terminology issues across Aurora Help Center', 'p-aurora-help', 1.4],
  ['review', 'm-maria', 'submitted a review for Aurora Mobile App — 38 segments approved', 'p-aurora-app', 2.2],
  ['alert', 'system', 'Nova E-commerce quality score dropped below the 95% client target', 'p-nova-ecom', 3.1],
  ['glossary', 'm-claire', 'added a new glossary term "Wishlist → Liste de souhaits" for Nova Retail', undefined, 4.5],
  ['resolve', 'm-ana', 'resolved "Keep out of reach of children" omission in Helix Healthcare', 'p-helix-health', 6.2],
  ['scan', 'm-emma', 'AI QA scan completed for Orbit Gaming (EN → KO) — 2 critical issues found', 'p-orbit-gaming', 8.4],
  ['assign', 'm-emma', 'assigned Hana Park as reviewer on Orbit Gaming', 'p-orbit-gaming', 9.0],
  ['review', 'm-kenji', 'submitted a review for FinEdge Platform — 112 segments approved', 'p-finedge-platform', 14.5],
  ['project', 'm-priya', 'created project Lumen Release Notes (4 target languages)', 'p-lumen-release', 22.0],
  ['tm', 'm-claire', 'approved 46 translation units from Nova Spring Sale into the Nova Retail TM', undefined, 26.0],
  ['scan', 'u-alex', 'AI QA scan completed for Nova E-commerce (EN → FR) — score 88.2', 'p-nova-ecom', 72.0],
  ['alert', 'system', 'Helix Patient Portal has 3 unresolved critical issues', 'p-helix-portal', 30.0],
  ['integration', 'u-alex', 'connected Phrase to sync Nova Retail projects', undefined, 50.0],
  ['comment', 'm-julien', 'commented on QA-1003: "Client confirmed the glossary term, updating now."', 'p-nova-ecom', 54.0],
  ['resolve', 'm-kenji', 'resolved interest-rate mismatch (2.5% vs 25%) in FinEdge Platform', 'p-finedge-platform', 75.0],
  ['review', 'm-claire', 'started review of Nova E-commerce batch 3 (40 segments)', 'p-nova-ecom', 80.0],
  ['glossary', 'm-kenji', 'approved term "Beneficial owner → 実質的支配者" for FinEdge', undefined, 96.0],
  ['project', 'm-emma', 'moved Lumen Analytics Dashboard to In Review', 'p-lumen-dashboard', 110.0],
  ['settings', 'u-alex', 'raised Helix Health minimum quality threshold to 97%', undefined, 140.0],
]

export function buildActivities(now: number): Activity[] {
  return activityRows.map(([type, actorId, message, projectId, h], i) => ({
    id: `a-${3001 + i}`,
    type,
    actorId,
    message,
    projectId,
    at: new Date(now - h * 3_600_000).toISOString(),
  }))
}

type N = [kind: NotificationKind, title: string, body: string, hoursAgo: number, read: boolean, link?: string]

const notificationRows: N[] = [
  ['criticalIssue', 'Critical issue detected', 'Orbit Gaming: gem quantity mismatch in an in-game purchase string.', 8.3, false, '/issues?project=p-orbit-gaming'],
  ['deadline', 'Deadline approaching', 'Nova E-commerce is due in 4 days and is below its quality target.', 3.0, false, '/projects/p-nova-ecom'],
  ['scanCompleted', 'QA scan completed', 'Aurora Mobile App (EN → DE) scored 96.4.', 0.6, false, '/projects/p-aurora-app?tab=qa'],
  ['reviewerActivity', 'Review submitted', 'Maria Chen approved 38 segments in Aurora Mobile App.', 2.2, true, '/projects/p-aurora-app'],
  ['weeklyReport', 'Weekly quality report ready', 'Average quality up 1.1 pts week over week. 41 issues resolved.', 70, true, '/analytics'],
  ['criticalIssue', 'Critical issues unresolved', 'Helix Patient Portal has 3 unresolved critical issues.', 30, true, '/issues?project=p-helix-portal'],
]

export function buildNotifications(now: number): AppNotification[] {
  return notificationRows
    .map(([kind, title, body, h, read, link], i) => ({ id: `n-${7001 + i}`, kind, title, body, read, link, at: new Date(now - h * 3_600_000).toISOString() }))
    .sort((a, b) => b.at.localeCompare(a.at))
}

export function buildIntegrations(now: number): Integration[] {
  const at = (d: number) => new Date(now - d * 86_400_000).toISOString()
  return [
    { id: 'i-lokalise', name: 'Lokalise', monogram: 'Lk', color: '#2F6BFF', category: 'Translation Management', status: 'available', description: 'Pull keys and push QA-approved translations for software projects.', capabilities: ['Two-way key sync', 'Webhook-triggered QA', 'Branch support'] },
    { id: 'i-phrase', name: 'Phrase', monogram: 'Ph', color: '#00A8A8', category: 'Translation Management', status: 'connected', connectedAt: at(2), description: 'Sync Phrase Strings and TMS jobs; run AI QA before job completion.', capabilities: ['Job sync', 'QA gate before delivery', 'Glossary sync'] },
    { id: 'i-smartling', name: 'Smartling', monogram: 'Sm', color: '#E2492F', category: 'Translation Management', status: 'available', description: 'Import Smartling jobs and post findings back as issues.', capabilities: ['Job import', 'Issue round-trip'] },
    { id: 'i-crowdin', name: 'Crowdin', monogram: 'Cr', color: '#263238', category: 'Translation Management', status: 'available', description: 'Connect Crowdin projects and score translations as they land.', capabilities: ['Project sync', 'Real-time scoring'] },
    { id: 'i-memoq', name: 'memoQ', monogram: 'mQ', color: '#2C9C6A', category: 'CAT Tools', status: 'connected', connectedAt: at(41), description: 'Exchange MQXLIFF packages and LQA results with memoQ server.', capabilities: ['Package import', 'LQA export', 'TM lookup'] },
    { id: 'i-trados', name: 'Trados Studio', monogram: 'Tr', color: '#1E5AA8', category: 'CAT Tools', status: 'available', description: 'Import SDLXLIFF files and return reviewer feedback.', capabilities: ['SDLXLIFF import', 'Feedback export'] },
    { id: 'i-xtm', name: 'XTM', monogram: 'XT', color: '#7A3FD1', category: 'CAT Tools', status: 'coming_soon', description: 'XTM Cloud connector for workflow-driven QA steps.', capabilities: ['Workflow step', 'Project import'] },
    { id: 'i-gdrive', name: 'Google Drive', monogram: 'GD', color: '#1A9E5C', category: 'Storage', status: 'available', description: 'Pick source files and export QA reports to shared folders.', capabilities: ['File picker', 'Report export'] },
    { id: 'i-excel', name: 'Microsoft Excel', monogram: 'Xl', color: '#1D7044', category: 'File Import / Export', status: 'connected', connectedAt: at(90), description: 'Import bilingual spreadsheets and export LQA scorecards.', capabilities: ['Bilingual import', 'Scorecard export'] },
    { id: 'i-slack', name: 'Slack', monogram: 'Sl', color: '#611F69', category: 'Project Management', status: 'available', description: 'Post critical-issue alerts and scan summaries to channels.', capabilities: ['Channel alerts', 'Daily digest'] },
    { id: 'i-jira', name: 'Jira', monogram: 'Ji', color: '#1868DB', category: 'Project Management', status: 'available', description: 'Create Jira tickets from linguistic issues and track resolution.', capabilities: ['Issue → ticket', 'Status sync'] },
    { id: 'i-openai', name: 'OpenAI', monogram: 'AI', color: '#0F172A', category: 'AI Providers', status: 'coming_soon', description: 'Bring your own model provider for AI QA analysis (BYO key).', capabilities: ['Provider abstraction', 'BYO API key', 'Model routing'] },
    { id: 'i-anthropic', name: 'Anthropic', monogram: 'An', color: '#B4532A', category: 'AI Providers', status: 'coming_soon', description: 'Use Claude models as the AI QA analysis provider (BYO key).', capabilities: ['Provider abstraction', 'BYO API key'] },
    { id: 'i-s3', name: 'Amazon S3', monogram: 'S3', color: '#C7511F', category: 'Storage', status: 'coming_soon', description: 'Store source files and reports in your own bucket.', capabilities: ['Bucket storage', 'Retention policies'] },
  ]
}

export const defaultSettings: WorkspaceSettings = {
  workspaceName: 'Northstar Localization',
  timezone: 'Europe/London',
  defaultLanguage: 'en',
  defaultCurrency: 'USD',
  logoInitials: 'NL',
  defaultThreshold: 95,
  severityWeights: { ...DEFAULT_SEVERITY_WEIGHTS },
  defaultRules: ['accuracy', 'omission', 'addition', 'terminology', 'grammar', 'fluency', 'style', 'locale', 'formatting', 'consistency', 'numbers', 'punctuation'],
  sensitivity: 'balanced',
  autoAssignReviewer: true,
  autoResolveLowConfidence: false,
  notifications: {
    scanCompleted: true,
    criticalIssue: true,
    deadline: true,
    reviewerActivity: false,
    weeklyReport: true,
  },
}
