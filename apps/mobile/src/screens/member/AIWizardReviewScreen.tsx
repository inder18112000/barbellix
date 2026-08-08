import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { colors } from '../../theme';
import { glass, glow } from '../../theme/effects';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { WizardShell } from '../../components/common/WizardShell';
import { queryKeys, updateProfile, addInjury, generateFullPlan } from '../../api/queries';
import { useAuthStore } from '../../store/authStore';
import type { HomeScreenProps } from '../../navigation/types';
import type { GenerateFullPlanResult } from '@barbellix/shared';
import { INJURY_CONDITION_LABELS, MUSCLE_GROUP_LABELS, DIET_PREFERENCE_LABELS, GYM_ACCESS_LABELS } from '@barbellix/shared';
import { GOALS } from './AIWizardGoalScreen';
import { styles } from './AIWizard.styles';

export function AIWizardReviewScreen() {
  const navigation = useNavigation<HomeScreenProps<'AIWizardReview'>['navigation']>();
  const route = useRoute<HomeScreenProps<'AIWizardReview'>['route']>();
  const { setUser } = useAuthStore();
  const qc = useQueryClient();
  const data = route.params;

  const goalTitle = GOALS.find((g) => g.id === data.goal)?.title ?? data.goal ?? 'General fitness';
  const goalString = data.goalNote ? `${goalTitle}: ${data.goalNote}` : goalTitle;

  const { mutate, isPending, isSuccess, isError, data: result, error } = useMutation<GenerateFullPlanResult>({
    mutationFn: async () => {
      const updatedUser = await updateProfile({
        weightKg: data.weightKg,
        heightCm: data.heightCm,
        targetWeightKg: data.targetWeightKg,
        dietPreference: data.dietPreference,
        gymAccess: data.gymAccess,
      });
      setUser(updatedUser);

      if (data.injuries && data.injuries.length > 0) {
        await Promise.all(data.injuries.map((injury) => addInjury(injury)));
      }

      return generateFullPlan(goalString, data.daysPerWeek ?? 5);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workoutPlans });
      qc.invalidateQueries({ queryKey: queryKeys.nutrition.dietPlans });
      qc.invalidateQueries({ queryKey: queryKeys.me });
    },
  });

  const parent = navigation.getParent();

  if (isSuccess && result) {
    return (
      <WizardShell
        step={6}
        totalSteps={6}
        title="Your plan is ready 🎉"
        onBack={() => navigation.popToTop()}
        footer={<PrimaryButton label="Done" onPress={() => navigation.popToTop()} />}
      >
        <View style={[styles.resultCard, glass.cardStrong, glow.primary]}>
          <Text style={styles.resultEmoji}>{result.workoutPlan ? '🏋️' : '⚠️'}</Text>
          <Text style={styles.resultTitle}>{result.workoutPlan ? 'Workout plan created' : "Workout plan couldn't be generated"}</Text>
          <Text style={styles.resultDesc}>{result.workoutPlan ? `${result.workoutPlan.days.length}-day plan, tailored to your equipment and injuries.` : result.workoutPlanError}</Text>
          {result.workoutPlan && (
            <TouchableOpacity onPress={() => parent?.navigate('Workout')}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>View workout plan →</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.resultCard, glass.card]}>
          <Text style={styles.resultEmoji}>{result.dietPlan ? '🥗' : '⚠️'}</Text>
          <Text style={styles.resultTitle}>{result.dietPlan ? 'Diet plan created' : "Diet plan couldn't be generated"}</Text>
          <Text style={styles.resultDesc}>{result.dietPlan ? `${result.dietPlan.meals.length} meals planned around your calorie target.` : result.dietPlanError}</Text>
          {result.dietPlan && (
            <TouchableOpacity onPress={() => parent?.navigate('Progress', { screen: 'DietPlan' })}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>View diet plan →</Text>
            </TouchableOpacity>
          )}
        </View>
      </WizardShell>
    );
  }

  return (
    <WizardShell
      step={6}
      totalSteps={6}
      title="Review & generate"
      subtitle="This is what the AI will use to build your workout and diet plan."
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          label={isPending ? 'Generating your plan…' : '✨ Generate My Plan'}
          onPress={() => mutate()}
          loading={isPending}
        />
      }
    >
      <View style={[styles.card, glass.card]}>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Height</Text><Text style={styles.summaryValue}>{data.heightCm} cm</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Weight</Text><Text style={styles.summaryValue}>{data.weightKg} kg</Text></View>
        {data.targetWeightKg && (
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Target weight</Text><Text style={styles.summaryValue}>{data.targetWeightKg} kg</Text></View>
        )}
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Goal</Text><Text style={styles.summaryValue}>{goalTitle}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Days per week</Text><Text style={styles.summaryValue}>{data.daysPerWeek ?? 5}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Diet</Text><Text style={styles.summaryValue}>{data.dietPreference ? DIET_PREFERENCE_LABELS[data.dietPreference] : 'No preference'}</Text></View>
        <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}><Text style={styles.summaryLabel}>Equipment</Text><Text style={styles.summaryValue}>{data.gymAccess ? GYM_ACCESS_LABELS[data.gymAccess] : 'Full gym'}</Text></View>
      </View>

      <Text style={styles.sectionLabel}>Injuries the AI will avoid</Text>
      {data.injuries && data.injuries.length > 0 ? (
        <View style={[styles.card, glass.card]}>
          {data.injuries.map((injury, i) => (
            <Text key={i} style={styles.summaryValue}>
              {injury.condition ? INJURY_CONDITION_LABELS[injury.condition] : MUSCLE_GROUP_LABELS[injury.bodyPart]} ({injury.severity})
            </Text>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>None logged</Text>
      )}

      {isError && (
        <Text style={{ color: colors.error, textAlign: 'center', marginTop: 8 }}>
          {error instanceof Error ? error.message : 'Something went wrong — please try again.'}
        </Text>
      )}
      {isPending && <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />}
    </WizardShell>
  );
}
