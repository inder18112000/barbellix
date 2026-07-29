import type { UserProfile, NotificationPreferences } from '@barbellix/shared';
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
