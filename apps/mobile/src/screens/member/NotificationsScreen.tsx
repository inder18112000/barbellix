import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationPreferences } from '@barbellix/shared';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { queryKeys, fetchNotificationPreferences, updateNotificationPreferences } from '../../api/queries';
import { scheduleWorkoutReminder, cancelWorkoutReminder } from '../../lib/localNotifications';
import { styles } from './NotificationsScreen.styles';

const DEFAULT_PREFS: NotificationPreferences = {
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

// ─── Toggle Row (SRP) ─────────────────────────────────────────────────────────

function ToggleRow({
  label,
  sub,
  value,
  onToggle,
}: {
  label: string;
  sub: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={[styles.row, glass.card]}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary + '80' }}
        thumbColor={value ? colors.primary : colors.textMuted}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

// ─── Time Row (SRP) ───────────────────────────────────────────────────────────

const REMINDER_TIMES = ['06:00', '07:00', '08:00', '09:00', '12:00', '17:00', '18:00', '20:00'];

function TimeSelector({
  value,
  onChange,
  enabled,
}: {
  value: string;
  onChange: (t: string) => void;
  enabled: boolean;
}) {
  const idx = REMINDER_TIMES.indexOf(value);
  const next = () => onChange(REMINDER_TIMES[(idx + 1) % REMINDER_TIMES.length]!);
  const prev = () => onChange(REMINDER_TIMES[(idx - 1 + REMINDER_TIMES.length) % REMINDER_TIMES.length]!);

  return (
    <View style={[styles.timeRow, glass.card, !enabled && styles.timeRowDisabled]}>
      <Text style={styles.timeLabel}>Reminder time</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TouchableOpacity onPress={prev} disabled={!enabled}>
          <Text style={{ fontSize: 20, color: enabled ? colors.textPrimary : colors.textMuted }}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.timeValue}>{value}</Text>
        <TouchableOpacity onPress={next} disabled={!enabled}>
          <Text style={{ fontSize: 20, color: enabled ? colors.textPrimary : colors.textMuted }}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);

  const { data: remotePrefs } = useQuery({ queryKey: queryKeys.notificationPreferences, queryFn: fetchNotificationPreferences });
  useEffect(() => { if (remotePrefs) setPrefs(remotePrefs); }, [remotePrefs]);

  const { mutate: savePrefs } = useMutation({
    mutationFn: (updates: Partial<NotificationPreferences>) => updateNotificationPreferences(updates),
    onSuccess: (updated) => qc.setQueryData(queryKeys.notificationPreferences, updated),
  });

  const toggle = (key: keyof NotificationPreferences) => {
    setPrefs((p) => {
      const value = !p[key];
      const updated = { ...p, [key]: value };
      savePrefs({ [key]: value });
      if (key === 'workoutReminders') {
        if (value) scheduleWorkoutReminder(updated.workoutReminderTime);
        else cancelWorkoutReminder();
      }
      return updated;
    });
  };

  const changeReminderTime = (time: string) => {
    setPrefs((p) => ({ ...p, workoutReminderTime: time }));
    savePrefs({ workoutReminderTime: time });
    if (prefs.workoutReminders) scheduleWorkoutReminder(time);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
        </View>

        {/* Workout */}
        <Text style={styles.sectionLabel}>Workout</Text>
        <ToggleRow
          label="Workout Reminders"
          sub="Daily nudge to keep your streak alive"
          value={prefs.workoutReminders}
          onToggle={() => toggle('workoutReminders')}
        />
        <TimeSelector
          value={prefs.workoutReminderTime}
          onChange={changeReminderTime}
          enabled={prefs.workoutReminders}
        />
        <ToggleRow
          label="Personal Record Alerts"
          sub="Celebrate when you hit a new PR"
          value={prefs.personalRecords}
          onToggle={() => toggle('personalRecords')}
        />

        {/* Streaks & Progress */}
        <Text style={styles.sectionLabel}>Streaks & Progress</Text>
        <ToggleRow
          label="Streak Alerts"
          sub="Celebration push at 3, 7, 14, 30, 60, and 100 days"
          value={prefs.streakAlerts}
          onToggle={() => toggle('streakAlerts')}
        />
        <ToggleRow
          label="Weekly Report"
          sub="Sunday summary of volume, sessions, and streak"
          value={prefs.weeklyReport}
          onToggle={() => toggle('weeklyReport')}
        />

        {/* AI Coach */}
        <Text style={styles.sectionLabel}>AI Coach</Text>
        <ToggleRow
          label="AI Tips & Insights"
          sub="Smart nudges based on your training patterns"
          value={prefs.aiTips}
          onToggle={() => toggle('aiTips')}
        />

        {/* Gym */}
        <Text style={styles.sectionLabel}>Gym</Text>
        <ToggleRow
          label="Check-In Confirmations"
          sub="Notification after a successful QR scan"
          value={prefs.checkInConfirmations}
          onToggle={() => toggle('checkInConfirmations')}
        />
        <ToggleRow
          label="Trainer Messages"
          sub="When your trainer sends you a message"
          value={prefs.trainerMessages}
          onToggle={() => toggle('trainerMessages')}
        />
        <ToggleRow
          label="Class Booking Updates"
          sub="Booking confirmed, waitlist promotion, and a reminder before class starts"
          value={prefs.classBookings}
          onToggle={() => toggle('classBookings')}
        />

        <View style={[styles.footer, glass.card]}>
          <Text style={styles.footerText}>
            Push notifications require device permission — you may be prompted the first time a notification is sent.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
