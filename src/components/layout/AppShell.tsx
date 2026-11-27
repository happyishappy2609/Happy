import * as D from '@radix-ui/react-dialog'
import { Eye, X } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PageLoading } from '@/components/common/LoadingState'
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog'
import { ImportProjectDialog } from '@/components/projects/ImportProjectDialog'
import { RunScanDialog } from '@/components/quality/RunScanDialog'
import { useAppStore } from '@/store/useAppStore'
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/utils/permissions'
import { DemoGuide, useDemoTracking } from './DemoGuide'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const viewAs = useAppStore((s) => s.viewAs)
  const setViewAs = useAppStore((s) => s.setViewAs)
  useDemoTracking()

  useEffect(() => {
    setMobileOpen(false)
    document.getElementById('main')?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="min-h-dvh bg-bg">
      <a href="#main" className="sr-only z-50 rounded-md bg-card px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] border-r border-border lg:block no-print">
        <Sidebar />
      </aside>

      <D.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <D.Portal>
          <D.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)] animate-fade-in lg:hidden" />
          <D.Content className="fixed inset-y-0 left-0 z-50 w-[272px] max-w-[85vw] border-r border-border shadow-modal animate-slide-in-left focus:outline-none lg:hidden">
            <D.Title className="sr-only">Navigation</D.Title>
            <D.Description className="sr-only">Main navigation</D.Description>
            <D.Close className="absolute top-3.5 right-3 z-10 rounded-md p-1 text-fg-3 hover:bg-hover" aria-label="Close navigation">
              <X className="size-4" />
            </D.Close>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </D.Content>
        </D.Portal>
      </D.Root>

      <div className="lg:pl-[240px]">
        <Topbar onMenu={() => setMobileOpen(true)} />
        {viewAs !== 'admin' && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-warning-dot/30 bg-warning-soft px-4 py-2 text-[12.5px] text-warning md:px-6 no-print" role="status">
            <span className="flex items-center gap-2">
              <Eye className="size-3.5" />
              <span>
                <b>Viewing as {ROLE_LABELS[viewAs]}.</b> {ROLE_DESCRIPTIONS[viewAs]}
              </span>
            </span>
            <button onClick={() => setViewAs('admin')} className="font-medium underline underline-offset-2">
              Exit role preview
            </button>
          </div>
        )}
        <main id="main" className="mx-auto w-full max-w-[1440px] px-4 py-5 md:px-6 md:py-6">
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <RunScanDialog />
      <CreateProjectDialog />
      <ImportProjectDialog />
      <DemoGuide />
    </div>
  )
}
