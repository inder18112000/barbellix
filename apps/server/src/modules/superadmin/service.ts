import type { PlatformTenantSummary } from '@barbellix/shared';
import { idStr, isoStr } from '../../lib/mappers-base.js';
import { toDomainUser } from '../../lib/mappers.js';
import { NotFoundError } from '../../lib/errors.js';
import * as repo from './repository.js';

/**
 * Platform-wide view across every tenant - the one capability that structurally cannot belong to
 * Admin, since every Admin query in this codebase (and every route guard) is scoped to the
 * caller's own tenantId. This is what actually distinguishes 'superadmin' from 'admin' rather than
 * the two roles being interchangeable labels for the same gym-owner experience.
 */
export async function listTenants(): Promise<PlatformTenantSummary[]> {
  const tenants = await repo.findAllTenants();

  const [memberCounts, trainerCounts, activeCounts, injuryCounts] = await Promise.all([
    repo.countMembersByTenant(),
    repo.countTrainersByTenant(),
    repo.countActiveMembershipsByTenant(),
    repo.countMembersWithInjuriesByTenant(),
  ]);

  return tenants.map((tenant) => {
    const id = idStr(tenant._id);
    return {
      id,
      name: tenant.name,
      planTier: tenant.planTier,
      memberCount: memberCounts.get(id) ?? 0,
      trainerCount: trainerCounts.get(id) ?? 0,
      activeMembershipCount: activeCounts.get(id) ?? 0,
      injuriesReportedCount: injuryCounts.get(id) ?? 0,
      createdAt: isoStr(tenant.createdAt),
    };
  });
}

/** Platform-wide reassignment of a trainer's oversight - only reachable via a superadmin-only
 * route (see routes.ts), since escalating/de-escalating who manages a trainer's permissions is a
 * platform-level decision, not something a tenant admin should be able to grant themselves. */
export async function setTrainerReportsTo(trainerId: string, reportsToRole: 'admin' | 'superadmin') {
  const updated = await repo.updateTrainerReportsTo(trainerId, reportsToRole);
  if (!updated) throw new NotFoundError('Trainer not found');
  return toDomainUser(updated);
}
