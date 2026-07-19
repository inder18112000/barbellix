import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { LogOut, Zap } from 'lucide-react'
import { authStore } from '@/store/authStore'
import { ROLE_LABELS } from '@/lib/roleLabels'
import { cn } from '@/lib/utils'

export interface NavItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

interface Props {
  navItems: NavItem[]
}

export const DashboardShell = observer(function DashboardShell({ navItems }: Props) {
  const user = authStore.user

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-primary-foreground">
            <Zap className="size-4" fill="currentColor" />
          </div>
          <span className="font-semibold">FitPulse</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border px-3 py-3">
          <div className="mb-2 px-2">
            <p className="truncate text-sm font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-sidebar-foreground/60">{user ? ROLE_LABELS[user.role] : ''}</p>
          </div>
          <button
            onClick={() => authStore.logout()}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
})
