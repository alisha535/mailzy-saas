import { AuthProvider }      from './providers/AuthProvider'
import { WorkspaceProvider } from './providers/WorkspaceProvider'
import { ToastProvider }     from './providers/ToastProvider'
import { useAuth }           from './providers/AuthProvider'
import { useAntigravity }    from './hooks/useAntigravity'
import { ErrorBoundary }     from './components/layout/ErrorBoundary'
import Sidebar               from './components/layout/Sidebar'
import Topbar                from './components/layout/Topbar'
import AntigravityBar        from './components/layout/AntigravityBar'
import AuthPage              from './features/auth/AuthPage'
import { useState, useRef, useEffect, Suspense, lazy } from 'react'

// ── Lazy load all feature pages ──────────────────────────────
const CopilotPage     = lazy(() => import('./features/copilot/CopilotPage'))
const AgentsPage      = lazy(() => import('./features/agents/AgentsPage'))
const SuperSearchPage = lazy(() => import('./features/supersearch/SuperSearchPage'))
const UniboxPage      = lazy(() => import('./features/unibox/UniboxPage'))
const CampaignsPage   = lazy(() => import('./features/campaigns/CampaignsPage'))
const LeadsPage       = lazy(() => import('./features/leads/LeadsPage'))
const AnalyticsPage   = lazy(() => import('./features/analytics/AnalyticsPage'))
const TrackerPage     = lazy(() => import('./features/tracker/EmailTrackerPage'))
const VerifierPage    = lazy(() => import('./features/verifier/EmailVerifierPage'))
const TesterPage      = lazy(() => import('./features/tester/EmailTesterPage'))
const AutomationPage  = lazy(() => import('./features/automation/AutomationPage'))
const InboxesPage     = lazy(() => import('./features/inboxes/InboxesPage'))
const EmailSenderPage = lazy(() => import('./features/email-sender/EmailSenderPage'))
const SettingsPage    = lazy(() => import('./features/settings/SettingsPage'))

const PAGES = {
  copilot:     CopilotPage,
  agents:      AgentsPage,
  supersearch: SuperSearchPage,
  unibox:      UniboxPage,
  campaigns:   CampaignsPage,
  leads:       LeadsPage,
  analytics:   AnalyticsPage,
  tracker:     TrackerPage,
  verifier:    VerifierPage,
  tester:      TesterPage,
  automation:  AutomationPage,
  inboxes:     InboxesPage,
  sender:      EmailSenderPage,
  settings:    SettingsPage,
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-slate-600 text-xs">Loading...</p>
      </div>
    </div>
  )
}

function AppShell() {
  const { user, loading } = useAuth()
  const { active: agActive, toggle: agToggle, register } = useAntigravity()
  const [page, setPage]           = useState('copilot')
  const [collapsed, setCollapsed] = useState(false)
  const sidebarRef = useRef(null)
  const topbarRef  = useRef(null)

  useEffect(() => {
    if (sidebarRef.current) register(sidebarRef.current, 'sidebar')
    if (topbarRef.current)  register(topbarRef.current,  'topbar')
  }, [register, user])

  if (loading) return (
    <div className="h-screen bg-transparent flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center animate-pulse text-white text-xl">⚡</div>
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    </div>
  )

  if (!user) return <AuthPage />

  const PageComponent = PAGES[page] || CopilotPage

  return (
    <div className="h-screen bg-transparent flex overflow-hidden" style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <Sidebar
        page={page} onNav={setPage}
        collapsed={collapsed} setCollapsed={setCollapsed}
        agRef={sidebarRef}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          page={page}
          collapsed={collapsed} setCollapsed={setCollapsed}
          agRef={topbarRef}
        />
        <main className="flex-1 overflow-hidden">
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <PageComponent />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <AntigravityBar active={agActive} onToggle={agToggle} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <ToastProvider>
          <AppShell />
        </ToastProvider>
      </WorkspaceProvider>
    </AuthProvider>
  )
}
