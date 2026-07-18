import type { HydratedDocument } from 'mongoose';
import type { User } from '@fitpulse/shared';
import type { UserDocument } from '../db/models/User.js';

export function toDomainUser(doc: HydratedDocument<UserDocument>): User {
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
