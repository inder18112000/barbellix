import { Schema, model } from 'mongoose';

export interface NotificationPreferencesDocument {
  _id: string; // userId, for a true 1:1
  workoutReminders: boolean;
  workoutReminderTime: string;
  streakAlerts: boolean;
  aiTips: boolean;
  checkInConfirmations: boolean;
  weeklyReport: boolean;
  personalRecords: boolean;
  trainerMessages: boolean;
}

const notificationPreferencesSchema = new Schema<NotificationPreferencesDocument>({
  _id: { type: String, required: true },
  workoutReminders: { type: Boolean, default: true },
  workoutReminderTime: { type: String, default: '08:00' },
  streakAlerts: { type: Boolean, default: true },
  aiTips: { type: Boolean, default: true },
  checkInConfirmations: { type: Boolean, default: true },
  weeklyReport: { type: Boolean, default: true },
  personalRecords: { type: Boolean, default: true },
  trainerMessages: { type: Boolean, default: true },
});

export const NotificationPreferencesModel = model<NotificationPreferencesDocument>(
  'NotificationPreferences',
  notificationPreferencesSchema,
);
