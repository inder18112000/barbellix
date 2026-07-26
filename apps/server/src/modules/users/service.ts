import type { UserProfile, NotificationPreferences } from '@fitpulse/shared';
import { toDomainUser } from '../../lib/mappers.js';
import { NotFoundError, UnauthorizedError } from '../../lib/errors.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import * as repo from './repository.js';

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  workoutReminders: true,
  workoutReminderTime: '08:00',
  streakAlerts: true,
  aiTips: true,
  checkInConfirmations: true,
  weeklyReport: true,
  personalRecords: true,
  trainerMessages: true,
  classBookings: true,
};

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

export async function updateMyInfo(userId: string, updates: { firstName?: string; lastName?: string; phone?: string }) {
  const doc = await repo.updateInfo(userId, updates);
  if (!doc) throw new NotFoundError('User not found');
  return toDomainUser(doc);
}

export async function changeMyPassword(userId: string, currentPassword: string, newPassword: string) {
  const doc = await repo.findByIdWithPasswordHash(userId);
  if (!doc) throw new NotFoundError('User not found');

  const valid = await verifyPassword(doc.passwordHash, currentPassword);
  if (!valid) throw new UnauthorizedError('Current password is incorrect');

  const passwordHash = await hashPassword(newPassword);
  await repo.updatePasswordHash(userId, passwordHash);
  return { message: 'Password updated' };
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const doc = await repo.findNotificationPreferences(userId);
  if (!doc) return DEFAULT_NOTIFICATION_PREFERENCES;

  return {
    workoutReminders: doc.workoutReminders,
    workoutReminderTime: doc.workoutReminderTime,
    streakAlerts: doc.streakAlerts,
    aiTips: doc.aiTips,
    checkInConfirmations: doc.checkInConfirmations,
    weeklyReport: doc.weeklyReport,
    personalRecords: doc.personalRecords,
    trainerMessages: doc.trainerMessages,
    classBookings: doc.classBookings,
  };
}

export async function updateNotificationPreferences(userId: string, partial: Partial<NotificationPreferences>) {
  const doc = await repo.upsertNotificationPreferences(userId, partial);
  return {
    workoutReminders: doc.workoutReminders,
    workoutReminderTime: doc.workoutReminderTime,
    streakAlerts: doc.streakAlerts,
    aiTips: doc.aiTips,
    checkInConfirmations: doc.checkInConfirmations,
    weeklyReport: doc.weeklyReport,
    personalRecords: doc.personalRecords,
    trainerMessages: doc.trainerMessages,
    classBookings: doc.classBookings,
  };
}
