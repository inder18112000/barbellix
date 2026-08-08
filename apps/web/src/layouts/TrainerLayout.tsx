import { LayoutDashboard, Users, MessageSquare, ClipboardList, CalendarDays, Dumbbell } from 'lucide-react'
import { DashboardShell, type NavItem } from './DashboardShell'

const TRAINER_NAV: NavItem[] = [
  { to: '/trainer', label: 'Dashboard', icon: <LayoutDashboard className="size-4" />, end: true },
  { to: '/trainer/members', label: 'Members', icon: <Users className="size-4" /> },
  { to: '/trainer/plans/new', label: 'Create Plan', icon: <ClipboardList className="size-4" /> },
  { to: '/trainer/exercises', label: 'Exercise & Meal Library', icon: <Dumbbell className="size-4" /> },
  { to: '/trainer/classes/roster', label: 'Class Rosters', icon: <CalendarDays className="size-4" /> },
  { to: '/trainer/messages', label: 'Messages', icon: <MessageSquare className="size-4" /> },
]

export function TrainerLayout() {
  return <DashboardShell navItems={TRAINER_NAV} />
}
