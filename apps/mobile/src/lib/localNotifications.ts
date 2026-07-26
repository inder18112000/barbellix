import * as Notifications from 'expo-notifications';

// Both of these are scheduled entirely client-side (no server round-trip, no cron) - the app has
// no scheduled-job infrastructure at all, and neither of these needs one: the daily workout
// reminder is a pure local repeat, and the class reminder is scheduled once at booking time and
// cancelled at cancel time.

const WORKOUT_REMINDER_ID = 'workout-reminder-daily';
const CLASS_REMINDER_MINUTES_BEFORE = 30;

function classReminderId(sessionId: string) {
  return `class-reminder-${sessionId}`;
}

export async function scheduleWorkoutReminder(time: string) {
  await cancelWorkoutReminder();
  const [hour, minute] = time.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return;

  await Notifications.scheduleNotificationAsync({
    identifier: WORKOUT_REMINDER_ID,
    content: { title: 'Time to train 💪', body: "Don't break your streak - get a session in today." },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

export async function cancelWorkoutReminder() {
  await Notifications.cancelScheduledNotificationAsync(WORKOUT_REMINDER_ID).catch(() => {});
}

/** Schedules a one-time local reminder for a booked class, fired shortly before start. No-ops if
 * the reminder window has already passed (e.g. booking a class starting in the next 30 min). */
export async function scheduleClassReminder(sessionId: string, className: string, startsAt: Date) {
  const reminderTime = new Date(startsAt.getTime() - CLASS_REMINDER_MINUTES_BEFORE * 60_000);
  if (reminderTime.getTime() <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: classReminderId(sessionId),
    content: { title: 'Class starting soon', body: `${className} starts in ${CLASS_REMINDER_MINUTES_BEFORE} minutes.` },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderTime },
  });
}

export async function cancelClassReminder(sessionId: string) {
  await Notifications.cancelScheduledNotificationAsync(classReminderId(sessionId)).catch(() => {});
}
