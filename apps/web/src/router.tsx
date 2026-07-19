import { createBrowserRouter, Navigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { RequireAuth } from '@/routes/RequireAuth'
import { RequireRole } from '@/routes/RequireRole'
import { AdminLayout } from '@/layouts/AdminLayout'
import { TrainerLayout } from '@/layouts/TrainerLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { AdminHomePage } from '@/pages/admin/AdminHomePage'
import { TrainerHomePage } from '@/pages/trainer/TrainerHomePage'
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
            children: [{ index: true, element: <AdminHomePage /> }],
          },
        ],
      },
      {
        element: <RequireRole roles={['trainer']} />,
        children: [
          {
            path: '/trainer',
            element: <TrainerLayout />,
            children: [{ index: true, element: <TrainerHomePage /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
