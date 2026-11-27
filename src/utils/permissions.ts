import type { AccessRole } from '@/types'

export type Permission =
  | 'project.create'
  | 'project.edit'
  | 'project.delete'
  | 'project.assign'
  | 'qa.run'
  | 'issue.resolve'
  | 'issue.ignore'
  | 'issue.assign'
  | 'segment.edit'
  | 'glossary.edit'
  | 'glossary.approve'
  | 'tm.edit'
  | 'client.edit'
  | 'integration.manage'
  | 'settings.workspace'
  | 'settings.billing'
  | 'settings.roles'
  | 'demo.reset'

const ALL: Permission[] = [
  'project.create', 'project.edit', 'project.delete', 'project.assign', 'qa.run', 'issue.resolve', 'issue.ignore', 'issue.assign',
  'segment.edit', 'glossary.edit', 'glossary.approve', 'tm.edit', 'client.edit', 'integration.manage', 'settings.workspace',
  'settings.billing', 'settings.roles', 'demo.reset',
]

export const ROLE_PERMISSIONS: Record<AccessRole, Permission[]> = {
  admin: ALL,
  pm: ['project.create', 'project.edit', 'project.assign', 'qa.run', 'issue.resolve', 'issue.ignore', 'issue.assign', 'segment.edit', 'glossary.edit', 'glossary.approve', 'tm.edit', 'client.edit', 'integration.manage', 'demo.reset'],
  reviewer: ['qa.run', 'issue.resolve', 'issue.ignore', 'issue.assign', 'segment.edit', 'glossary.edit', 'tm.edit', 'demo.reset'],
  translator: ['issue.resolve', 'segment.edit', 'demo.reset'],
  viewer: ['demo.reset'],
}

export const ROLE_LABELS: Record<AccessRole, string> = {
  admin: 'Admin',
  pm: 'Project Manager',
  reviewer: 'Reviewer',
  translator: 'Translator',
  viewer: 'Viewer',
}

export const ROLE_DESCRIPTIONS: Record<AccessRole, string> = {
  admin: 'Full access, including billing, roles and workspace settings.',
  pm: 'Create and manage projects, assign work, run QA and manage terminology.',
  reviewer: 'Run QA, resolve or ignore findings, edit translations and propose terms.',
  translator: 'Edit translations and resolve findings on assigned segments.',
  viewer: 'Read-only access to projects, quality reports and analytics.',
}

export const PERMISSION_LABELS: Record<Permission, string> = {
  'project.create': 'Create projects',
  'project.edit': 'Edit projects',
  'project.delete': 'Delete projects',
  'project.assign': 'Assign reviewers',
  'qa.run': 'Run QA scans',
  'issue.resolve': 'Resolve issues',
  'issue.ignore': 'Ignore issues',
  'issue.assign': 'Assign issues',
  'segment.edit': 'Edit translations',
  'glossary.edit': 'Edit glossary',
  'glossary.approve': 'Approve terms',
  'tm.edit': 'Edit translation memory',
  'client.edit': 'Edit client profiles',
  'integration.manage': 'Manage integrations',
  'settings.workspace': 'Workspace settings',
  'settings.billing': 'Billing',
  'settings.roles': 'Users & roles',
  'demo.reset': 'Reset demo data',
}

export function can(role: AccessRole, p: Permission) {
  return ROLE_PERMISSIONS[role].includes(p)
}
