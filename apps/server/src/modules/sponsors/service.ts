import type { Sponsor } from '@barbellix/shared';
import { NotFoundError } from '../../lib/errors.js';
import * as repo from './repository.js';

/** Member-facing view - only ever shows sponsors the admin has marked active. */
export async function listActiveSponsors(tenantId: string): Promise<Sponsor[]> {
  const docs = await repo.findByTenant(tenantId, true);
  return docs.map(repo.toDomainSponsor);
}

/** Admin management view - includes inactive sponsors so they can be re-enabled later. */
export async function listAllSponsors(tenantId: string): Promise<Sponsor[]> {
  const docs = await repo.findByTenant(tenantId, false);
  return docs.map(repo.toDomainSponsor);
}

interface CreateSponsorInput {
  name: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
}

export async function createSponsor(tenantId: string, input: CreateSponsorInput): Promise<Sponsor> {
  const doc = await repo.create({ tenantId, ...input });
  return repo.toDomainSponsor(doc);
}

interface UpdateSponsorInput {
  name?: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  active?: boolean;
}

export async function updateSponsor(tenantId: string, sponsorId: string, updates: UpdateSponsorInput): Promise<Sponsor> {
  const updated = await repo.update(sponsorId, tenantId, updates);
  if (!updated) throw new NotFoundError('Sponsor not found');
  return repo.toDomainSponsor(updated);
}
