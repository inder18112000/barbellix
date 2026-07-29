import type { UserRole } from '@barbellix/shared'

/** "Gym owner" is the admin/superadmin role, badged for this web dashboard's audience - not a distinct backend role. */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Gym Owner',
  superadmin: 'Gym Owner',
  trainer: 'Trainer',
  member: 'Member',
}
