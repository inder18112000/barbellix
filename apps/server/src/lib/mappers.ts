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
    // Explicit field-by-field mapping, not a `{...doc.profile}` spread: doc.profile is a live
    // Mongoose subdocument, and spreading one copies its internal `$__parent` bookkeeping
    // property along with it - which is a live reference back to the full parent User document,
    // including passwordHash (a `select: false` field, but that only filters query results, not
    // an already-loaded document, so it's present here whenever the caller had it selected, e.g.
    // the login flow). That leaked the password hash into every API response returning a User.
    profile: {
      goals: doc.profile.goals,
      dob: doc.profile.dob,
      heightCm: doc.profile.heightCm,
      weightKg: doc.profile.weightKg,
      experienceLevel: doc.profile.experienceLevel,
      gender: doc.profile.gender,
      avatarUrl: doc.profile.avatarUrl,
      bio: doc.profile.bio,
      targetWeightKg: doc.profile.targetWeightKg,
      dietPreference: doc.profile.dietPreference,
      gymAccess: doc.profile.gymAccess,
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
