import { observer } from 'mobx-react-lite'
import { authStore } from '@/store/authStore'

// Placeholder for M3 (auth/routing shell verification) - replaced with real KPIs
// (GET /trainer/stats, GET /admin/analytics/attendance) in M4.
export const AdminHomePage = observer(function AdminHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Welcome, {authStore.user?.firstName}</h1>
      <p className="mt-1 text-muted-foreground">Owner dashboard - real KPIs coming in the next milestone.</p>
    </div>
  )
})
