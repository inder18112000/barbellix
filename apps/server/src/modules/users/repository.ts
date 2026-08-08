import type { UserProfile, NotificationPreferences, MuscleGroup, InjurySeverity, InjuryCondition } from '@barbellix/shared';
import { UserModel } from '../../db/models/User.js';
import { NotificationPreferencesModel } from '../../db/models/NotificationPreferences.js';

export async function findById(id: string) {
  return UserModel.findById(id);
}

export async function findByIdWithPasswordHash(id: string) {
  return UserModel.findById(id).select('+passwordHash');
}

export async function updateProfile(id: string, partialProfile: Partial<UserProfile>) {
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(partialProfile)) {
    updates[`profile.${key}`] = value;
  }
  return UserModel.findByIdAndUpdate(id, { $set: updates }, { new: true });
}

export async function updateInfo(id: string, updates: { firstName?: string; lastName?: string; phone?: string }) {
  return UserModel.findByIdAndUpdate(id, { $set: updates }, { new: true });
}

export async function updatePasswordHash(id: string, passwordHash: string) {
  return UserModel.findByIdAndUpdate(id, { $set: { passwordHash } });
}

/** $push, not a whole-array replace like updateProfile()'s other fields - injuries are added one
 * at a time from the UI, and letting Mongoose assign the subdocument _id on push avoids the client
 * having to invent one for a brand-new entry. */
export async function addInjury(
  userId: string,
  injury: { bodyPart: MuscleGroup; condition?: InjuryCondition; note?: string; severity: InjurySeverity },
) {
  return UserModel.findByIdAndUpdate(
    userId,
    { $push: { 'profile.injuries': { ...injury, loggedAt: new Date() } } },
    { new: true },
  );
}

export async function removeInjury(userId: string, injuryId: string) {
  return UserModel.findByIdAndUpdate(
    userId,
    { $pull: { 'profile.injuries': { _id: injuryId } } },
    { new: true },
  );
}

export async function findNotificationPreferences(userId: string) {
  return NotificationPreferencesModel.findById(userId);
}

export async function upsertNotificationPreferences(userId: string, partial: Partial<NotificationPreferences>) {
  // MongoDB derives the new document's _id from the query filter on upsert - no need to set it in $set.
  return NotificationPreferencesModel.findByIdAndUpdate(
    userId,
    { $set: partial },
    { new: true, upsert: true },
  );
}
