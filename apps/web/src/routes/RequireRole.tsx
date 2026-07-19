import { Navigate, Outlet } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import type { UserRole } from '@fitpulse/shared'
import { authStore } from '@/store/authStore'

interface Props {
  roles: UserRole[]
}

/** Redirects an authenticated-but-wrong-role user to their own home rather than a dead end. */
export const RequireRole = observer(function RequireRole({ roles }: Props) {
  const role = authStore.user?.role

  if (!role || !roles.includes(role)) {
    if (role === 'trainer') return <Navigate to="/trainer" replace />
    if (role === 'admin' || role === 'superadmin') return <Navigate to="/admin" replace />
    return <Navigate to="/login" replace />
  }

  return <Outlet />
})
