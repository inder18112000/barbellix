import { createBrowserRouter, Navigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { RequireAuth } from '@/routes/RequireAuth'
import { RequireRole } from '@/routes/RequireRole'
import { AdminLayout } from '@/layouts/AdminLayout'
import { TrainerLayout } from '@/layouts/TrainerLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { AdminHomePage } from '@/pages/admin/AdminHomePage'
import { AnalyticsPage } from '@/pages/admin/AnalyticsPage'
import { MembersPage as AdminMembersPage } from '@/pages/admin/MembersPage'
import { MemberDetailPage as AdminMemberDetailPage } from '@/pages/admin/MemberDetailPage'
import { AttendanceFeedPage } from '@/pages/admin/AttendanceFeedPage'
import { MembershipPlansPage } from '@/pages/admin/MembershipPlansPage'
import { BranchSettingsPage } from '@/pages/admin/BranchSettingsPage'
import { SettingsPage as AdminSettingsPage } from '@/pages/admin/SettingsPage'
import { SponsorsPage } from '@/pages/admin/SponsorsPage'
import { ClassesPage } from '@/pages/admin/ClassesPage'
import { ClassRosterPage } from '@/pages/admin/ClassRosterPage'
import { TrainerHomePage } from '@/pages/trainer/TrainerHomePage'
import { MembersPage as TrainerMembersPage } from '@/pages/trainer/MembersPage'
import { MemberDetailPage } from '@/pages/trainer/MemberDetailPage'
import { AssignPlanPage } from '@/pages/trainer/AssignPlanPage'
import { CreatePlanPage } from '@/pages/trainer/CreatePlanPage'
import { MessagesPage } from '@/pages/trainer/MessagesPage'
import { authStore } from '@/store/authStore'

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
              { path: 'analytics', element: <AnalyticsPage /> },
              { path: 'attendance', element: <AttendanceFeedPage /> },
              { path: 'plans', element: <MembershipPlansPage /> },
              { path: 'sponsors', element: <SponsorsPage /> },
              { path: 'classes', element: <ClassesPage /> },
              { path: 'classes/roster', element: <ClassRosterPage /> },
              { path: 'branch', element: <BranchSettingsPage /> },
              { path: 'settings', element: <AdminSettingsPage /> },
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
