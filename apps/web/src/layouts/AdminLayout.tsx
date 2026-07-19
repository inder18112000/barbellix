import { LayoutDashboard, Users, BarChart3, Settings, Radio, CreditCard } from 'lucide-react'
import { DashboardShell, type NavItem } from './DashboardShell'

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="size-4" />, end: true },
  { to: '/admin/members', label: 'Members', icon: <Users className="size-4" /> },
  { to: '/admin/analytics', label: 'Analytics', icon: <BarChart3 className="size-4" /> },
  { to: '/admin/attendance', label: 'Attendance Feed', icon: <Radio className="size-4" /> },
  { to: '/admin/plans', label: 'Membership Plans', icon: <CreditCard className="size-4" /> },
  { to: '/admin/branch', label: 'Branch Settings', icon: <Settings className="size-4" /> },
]

export function AdminLayout() {
  return <DashboardShell navItems={ADMIN_NAV} />
}
