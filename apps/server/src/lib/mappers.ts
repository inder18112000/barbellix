import type { HydratedDocument } from 'mongoose';
import type { User, InjuryEntry } from '@barbellix/shared';
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
    // profile.injuries[] carries a real Mongoose-assigned _id (needed for $push/$pull CRUD) -
    // explicit id mapping here, not a passthrough, same convention as every other
    // array-of-subdocuments mapper in this codebase (exercises/repository.ts, workouts/repository.ts).
    profile: {
      ...doc.profile,
      injuries: (doc.profile.injuries ?? []).map(toDomainInjury),
    },
    createdAt: isoStr(doc.createdAt),
    assignedTrainerId: doc.assignedTrainerId ? idStr(doc.assignedTrainerId) : undefined,
    trainerPermissions: doc.trainerPermissions,
    reportsToRole: doc.reportsToRole,
  };
}

function toDomainInjury(sub: UserDocument['profile']['injuries'][number]): InjuryEntry {
  return {
    id: idStr(sub._id),
    bodyPart: sub.bodyPart,
    condition: sub.condition,
    note: sub.note,
    severity: sub.severity,
    loggedAt: isoStr(sub.loggedAt),
  };
}
