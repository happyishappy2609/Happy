import { lazy, type ReactNode } from 'react'
import { createHashRouter, Navigate, RouterProvider, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { useAppStore } from '@/store/useAppStore'

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage'))
const QualityPage = lazy(() => import('@/pages/QualityPage'))
const IssuesPage = lazy(() => import('@/pages/IssuesPage'))
const TeamPage = lazy(() => import('@/pages/TeamPage'))
const TerminologyPage = lazy(() => import('@/pages/TerminologyPage'))
const TranslationMemoryPage = lazy(() => import('@/pages/TranslationMemoryPage'))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'))
const ClientsPage = lazy(() => import('@/pages/ClientsPage'))
const ClientDetailPage = lazy(() => import('@/pages/ClientDetailPage'))
const IntegrationsPage = lazy(() => import('@/pages/IntegrationsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function RequireAuth({ children }: { children: ReactNode }) {
  const signedIn = useAppStore((s) => s.signedIn)
  const location = useLocation()
  if (!signedIn) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <>{children}</>
}

// Hash routing keeps deep links working on any static host (including the shareable preview).
const router = createHashRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:id', element: <ProjectDetailPage /> },
      { path: 'quality', element: <QualityPage /> },
      { path: 'issues', element: <IssuesPage /> },
      { path: 'team', element: <TeamPage /> },
      { path: 'terminology', element: <TerminologyPage /> },
      { path: 'memory', element: <TranslationMemoryPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/:id', element: <ClientDetailPage /> },
      { path: 'integrations', element: <IntegrationsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
