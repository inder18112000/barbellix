import type { UserRole } from '@barbellix/shared'

/** "Gym owner" is how this dashboard badges the admin role for its audience. Superadmin gets its
 * own distinct label - unlike admin, it isn't scoped to one gym (see the Platform Overview page,
 * /admin/platform, superadmin-only). */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Gym Owner',
  superadmin: 'Super Admin',
  trainer: 'Trainer',
  member: 'Member',
}
