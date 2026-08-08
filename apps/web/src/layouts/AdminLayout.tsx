import { LayoutDashboard, Users, Users2, BarChart3, Settings, Radio, CreditCard, UserCog, Handshake, CalendarDays, ClipboardList, Building2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { authStore } from '@/store/authStore'
import { DashboardShell, type NavItem } from './DashboardShell'

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="size-4" />, end: true },
  { to: '/admin/members', label: 'Members', icon: <Users className="size-4" /> },
  { to: '/admin/trainers', label: 'Trainers', icon: <Users2 className="size-4" /> },
  { to: '/admin/analytics', label: 'Analytics', icon: <BarChart3 className="size-4" /> },
  { to: '/admin/attendance', label: 'Attendance Feed', icon: <Radio className="size-4" /> },
  { to: '/admin/classes', label: 'Classes', icon: <CalendarDays className="size-4" /> },
  { to: '/admin/classes/roster', label: 'Class Rosters', icon: <ClipboardList className="size-4" /> },
  { to: '/admin/plans', label: 'Membership Plans', icon: <CreditCard className="size-4" /> },
  { to: '/admin/sponsors', label: 'Sponsors', icon: <Handshake className="size-4" /> },
  { to: '/admin/branch', label: 'Branch Settings', icon: <Settings className="size-4" /> },
  { to: '/admin/settings', label: 'Account Settings', icon: <UserCog className="size-4" /> },
]

// Only superadmin gets this - it's a platform-wide, cross-tenant view that would be a real
// tenant-boundary leak if an ordinary gym-owner admin could see it too.
const SUPERADMIN_NAV_ITEM: NavItem = { to: '/admin/platform', label: 'Platform Overview', icon: <Building2 className="size-4" /> }

export const AdminLayout = observer(function AdminLayout() {
  const navItems = authStore.user?.role === 'superadmin' ? [...ADMIN_NAV, SUPERADMIN_NAV_ITEM] : ADMIN_NAV
  return <DashboardShell navItems={navItems} />
})
