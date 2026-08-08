import type { UserRole } from '@barbellix/shared';
import { findById as findUserById } from '../modules/users/repository.js';
import { ForbiddenError } from './errors.js';

/** Shared by exercises/service.ts and meals/service.ts - admin/superadmin always pass (their
 * library-management access was never gated); a trainer only passes if their own
 * User.trainerPermissions flag is still true. Permissions default true (see db/models/User.ts),
 * so this only ever blocks a trainer an admin/superadmin has explicitly revoked access from. */
export async function assertTrainerCanManage(
  requester: { id: string; role: UserRole },
  capability: 'canManageExerciseLibrary' | 'canManageMealLibrary',
  deniedMessage: string,
): Promise<void> {
  if (requester.role !== 'trainer') return;

  const trainer = await findUserById(requester.id);
  if (!trainer?.trainerPermissions[capability]) {
    throw new ForbiddenError(deniedMessage);
  }
}
