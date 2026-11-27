import { BarChart3, BookText, Building2, Database, FolderKanban, KeyRound, LayoutDashboard, Plug, ScanSearch, Settings, TriangleAlert, Users } from 'lucide-react'

export const NAV_SECTIONS = [
  {
    label: 'Workspace',
    items: [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { to: '/projects', label: 'Projects', icon: FolderKanban },
      { to: '/keys', label: 'String Keys', icon: KeyRound },
      { to: '/quality', label: 'AI Quality', icon: ScanSearch },
      { to: '/issues', label: 'Issues', icon: TriangleAlert, badge: 'issues' as const },
      { to: '/team', label: 'Linguists & Reviewers', icon: Users },
      { to: '/terminology', label: 'Terminology', icon: BookText },
      { to: '/memory', label: 'Translation Memory', icon: Database },
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/clients', label: 'Clients', icon: Building2 },
      { to: '/integrations', label: 'Integrations', icon: Plug },
    ],
  },
  {
    label: 'Settings',
    items: [{ to: '/settings', label: 'Settings', icon: Settings }],
  },
]

export const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Overview',
  projects: 'Projects',
  keys: 'String Keys',
  quality: 'AI Quality',
  issues: 'Issues',
  team: 'Linguists & Reviewers',
  terminology: 'Terminology',
  memory: 'Translation Memory',
  analytics: 'Analytics',
  clients: 'Clients',
  integrations: 'Integrations',
  settings: 'Settings',
}
