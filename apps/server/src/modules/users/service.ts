import type { UserProfile } from '@fitpulse/shared';
import { toDomainUser } from '../../lib/mappers.js';
import { NotFoundError } from '../../lib/errors.js';
import * as repo from './repository.js';

export async function getMe(userId: string) {
  const doc = await repo.findById(userId);
  if (!doc) throw new NotFoundError('User not found');
  return toDomainUser(doc);
}

export async function updateMyProfile(userId: string, partialProfile: Partial<UserProfile>) {
  const doc = await repo.updateProfile(userId, partialProfile);
  if (!doc) throw new NotFoundError('User not found');
  return toDomainUser(doc);
}
