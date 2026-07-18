import { Types, type HydratedDocument } from 'mongoose';
import type { User } from '@fitpulse/shared';
import { UserModel } from '../../db/models/User.js';
import { TenantModel } from '../../db/models/Tenant.js';
import type { UserDocument } from '../../db/models/User.js';

function toDomainUser(doc: HydratedDocument<UserDocument>): User {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    branchId: doc.branchId?.toString(),
    role: doc.role,
    email: doc.email,
    firstName: doc.firstName,
    lastName: doc.lastName,
    profile: doc.profile,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function findUserByEmail(email: string) {
  return UserModel.findOne({ email: email.toLowerCase() }).select('+passwordHash');
}

export async function findUserById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return UserModel.findById(id);
}

export async function createUser(input: {
  tenantId: Types.ObjectId;
  role: 'member';
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
}) {
  return UserModel.create(input);
}

/** Every self-serve registration attaches to a single seeded default tenant (no gym-selection UI yet). */
export async function getOrCreateDefaultTenant() {
  const existing = await TenantModel.findOne({ name: 'FitPulse Default' });
  if (existing) return existing;

  return TenantModel.create({
    name: 'FitPulse Default',
    planTier: 'free',
    themeConfig: { primaryColor: '#4F6EF7', brandName: 'FitPulse' },
  });
}

export { toDomainUser };
