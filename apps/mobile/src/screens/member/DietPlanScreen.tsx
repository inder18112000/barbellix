import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { queryKeys, fetchDietPlans, generateDietPlan } from '../../api/queries';
import type { DietPlanMeal, MealType } from '@fitpulse/shared';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import { ErrorState } from '../../components/common/ErrorState';
import { Card } from '../../components/common/Card';
import { BottomSheet } from '../../components/common/Modal';
import { styles } from './DietPlanScreen.styles';

const MEAL_META: Record<MealType, { emoji: string; color: string }> = {
  breakfast: { emoji: '🍳', color: '#F59E0B' },
  lunch:     { emoji: '🥗', color: '#10B981' },
  dinner:    { emoji: '🍽️', color: '#7C3AED' },
  snack:     { emoji: '🍎', color: '#EF4444' },
};

// ─── AI plan generator sheet (SRP, mirrors WorkoutHomeScreen's GeneratePlanSheet) ────

function GenerateDietSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [goal, setGoal] = useState('');

  const { mutate: generate, isPending } = useMutation({
    mutationFn: () => generateDietPlan(goal.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.nutrition.dietPlans });
      setGoal('');
      onClose();
    },
  });

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Generate Diet Plan">
      <View>
        <Text style={styles.fieldLabel}>Your Goal</Text>
        <TextInput
          style={[styles.goalInput, { marginTop: 6 }]}
          value={goal}
          onChangeText={setGoal}
          placeholder="e.g. lose fat while keeping strength"
          placeholderTextColor={colors.textMuted}
          editable={!isPending}
        />
      </View>

      <TouchableOpacity
        style={[styles.generateSubmitBtn, (!goal.trim() || isPending) && { opacity: 0.5 }]}
        onPress={() => generate()}
        disabled={!goal.trim() || isPending}
        activeOpacity={0.85}
      >
        <Text style={styles.generateSubmitBtnText}>{isPending ? 'Generating…' : '✨ Generate with AI'}</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}

function MealCard({ meal }: { meal: DietPlanMeal }) {
  const meta = MEAL_META[meal.mealType] ?? MEAL_META.snack;
  const macros = [
    meal.proteinG != null ? `${meal.proteinG}g protein` : null,
    meal.carbsG != null ? `${meal.carbsG}g carbs` : null,
    meal.fatG != null ? `${meal.fatG}g fat` : null,
  ].filter(Boolean).join(' · ');

  return (
    <Card style={styles.mealCard}>
      <View style={[styles.mealEmojiBadge, { backgroundColor: meta.color + '20' }]}>
        <Text style={styles.mealEmoji}>{meta.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.mealType}>{meal.mealType}</Text>
        <Text style={styles.mealName}>{meal.name}</Text>
        {!!macros && <Text style={styles.mealMacros}>{macros}</Text>}
        {meal.notes && <Text style={styles.mealNotes} numberOfLines={2}>{meal.notes}</Text>}
      </View>
      <Text style={styles.mealCalories}>{meal.calories}</Text>
    </Card>
  );
}

export function DietPlanScreen() {
  const navigation = useNavigation();
  const [showGenerate, setShowGenerate] = useState(false);
  const { data: plans = [], isLoading, isError, refetch } = useQuery({ queryKey: queryKeys.nutrition.dietPlans, queryFn: fetchDietPlans });

  if (isLoading) return (
    <SafeAreaView style={styles.container}>
      <View style={{ padding: 16, gap: 12 }}>
        <SkeletonCard lines={1} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={2} />
      </View>
    </SafeAreaView>
  );
  if (isError) return <ErrorState message="Couldn't load your diet plan." onRetry={refetch} />;

  const plan = plans[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Diet Plan</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
          </View>
          {plan && <Text style={styles.subtitle}>{plan.name}</Text>}
        </View>

        {plan ? (
          <>
            <LinearGradient
              colors={['#F59E0B', '#EF4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <Text style={styles.heroCaloriesLabel}>DAILY CALORIE TARGET</Text>
              <Text style={styles.heroCalories}>{plan.dailyCalorieTarget} kcal</Text>
              <View style={styles.macroRow}>
                <View style={styles.macroPill}>
                  <Text style={styles.macroValue}>{plan.dailyProteinG}g</Text>
                  <Text style={styles.macroLabel}>Protein</Text>
                </View>
                <View style={styles.macroPill}>
                  <Text style={styles.macroValue}>{plan.dailyCarbsG}g</Text>
                  <Text style={styles.macroLabel}>Carbs</Text>
                </View>
                <View style={styles.macroPill}>
                  <Text style={styles.macroValue}>{plan.dailyFatG}g</Text>
                  <Text style={styles.macroLabel}>Fat</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Meals</Text>
              <TouchableOpacity style={[styles.regenerateBtn, glass.card]} onPress={() => setShowGenerate(true)}>
                <Text style={styles.regenerateBtnText}>✨ Regenerate with AI</Text>
              </TouchableOpacity>
            </View>
            {plan.meals.map((meal, i) => <MealCard key={i} meal={meal} />)}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🥗</Text>
            <Text style={styles.emptyTitle}>No Diet Plan Yet</Text>
            <Text style={styles.emptyBody}>Ask the AI Coach to build a daily meal plan tailored to your goal.</Text>
            <TouchableOpacity style={styles.aiGenerateBtn} onPress={() => setShowGenerate(true)} activeOpacity={0.85}>
              <Text style={styles.aiGenerateBtnText}>✨ Generate with AI</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      <GenerateDietSheet visible={showGenerate} onClose={() => setShowGenerate(false)} />
    </SafeAreaView>
  );
}
