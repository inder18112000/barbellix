import type { HydratedDocument } from 'mongoose';
import type { Sponsor } from '@barbellix/shared';
import { SponsorModel, type SponsorDocument } from '../../db/models/Sponsor.js';
import { idStr } from '../../lib/mappers-base.js';

export function toDomainSponsor(doc: HydratedDocument<SponsorDocument>): Sponsor {
  return {
    id: idStr(doc._id),
    tenantId: idStr(doc.tenantId),
    name: doc.name,
    description: doc.description,
    logoUrl: doc.logoUrl,
    websiteUrl: doc.websiteUrl,
    active: doc.active,
  };
}

export async function findByTenant(tenantId: string, activeOnly: boolean) {
  const filter: Record<string, unknown> = { tenantId };
  if (activeOnly) filter.active = true;
  return SponsorModel.find(filter).sort({ name: 1 });
}

export async function findById(id: string, tenantId: string) {
  return SponsorModel.findOne({ _id: id, tenantId });
}

export async function create(input: {
  tenantId: string;
  name: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
}) {
  return SponsorModel.create(input);
}

export async function update(id: string, tenantId: string, updates: Partial<SponsorDocument>) {
  return SponsorModel.findOneAndUpdate({ _id: id, tenantId }, { $set: updates }, { new: true });
}
