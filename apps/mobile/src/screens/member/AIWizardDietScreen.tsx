import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { WizardShell } from '../../components/common/WizardShell';
import type { HomeScreenProps } from '../../navigation/types';
import type { DietPreference } from '@barbellix/shared';
import { DIET_PREFERENCES, DIET_PREFERENCE_LABELS } from '@barbellix/shared';
import { styles } from './AIWizard.styles';

interface DietOption { id: DietPreference | 'none'; emoji: string; title: string; description: string }

const DESCRIPTIONS: Record<DietPreference, string> = {
  non_vegetarian: 'Meals can include meat, fish, and eggs',
  vegetarian: 'No meat or fish — dairy and eggs are fine',
  vegan: 'Plant-based only — no animal products',
};
const EMOJI: Record<DietPreference, string> = { non_vegetarian: '🍗', vegetarian: '🥗', vegan: '🌱' };

const OPTIONS: DietOption[] = [
  ...DIET_PREFERENCES.map((id) => ({ id, emoji: EMOJI[id], title: DIET_PREFERENCE_LABELS[id], description: DESCRIPTIONS[id] })),
  { id: 'none', emoji: '🤷', title: 'No preference', description: "The AI won't restrict meal suggestions" },
];

export function AIWizardDietScreen() {
  const navigation = useNavigation<HomeScreenProps<'AIWizardDiet'>['navigation']>();
  const route = useRoute<HomeScreenProps<'AIWizardDiet'>['route']>();
  const [selected, setSelected] = useState<DietOption['id']>(route.params.dietPreference ?? 'none');

  return (
    <WizardShell
      step={3}
      totalSteps={6}
      title="Dietary preference"
      subtitle="Your AI diet chart will strictly follow this — no exceptions."
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          label="Continue →"
          onPress={() => navigation.navigate('AIWizardGymAccess', {
            ...route.params,
            dietPreference: selected === 'none' ? undefined : selected,
          })}
        />
      }
    >
      {OPTIONS.map((option) => {
        const active = option.id === selected;
        return (
          <TouchableOpacity
            key={option.id}
            style={[styles.optionCard, glass.card, active && styles.optionCardActive]}
            onPress={() => setSelected(option.id)}
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
    </WizardShell>
  );
}
