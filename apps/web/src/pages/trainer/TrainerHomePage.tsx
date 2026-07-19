import { observer } from 'mobx-react-lite'
import { authStore } from '@/store/authStore'

// Placeholder for M3 (auth/routing shell verification) - replaced with real data
// (GET /trainer/stats, GET /trainer/members) in M5.
export const TrainerHomePage = observer(function TrainerHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Welcome, {authStore.user?.firstName}</h1>
      <p className="mt-1 text-muted-foreground">Trainer dashboard - your roster coming in the next milestone.</p>
    </div>
  )
})
