import type { HydratedDocument } from 'mongoose';
import type { HabitEntry, HabitId } from '@fitpulse/shared';
import { HabitEntryModel, type HabitEntryDocument } from '../../db/models/HabitEntry.js';

export function toDomainHabit(doc: HydratedDocument<HabitEntryDocument>): HabitEntry {
  return {
    habitId: doc.habitId,
    date: doc.date,
    completed: doc.completed,
    value: doc.value,
  };
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function findToday(userId: string) {
  return HabitEntryModel.find({ userId, date: todayKey() });
}

export async function findOneToday(userId: string, habitId: HabitId) {
  return HabitEntryModel.findOne({ userId, habitId, date: todayKey() });
}

export async function upsertToday(userId: string, habitId: HabitId, completed: boolean) {
  return HabitEntryModel.findOneAndUpdate(
    { userId, habitId, date: todayKey() },
    { $set: { completed } },
    { new: true, upsert: true },
  );
}
