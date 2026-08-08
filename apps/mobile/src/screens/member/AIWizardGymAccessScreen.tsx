import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { WizardShell } from '../../components/common/WizardShell';
import type { HomeScreenProps } from '../../navigation/types';
import type { GymAccess } from '@barbellix/shared';
import { GYM_ACCESS_OPTIONS, GYM_ACCESS_LABELS } from '@barbellix/shared';
import { styles } from './AIWizard.styles';

interface AccessOption { id: GymAccess; emoji: string; title: string; description: string }

const DESCRIPTIONS: Record<GymAccess, string> = {
  full_gym: 'Barbells, machines, cables — the works',
  home_with_dumbbells: 'Bodyweight plus a set of dumbbells',
  home_bodyweight: 'No equipment — just you',
};
const EMOJI: Record<GymAccess, string> = { full_gym: '🏋️', home_with_dumbbells: '🏠', home_bodyweight: '🤸' };

const OPTIONS: AccessOption[] = GYM_ACCESS_OPTIONS.map((id) => ({
  id, emoji: EMOJI[id], title: GYM_ACCESS_LABELS[id], description: DESCRIPTIONS[id],
}));

export function AIWizardGymAccessScreen() {
  const navigation = useNavigation<HomeScreenProps<'AIWizardGymAccess'>['navigation']>();
  const route = useRoute<HomeScreenProps<'AIWizardGymAccess'>['route']>();
  const [selected, setSelected] = useState<GymAccess>(route.params.gymAccess ?? 'full_gym');

  return (
    <WizardShell
      step={4}
      totalSteps={6}
      title="What equipment do you have?"
      subtitle="The AI will only pick exercises you can actually do."
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          label="Continue →"
          onPress={() => navigation.navigate('AIWizardInjuries', { ...route.params, gymAccess: selected })}
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
