import type { HabitId } from '@fitpulse/shared';
import * as repo from './repository.js';

export async function listToday(userId: string) {
  const docs = await repo.findToday(userId);
  return docs.map(repo.toDomainHabit);
}

export async function toggleHabit(userId: string, habitId: HabitId) {
  const existing = await repo.findOneToday(userId, habitId);
  const doc = await repo.upsertToday(userId, habitId, !existing?.completed);
  return repo.toDomainHabit(doc!);
}
