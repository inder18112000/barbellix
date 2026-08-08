import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { RequireAuth } from '@/routes/RequireAuth'
import { RequireRole } from '@/routes/RequireRole'
import { AdminLayout } from '@/layouts/AdminLayout'
import { TrainerLayout } from '@/layouts/TrainerLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { authStore } from '@/store/authStore'

// Every page below is code-split (see DashboardShell's <Suspense> boundary) - only LoginPage,
// needed immediately on first load, stays a static import. This is what took the app from one
// 1.1MB bundle to one chunk per page.
const AdminHomePage = lazy(() => import('@/pages/admin/AdminHomePage').then((m) => ({ default: m.AdminHomePage })))
const AnalyticsPage = lazy(() => import('@/pages/admin/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })))
const AdminMembersPage = lazy(() => import('@/pages/admin/MembersPage').then((m) => ({ default: m.MembersPage })))
const AdminMemberDetailPage = lazy(() =>
  import('@/pages/admin/MemberDetailPage').then((m) => ({ default: m.MemberDetailPage })),
)
const AttendanceFeedPage = lazy(() =>
  import('@/pages/admin/AttendanceFeedPage').then((m) => ({ default: m.AttendanceFeedPage })),
)
const MembershipPlansPage = lazy(() =>
  import('@/pages/admin/MembershipPlansPage').then((m) => ({ default: m.MembershipPlansPage })),
)
const BranchSettingsPage = lazy(() =>
  import('@/pages/admin/BranchSettingsPage').then((m) => ({ default: m.BranchSettingsPage })),
)
const AdminSettingsPage = lazy(() => import('@/pages/admin/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const SponsorsPage = lazy(() => import('@/pages/admin/SponsorsPage').then((m) => ({ default: m.SponsorsPage })))
const ClassesPage = lazy(() => import('@/pages/admin/ClassesPage').then((m) => ({ default: m.ClassesPage })))
const ClassRosterPage = lazy(() => import('@/pages/admin/ClassRosterPage').then((m) => ({ default: m.ClassRosterPage })))
const PlatformOverviewPage = lazy(() =>
  import('@/pages/superadmin/PlatformOverviewPage').then((m) => ({ default: m.PlatformOverviewPage })),
)
const TrainersPage = lazy(() => import('@/pages/admin/TrainersPage').then((m) => ({ default: m.TrainersPage })))
const TrainerHomePage = lazy(() => import('@/pages/trainer/TrainerHomePage').then((m) => ({ default: m.TrainerHomePage })))
const TrainerMembersPage = lazy(() => import('@/pages/trainer/MembersPage').then((m) => ({ default: m.MembersPage })))
const MemberDetailPage = lazy(() => import('@/pages/trainer/MemberDetailPage').then((m) => ({ default: m.MemberDetailPage })))
const AssignPlanPage = lazy(() => import('@/pages/trainer/AssignPlanPage').then((m) => ({ default: m.AssignPlanPage })))
const CreatePlanPage = lazy(() => import('@/pages/trainer/CreatePlanPage').then((m) => ({ default: m.CreatePlanPage })))
const ExerciseLibraryPage = lazy(() =>
  import('@/pages/trainer/ExerciseLibraryPage').then((m) => ({ default: m.ExerciseLibraryPage })),
)
const MessagesPage = lazy(() => import('@/pages/trainer/MessagesPage').then((m) => ({ default: m.MessagesPage })))

// Sends an already-authenticated user straight to their own dashboard instead of the login form.
const IndexRedirect = observer(function IndexRedirect() {
  if (!authStore.isAuthenticated) return <Navigate to="/login" replace />
  const role = authStore.user?.role
  return <Navigate to={role === 'trainer' ? '/trainer' : '/admin'} replace />
})

export const router = createBrowserRouter([
  { path: '/', element: <IndexRedirect /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RequireRole roles={['admin', 'superadmin']} />,
        children: [
          {
            path: '/admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminHomePage /> },
              { path: 'members', element: <AdminMembersPage /> },
              { path: 'members/:memberId', element: <AdminMemberDetailPage /> },
              { path: 'trainers', element: <TrainersPage /> },
              { path: 'analytics', element: <AnalyticsPage /> },
              { path: 'attendance', element: <AttendanceFeedPage /> },
              { path: 'plans', element: <MembershipPlansPage /> },
              { path: 'sponsors', element: <SponsorsPage /> },
              { path: 'classes', element: <ClassesPage /> },
              { path: 'classes/roster', element: <ClassRosterPage /> },
              { path: 'branch', element: <BranchSettingsPage /> },
              { path: 'settings', element: <AdminSettingsPage /> },
              {
                // Nested under /admin's admin-or-superadmin guard, but further restricted to
                // superadmin only - an admin who guesses this URL still gets redirected away.
                element: <RequireRole roles={['superadmin']} />,
                children: [{ path: 'platform', element: <PlatformOverviewPage /> }],
              },
            ],
          },
        ],
      },
      {
        element: <RequireRole roles={['trainer']} />,
        children: [
          {
            path: '/trainer',
            element: <TrainerLayout />,
            children: [
              { index: true, element: <TrainerHomePage /> },
              { path: 'members', element: <TrainerMembersPage /> },
              { path: 'members/:memberId', element: <MemberDetailPage /> },
              { path: 'members/:memberId/assign-plan', element: <AssignPlanPage /> },
              { path: 'plans/new', element: <CreatePlanPage /> },
              { path: 'exercises', element: <ExerciseLibraryPage /> },
              { path: 'classes/roster', element: <ClassRosterPage /> },
              { path: 'messages', element: <MessagesPage /> },
              { path: 'messages/:otherUserId', element: <MessagesPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
