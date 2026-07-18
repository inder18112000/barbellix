import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { FormInput } from '../../components/common/FormInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { useAuthStore } from '../../store/authStore';
import { updateProfile, queryKeys } from '../../api/queries';
import { glow } from '../../theme/effects';
import { styles } from './EditProfileScreen.styles';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  firstName:  z.string().min(1, 'Required'),
  lastName:   z.string().min(1, 'Required'),
  dob:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  heightCm:   z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Invalid height'),
  weightKg:   z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Invalid weight'),
});

type FormValues = z.infer<typeof schema>;

const EXP_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
type ExpLevel = typeof EXP_LEVELS[number];

const GENDERS = [
  { value: 'male', label: '♂ Male' },
  { value: 'female', label: '♀ Female' },
  { value: 'other', label: '⚧ Other' },
  { value: 'prefer_not_to_say', label: '🔒 Prefer not to say' },
] as const;
type Gender = typeof GENDERS[number]['value'];

// ─── Avatar (SRP) ─────────────────────────────────────────────────────────────

function AvatarSection({ initials }: { initials: string }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  useEffect(() => { Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }).start(); }, []);
  return (
    <View style={styles.avatarSection}>
      <Animated.View style={[styles.avatar, glow.primary, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </Animated.View>
      <Text style={styles.avatarEdit}>Tap to change photo</Text>
    </View>
  );
}

// ─── Experience Selector (SRP) ────────────────────────────────────────────────

function ExperienceSelector({ value, onChange }: { value: ExpLevel; onChange: (v: ExpLevel) => void }) {
  return (
    <>
      <Text style={styles.sectionLabel}>Experience Level</Text>
      <View style={styles.expRow}>
        {EXP_LEVELS.map((level) => {
          const active = value === level;
          return (
            <TouchableOpacity
              key={level}
              style={[styles.expChip, active && styles.expChipActive]}
              onPress={() => onChange(level)}
              activeOpacity={0.8}
            >
              <Text style={[styles.expChipText, active && styles.expChipTextActive]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

// ─── Gender Selector (SRP) ────────────────────────────────────────────────────

function GenderSelector({ value, onChange }: { value: Gender; onChange: (v: Gender) => void }) {
  return (
    <>
      <Text style={styles.sectionLabel}>Gender</Text>
      <View style={styles.genderRow}>
        {GENDERS.map(({ value: val, label }) => {
          const active = value === val;
          return (
            <TouchableOpacity
              key={val}
              style={[styles.genderChip, active && styles.genderChipActive]}
              onPress={() => onChange(val)}
              activeOpacity={0.8}
            >
              <Text style={[styles.genderChipText, active && styles.genderChipTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

// ─── Success Toast (SRP) ──────────────────────────────────────────────────────

function SuccessToast({ visible }: { visible: boolean }) {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      slideAnim.setValue(20);
    }
  }, [visible]);
  return (
    <Animated.View style={[styles.successToast, { opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.successText}>✓ Profile saved!</Text>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();

  const [expLevel, setExpLevel] = useState<ExpLevel>(
    (user?.profile?.experienceLevel as ExpLevel) ?? 'intermediate',
  );
  const [gender, setGender] = useState<Gender>(
    (user?.profile?.gender as Gender) ?? 'prefer_not_to_say',
  );
  const [saved, setSaved] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName:  user?.lastName ?? '',
      dob:       user?.profile?.dob ?? '',
      heightCm:  String(user?.profile?.heightCm ?? ''),
      weightKg:  String(user?.profile?.weightKg ?? ''),
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      updateProfile({
        dob:        values.dob,
        heightCm:   Number(values.heightCm),
        weightKg:   Number(values.weightKg),
        experienceLevel: expLevel,
        gender,
        goals:      user?.profile?.goals ?? [],
      }),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      qc.invalidateQueries({ queryKey: queryKeys.me });
      setSaved(true);
      setTimeout(() => { setSaved(false); navigation.goBack(); }, 1500);
    },
  });

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
        </View>

        <AvatarSection initials={initials} />

        <Text style={styles.sectionLabel}>Personal Info</Text>
        <View style={styles.row}>
          <View style={styles.half}>
            <Controller control={control} name="firstName" render={({ field: { onChange, value } }) => (
              <FormInput label="First Name" value={value} onChangeText={onChange} error={errors.firstName?.message} autoCapitalize="words" />
            )} />
          </View>
          <View style={styles.half}>
            <Controller control={control} name="lastName" render={({ field: { onChange, value } }) => (
              <FormInput label="Last Name" value={value} onChangeText={onChange} error={errors.lastName?.message} autoCapitalize="words" />
            )} />
          </View>
        </View>

        <Controller control={control} name="dob" render={({ field: { onChange, value } }) => (
          <FormInput label="Date of Birth" value={value} onChangeText={onChange} error={errors.dob?.message} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
        )} />

        <Text style={styles.sectionLabel}>Body Stats</Text>
        <View style={styles.row}>
          <View style={styles.half}>
            <Controller control={control} name="heightCm" render={({ field: { onChange, value } }) => (
              <FormInput label="Height (cm)" value={value} onChangeText={onChange} error={errors.heightCm?.message} keyboardType="decimal-pad" />
            )} />
          </View>
          <View style={styles.half}>
            <Controller control={control} name="weightKg" render={({ field: { onChange, value } }) => (
              <FormInput label="Weight (kg)" value={value} onChangeText={onChange} error={errors.weightKg?.message} keyboardType="decimal-pad" />
            )} />
          </View>
        </View>

        <ExperienceSelector value={expLevel} onChange={setExpLevel} />
        <GenderSelector value={gender} onChange={setGender} />

        <View style={styles.saveBtn}>
          <PrimaryButton label="Save Changes" onPress={handleSubmit((v) => mutate(v))} loading={isPending} />
        </View>

      </ScrollView>
      <SuccessToast visible={saved} />
    </SafeAreaView>
  );
}
