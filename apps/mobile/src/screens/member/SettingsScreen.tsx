import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { ScreenShell } from '../../components/common/ScreenShell';
import { styles } from './SettingsScreen.styles';

// ─── Segment Control (SRP: unit/value selector) ───────────────────────────────

function SegmentControl<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.segmentRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.segmentBtn, value === opt && styles.segmentBtnActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[styles.segmentText, value === opt && styles.segmentTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Stepper (SRP: numeric increment/decrement) ───────────────────────────────

function Stepper({ value, min, max, step, unit, onChange }: { value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity style={styles.stepperBtn} onPress={() => onChange(Math.max(min, value - step))}>
        <Text style={styles.stepperBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepperValue}>{value}{unit}</Text>
      <TouchableOpacity style={styles.stepperBtn} onPress={() => onChange(Math.min(max, value + step))}>
        <Text style={styles.stepperBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Toggle Row (SRP) ─────────────────────────────────────────────────────────

function ToggleRow({ emoji, label, sub, value, onChange }: { emoji: string; label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={[styles.row, glass.card]}>
      <Text style={styles.rowEmoji}>{emoji}</Text>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary + '80' }}
        thumbColor={value ? colors.primary : colors.textMuted}
      />
    </View>
  );
}

// ─── Control Row (SRP: label + custom right content) ─────────────────────────

function ControlRow({ emoji, label, sub, children }: { emoji: string; label: string; sub?: string; children: React.ReactNode }) {
  return (
    <View style={[styles.row, glass.card]}>
      <Text style={styles.rowEmoji}>{emoji}</Text>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      {children}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function SettingsScreen() {
  const navigation = useNavigation();

  // Training preferences
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [restTimer, setRestTimer] = useState(90);

  // Notifications
  const [workoutReminder, setWorkoutReminder] = useState(true);
  const [streakAlert, setStreakAlert] = useState(true);
  const [aiTips, setAiTips] = useState(true);
  const [checkInConfirm, setCheckInConfirm] = useState(false);

  // App
  const [haptics, setHaptics] = useState(true);
  const [sound, setSound] = useState(false);

  return (
    <ScreenShell title="Settings" onBack={() => navigation.goBack()}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Training */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Training</Text>
            <ControlRow emoji="⚖️" label="Weight Unit" sub="Used across all logged sets">
              <SegmentControl options={['kg', 'lbs'] as const} value={weightUnit} onChange={setWeightUnit} />
            </ControlRow>
            <ControlRow emoji="⏱️" label="Default Rest Timer" sub="Starts automatically after each set">
              <Stepper value={restTimer} min={15} max={300} step={15} unit="s" onChange={setRestTimer} />
            </ControlRow>
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <ToggleRow emoji="🏋️" label="Workout Reminder" sub="Daily push at your usual workout time" value={workoutReminder} onChange={setWorkoutReminder} />
            <ToggleRow emoji="🔥" label="Streak Alert" sub="Reminder if you haven't checked in by 8 PM" value={streakAlert} onChange={setStreakAlert} />
            <ToggleRow emoji="🤖" label="AI Tips" sub="Weekly coaching insights from your AI coach" value={aiTips} onChange={setAiTips} />
            <ToggleRow emoji="✅" label="Check-In Confirmation" sub="Notify me after a successful gym check-in" value={checkInConfirm} onChange={setCheckInConfirm} />
          </View>

          {/* App */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App</Text>
            <ToggleRow emoji="📳" label="Haptic Feedback" sub="Vibration on button presses and set completion" value={haptics} onChange={setHaptics} />
            <ToggleRow emoji="🔊" label="Sound Effects" sub="Audio cues for rest timer and set completion" value={sound} onChange={setSound} />
          </View>

          {/* Version */}
          <Text style={[styles.sectionTitle, { textAlign: 'center', marginTop: 32 }]}>FitPulse v1.0.0</Text>

        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}
