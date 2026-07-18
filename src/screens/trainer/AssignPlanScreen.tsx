import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { glass } from '../../theme/effects';
import { colors } from '../../theme';
import { ScreenShell } from '../../components/common/ScreenShell';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import { useTrainerData } from '../../hooks/useTrainerData';
import type { TrainerStackParams } from '../../navigation/types';
import { styles } from './AssignPlanScreen.styles';

type Route = RouteProp<TrainerStackParams, 'AssignPlan'>;

const GOAL_EMOJI: Record<string, string> = {
  build_muscle: '💪',
  increase_strength: '🏋️',
  lose_weight: '🔥',
  improve_endurance: '🏃',
  general_fitness: '⭐',
  sport_performance: '🏆',
};

export function AssignPlanScreen() {
  const navigation = useNavigation<any>();
  const { memberId } = useRoute<Route>().params;
  const { plans, plansLoading, assignPlan, assigning } = useTrainerData();
  const [selected, setSelected] = useState<string | null>(null);

  const handleAssign = () => {
    if (!selected) return;
    const plan = plans.find((p) => p.id === selected);
    if (!plan) return;
    assignPlan(
      { memberId, planId: selected },
      {
        onSuccess: () => {
          Alert.alert('Plan Assigned', `"${plan.name}" has been assigned.`, [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
        onError: () => {
          Alert.alert('Error', 'Could not assign plan. Please try again.');
        },
      },
    );
  };

  return (
    <ScreenShell title="Assign Plan" onBack={() => navigation.goBack()}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.info}>
            <Text style={styles.infoText}>
              Select a plan to assign to this member. They will see it immediately in their Workout tab.
            </Text>
          </View>

          {plansLoading ? (
            <View style={{ gap: 12 }}>
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
            </View>
          ) : (
            plans.map((plan) => {
              const active = selected === plan.id;
              const emoji = GOAL_EMOJI[plan.goal] ?? 'Plan';
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    glass.card,
                    active && styles.planCardActive,
                    active && { shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
                  ]}
                  onPress={() => setSelected(plan.id)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.planEmoji}>{emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planMeta}>{plan.days.length} days/wk · {plan.goal.replace(/_/g, ' ')}</Text>
                  </View>
                  <View style={[styles.checkCircle, active && styles.checkCircleActive]}>
                    {active && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <View style={styles.footer}>
            <PrimaryButton
              label={selected ? 'Assign Plan' : 'Select a plan first'}
              onPress={handleAssign}
              disabled={!selected}
              loading={assigning}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}
