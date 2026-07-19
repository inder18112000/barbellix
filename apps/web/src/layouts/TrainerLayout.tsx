import { LayoutDashboard, Users, MessageSquare } from 'lucide-react'
import { DashboardShell, type NavItem } from './DashboardShell'

const TRAINER_NAV: NavItem[] = [
  { to: '/trainer', label: 'Dashboard', icon: <LayoutDashboard className="size-4" />, end: true },
  { to: '/trainer/members', label: 'Members', icon: <Users className="size-4" /> },
  { to: '/trainer/messages', label: 'Messages', icon: <MessageSquare className="size-4" /> },
]

export function TrainerLayout() {
  return <DashboardShell navItems={TRAINER_NAV} />
}
