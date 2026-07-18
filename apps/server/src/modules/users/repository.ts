import type { UserProfile } from '@fitpulse/shared';
import { UserModel } from '../../db/models/User.js';

export async function findById(id: string) {
  return UserModel.findById(id);
}

export async function updateProfile(id: string, partialProfile: Partial<UserProfile>) {
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(partialProfile)) {
    updates[`profile.${key}`] = value;
  }
  return UserModel.findByIdAndUpdate(id, { $set: updates }, { new: true });
}
