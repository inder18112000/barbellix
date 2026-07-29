import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { FormInput } from '../../components/common/FormInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { updateProfile } from '../../api/queries';
import { useAuthStore } from '../../store/authStore';
import { bodyStatsSchema, type BodyStatsInput as BodyStatsForm } from '@barbellix/shared';
import type { AuthStackParams } from '../../navigation/types';
import { styles } from './BodyStatsScreen.styles';

const EXPERIENCE_LEVELS = [
  { id: 'beginner',     label: 'Beginner',     desc: 'Less than 1 year', emoji: '🌱' },
  { id: 'intermediate', label: 'Intermediate', desc: '1–3 years',        emoji: '🔥' },
  { id: 'advanced',     label: 'Advanced',     desc: '3+ years',         emoji: '⚡' },
] as const;
type ExperienceLevel = typeof EXPERIENCE_LEVELS[number]['id'];

// ─── Experience Selector (SRP) ────────────────────────────────────────────────

function ExperienceSelector({ value, onChange }: { value: ExperienceLevel; onChange: (v: ExperienceLevel) => void }) {
  return (
    <View style={styles.expRow}>
      {EXPERIENCE_LEVELS.map((level) => (
        <TouchableOpacity
          key={level.id}
          style={[
            styles.expCard,
            glass.card,
            value === level.id && { borderColor: colors.primary, borderWidth: 2 },
          ]}
          onPress={() => onChange(level.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.expEmoji}>{level.emoji}</Text>
          <Text style={[styles.expLabel, value === level.id && { color: colors.primary }]}>{level.label}</Text>
          <Text style={styles.expDesc}>{level.desc}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function BodyStatsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AuthStackParams, 'BodyStats'>>();
  const goals = route.params?.goals ?? [];
  const { setUser, completeOnboarding } = useAuthStore();
  const [experience, setExperience] = useState<ExperienceLevel>('beginner');

  const { control, handleSubmit, formState: { errors } } = useForm<BodyStatsForm>({
    resolver: zodResolver(bodyStatsSchema),
    defaultValues: { heightCm: undefined as any, weightKg: undefined as any },
  });

  // The user was already issued real tokens back in RegisterScreen (beginRegistration) -
  // this call is genuinely authenticated. Saving just updates the profile and finishes
  // onboarding; it doesn't need to fake a login the way it used to.
  const { mutate: saveProfile, isPending } = useMutation({
    mutationFn: (data: BodyStatsForm) =>
      updateProfile({ heightCm: data.heightCm, weightKg: data.weightKg, experienceLevel: experience, goals }),
    onSuccess: (user) => {
      setUser(user);
      completeOnboarding();
    },
  });

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <Text style={styles.title}>Your Starting Point</Text>
            <Text style={styles.subtitle}>This helps us calibrate your AI recommendations. You can update anytime.</Text>
          </View>

          <View style={[styles.card, glass.card]}>
            <Text style={styles.sectionLabel}>Body Measurements</Text>
            <View style={styles.measureRow}>
              <View style={{ flex: 1 }}>
                <Controller control={control} name="heightCm" render={({ field: { onChange, value, onBlur } }) => (
                  <FormInput label="Height (cm)" value={value ? String(value) : ''} onChangeText={onChange} onBlur={onBlur} error={errors.heightCm?.message} keyboardType="decimal-pad" placeholder="170" />
                )} />
              </View>
              <View style={{ flex: 1 }}>
                <Controller control={control} name="weightKg" render={({ field: { onChange, value, onBlur } }) => (
                  <FormInput label="Weight (kg)" value={value ? String(value) : ''} onChangeText={onChange} onBlur={onBlur} error={errors.weightKg?.message} keyboardType="decimal-pad" placeholder="70" />
                )} />
              </View>
            </View>
          </View>

          <View style={[styles.card, glass.card]}>
            <Text style={styles.sectionLabel}>Training Experience</Text>
            <ExperienceSelector value={experience} onChange={setExperience} />
          </View>

          {goals.length > 0 && (
            <View style={[styles.card, glass.card]}>
              <Text style={styles.sectionLabel}>Your Goals</Text>
              <View style={styles.goalChips}>
                {goals.map((g: string) => (
                  <View key={g} style={styles.goalChip}>
                    <Text style={styles.goalChipText}>{g.replace(/_/g, ' ')}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <PrimaryButton label="Let's Go 🚀" onPress={handleSubmit((data) => saveProfile(data))} loading={isPending} />

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip — I'll fill this in later</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
