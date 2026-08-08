import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { glass } from '../../theme/effects';
import { FormInput } from '../../components/common/FormInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { WizardShell } from '../../components/common/WizardShell';
import { useAuthStore } from '../../store/authStore';
import type { HomeScreenProps } from '../../navigation/types';
import { styles } from './AIWizard.styles';

const schema = z.object({
  weightKg: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid weight'),
  heightCm: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid height'),
  targetWeightKg: z.string().refine((v) => !v || (!isNaN(Number(v)) && Number(v) > 0), 'Enter a valid target weight'),
});
type FormValues = z.infer<typeof schema>;

export function AIWizardBasicsScreen() {
  const navigation = useNavigation<HomeScreenProps<'AIWizardBasics'>['navigation']>();
  const { user } = useAuthStore();

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      weightKg: user?.profile.weightKg ? String(user.profile.weightKg) : '',
      heightCm: user?.profile.heightCm ? String(user.profile.heightCm) : '',
      targetWeightKg: user?.profile.targetWeightKg ? String(user.profile.targetWeightKg) : '',
    },
  });

  const onSubmit = (values: FormValues) => {
    navigation.navigate('AIWizardGoal', {
      weightKg: Number(values.weightKg),
      heightCm: Number(values.heightCm),
      targetWeightKg: values.targetWeightKg ? Number(values.targetWeightKg) : undefined,
    });
  };

  return (
    <WizardShell
      step={1}
      totalSteps={6}
      title="Let's build your plan"
      subtitle="A few quick details so the AI can calibrate exercises and nutrition to your body."
      onBack={() => navigation.goBack()}
      footer={<PrimaryButton label="Continue →" onPress={handleSubmit(onSubmit)} />}
    >
      <View style={[styles.card, glass.card]}>
        <View style={styles.row}>
          <View style={styles.half}>
            <Controller control={control} name="heightCm" render={({ field: { onChange, value, onBlur } }) => (
              <FormInput label="Height (cm)" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.heightCm?.message} keyboardType="decimal-pad" placeholder="170" />
            )} />
          </View>
          <View style={styles.half}>
            <Controller control={control} name="weightKg" render={({ field: { onChange, value, onBlur } }) => (
              <FormInput label="Current weight (kg)" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.weightKg?.message} keyboardType="decimal-pad" placeholder="70" />
            )} />
          </View>
        </View>
        <Controller control={control} name="targetWeightKg" render={({ field: { onChange, value, onBlur } }) => (
          <FormInput label="Target weight (kg) — optional" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.targetWeightKg?.message} keyboardType="decimal-pad" placeholder="65" />
        )} />
      </View>
    </WizardShell>
  );
}
