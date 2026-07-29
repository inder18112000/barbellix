import type { HydratedDocument } from 'mongoose';
import type { User } from '@barbellix/shared';
import type { UserDocument } from '../db/models/User.js';
import { idStr, isoStr } from './mappers-base.js';

export function toDomainUser(doc: HydratedDocument<UserDocument>): User {
  return {
    id: idStr(doc._id),
    tenantId: idStr(doc.tenantId),
    branchId: doc.branchId ? idStr(doc.branchId) : undefined,
    role: doc.role,
    status: doc.status,
    email: doc.email,
    phone: doc.phone,
    firstName: doc.firstName,
    lastName: doc.lastName,
    profile: doc.profile,
    createdAt: isoStr(doc.createdAt),
  };
}
