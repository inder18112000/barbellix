import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { WizardShell } from '../../components/common/WizardShell';
import type { HomeScreenProps } from '../../navigation/types';
import type { FitnessGoal } from '@barbellix/shared';
import { FITNESS_GOALS, FITNESS_GOAL_LABELS } from '@barbellix/shared';
import { styles } from './AIWizard.styles';

interface GoalOption { id: FitnessGoal; emoji: string; title: string; description: string }

const DESCRIPTIONS: Record<FitnessGoal, string> = {
  lose_weight: 'Burn fat with smart cardio + strength combos',
  build_muscle: 'Progressive overload plans for hypertrophy',
  increase_strength: 'Powerlifting-style periodisation and PRs',
  improve_endurance: 'Zone 2 and interval training for your engine',
  general_fitness: 'Balanced mix of strength, cardio, and mobility',
  sport_performance: 'Functional strength and athleticism for your sport',
};
const EMOJI: Record<FitnessGoal, string> = {
  lose_weight: '⚡', build_muscle: '💪', increase_strength: '🏋️',
  improve_endurance: '🏃', general_fitness: '✨', sport_performance: '🏅',
};

/** Exported so AIWizardReviewScreen can resolve the picked FitnessGoal id back to its display
 * title when composing the free-text `goal` string sent to the LLM, without duplicating this list. */
export const GOALS: GoalOption[] = FITNESS_GOALS.map((id) => ({
  id, emoji: EMOJI[id], title: FITNESS_GOAL_LABELS[id], description: DESCRIPTIONS[id],
}));

const DAY_OPTIONS = [3, 4, 5, 6, 7];

export function AIWizardGoalScreen() {
  const navigation = useNavigation<HomeScreenProps<'AIWizardGoal'>['navigation']>();
  const route = useRoute<HomeScreenProps<'AIWizardGoal'>['route']>();
  const [goal, setGoal] = useState<FitnessGoal | undefined>(route.params.goal);
  const [goalNote, setGoalNote] = useState(route.params.goalNote ?? '');
  const [daysPerWeek, setDaysPerWeek] = useState(route.params.daysPerWeek ?? 5);

  return (
    <WizardShell
      step={2}
      totalSteps={6}
      title="What's your goal?"
      subtitle="Pick the one that matters most right now — you can regenerate later as it changes."
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          label="Continue →"
          disabled={!goal}
          onPress={() => navigation.navigate('AIWizardDiet', { ...route.params, goal, goalNote: goalNote.trim() || undefined, daysPerWeek })}
        />
      }
    >
      {GOALS.map((option) => {
        const active = option.id === goal;
        return (
          <TouchableOpacity
            key={option.id}
            style={[styles.optionCard, glass.card, active && styles.optionCardActive]}
            onPress={() => setGoal(option.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.optionEmoji}>{option.emoji}</Text>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, active && { color: colors.primary }]}>{option.title}</Text>
              <Text style={styles.optionDesc}>{option.description}</Text>
            </View>
            <View style={[styles.checkCircle, active && styles.checkCircleActive]}>
              {active && <Text style={styles.checkMark}>✓</Text>}
            </View>
          </TouchableOpacity>
        );
      })}

      <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Anything else the AI should know? (optional)</Text>
      <View style={[styles.card, glass.card]}>
        <TextInput
          value={goalNote}
          onChangeText={setGoalNote}
          placeholder="e.g. training for a half-marathon in 3 months"
          placeholderTextColor={colors.textMuted}
          multiline
          style={{ color: colors.textPrimary, fontSize: 14, minHeight: 44 }}
        />
      </View>

      <Text style={styles.sectionLabel}>Days per week</Text>
      <View style={styles.chipGrid}>
        {DAY_OPTIONS.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.chip, d === daysPerWeek && styles.chipActive]}
            onPress={() => setDaysPerWeek(d)}
          >
            <Text style={[styles.chipText, d === daysPerWeek && styles.chipTextActive]}>{d} days</Text>
          </TouchableOpacity>
        ))}
      </View>
    </WizardShell>
  );
}
