import { Navigate, Outlet } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { authStore } from '@/store/authStore'

export const RequireAuth = observer(function RequireAuth() {
  if (!authStore.isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
})
