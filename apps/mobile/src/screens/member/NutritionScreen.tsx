import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

import { colors, spacing, borderRadius, typography } from '../../theme';
import { glass } from '../../theme/effects';
import { queryKeys, fetchTodayMeals, logMeal, deleteMeal } from '../../api/queries';
import type { MealEntry, MealType } from '../../types';

const GOAL = { calories: 2200, protein: 160, carbs: 250, fat: 70 };
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎',
};

// SVG ring helper
function MacroRing({ value, max, color, size = 80, stroke = 8, label, unit }: {
  value: number; max: number; color: string; size?: number; stroke?: number; label: string; unit: string;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = Math.min(1, value / max);
  const dash = filled * circumference;

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke={colors.border} fill="none" />
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            strokeWidth={stroke} stroke={color} fill="none"
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            rotation="-90" origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>{value}</Text>
          <Text style={{ fontSize: 9, color: colors.textMuted }}>{unit}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 4 }}>{label}</Text>
    </View>
  );
}

// Add meal modal
function AddMealModal({ visible, onClose, onSave, saving }: {
  visible: boolean; onClose: () => void;
  onSave: (m: Partial<MealEntry>) => void; saving: boolean;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<MealType>('breakfast');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const reset = () => { setName(''); setCalories(''); setProtein(''); setCarbs(''); setFat(''); setType('breakfast'); };

  const handleSave = () => {
    if (!name.trim() || !calories) return;
    onSave({
      name: name.trim(),
      mealType: type,
      calories: Number(calories),
      proteinG: protein ? Number(protein) : undefined,
      carbsG: carbs ? Number(carbs) : undefined,
      fatG: fat ? Number(fat) : undefined,
    });
    reset();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.sheet, glass.card]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Log a Meal</Text>

            {/* Meal type tabs */}
            <View style={styles.typeTabs}>
              {MEAL_TYPES.map(t => (
                <TouchableOpacity
                  key={t} activeOpacity={0.8}
                  style={[styles.typeTab, type === t && styles.typeTabActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeTabText, type === t && styles.typeTabTextActive]}>
                    {MEAL_ICONS[t]} {t[0].toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, glass.card]}
              placeholder="Meal name (e.g. Oats with banana)"
              placeholderTextColor={colors.textMuted}
              value={name} onChangeText={setName}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Calories *</Text>
                <TextInput style={[styles.input, glass.card]} keyboardType="numeric" placeholder="420" placeholderTextColor={colors.textMuted} value={calories} onChangeText={setCalories} />
              </View>
            </View>

            <View style={styles.row}>
              {[{ label: 'Protein (g)', val: protein, set: setProtein }, { label: 'Carbs (g)', val: carbs, set: setCarbs }, { label: 'Fat (g)', val: fat, set: setFat }].map(f => (
                <View key={f.label} style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{f.label}</Text>
                  <TextInput style={[styles.input, glass.card]} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textMuted} value={f.val} onChangeText={f.set} />
                </View>
              ))}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { reset(); onClose(); }} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!name.trim() || !calories) && { opacity: 0.5 }]}
                onPress={handleSave} disabled={saving || !name.trim() || !calories} activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Log Meal'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function NutritionScreen() {
  const navigation = useNavigation();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data: meals = [], isLoading } = useQuery({
    queryKey: queryKeys.nutrition.today,
    queryFn: fetchTodayMeals,
  });

  const { mutate: addMeal, isPending: addingMeal } = useMutation({
    mutationFn: logMeal,
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.nutrition.today }); setShowAdd(false); },
  });

  const { mutate: removeMeal } = useMutation({
    mutationFn: deleteMeal,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.nutrition.today }),
  });

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + (m.proteinG ?? 0),
      carbs: acc.carbs + (m.carbsG ?? 0),
      fat: acc.fat + (m.fatG ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const grouped = MEAL_TYPES.reduce<Record<MealType, MealEntry[]>>(
    (acc, t) => { acc[t] = meals.filter(m => m.mealType === t); return acc; },
    {} as Record<MealType, MealEntry[]>,
  );

  const handleDelete = (id: string) => {
    Alert.alert('Delete meal?', 'This will remove it from today\'s log.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeMeal(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutrition</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Calorie card */}
        <View style={[styles.calorieCard, glass.cardStrong]}>
          <View style={styles.calorieMain}>
            <Text style={styles.calorieNum}>{totals.calories}</Text>
            <Text style={styles.calorieLabel}>/ {GOAL.calories} kcal</Text>
          </View>
          <View style={styles.caloriePill}>
            <Text style={styles.caloriePillText}>
              {GOAL.calories - totals.calories > 0 ? `${GOAL.calories - totals.calories} remaining` : 'Goal reached!'}
            </Text>
          </View>
        </View>

        {/* Macro rings */}
        <View style={[styles.macroCard, glass.card]}>
          <MacroRing value={totals.protein} max={GOAL.protein} color="#FF6B35" label="Protein"  unit="g" />
          <MacroRing value={totals.carbs}   max={GOAL.carbs}   color={colors.accent}  label="Carbs"    unit="g" />
          <MacroRing value={totals.fat}     max={GOAL.fat}     color={colors.warning} label="Fat"      unit="g" />
        </View>

        {/* Meal groups */}
        {MEAL_TYPES.map(type => (
          <View key={type} style={styles.mealGroup}>
            <View style={styles.mealGroupHeader}>
              <Text style={styles.mealGroupIcon}>{MEAL_ICONS[type]}</Text>
              <Text style={styles.mealGroupTitle}>{type[0].toUpperCase() + type.slice(1)}</Text>
              {grouped[type].length > 0 && (
                <Text style={styles.mealGroupCal}>
                  {grouped[type].reduce((a, m) => a + m.calories, 0)} kcal
                </Text>
              )}
            </View>
            {grouped[type].length === 0 ? (
              <Text style={styles.emptyMeal}>Nothing logged yet</Text>
            ) : (
              grouped[type].map(meal => (
                <View key={meal.id} style={[styles.mealRow, glass.card]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.mealMacros}>
                      {meal.proteinG != null ? `P: ${meal.proteinG}g  ` : ''}
                      {meal.carbsG != null ? `C: ${meal.carbsG}g  ` : ''}
                      {meal.fatG != null ? `F: ${meal.fatG}g` : ''}
                    </Text>
                  </View>
                  <Text style={styles.mealCal}>{meal.calories} kcal</Text>
                  <TouchableOpacity onPress={() => handleDelete(meal.id)} style={styles.deleteBtn} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ))}

        {isLoading && <Text style={styles.loadingText}>Loading meals…</Text>}
      </ScrollView>

      <AddMealModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={addMeal}
        saving={addingMeal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },
  headerTitle: { flex: 1, ...typography.h3, color: colors.textPrimary },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },

  calorieCard: {
    padding: spacing.lg, borderRadius: borderRadius.xl,
    alignItems: 'center', gap: spacing.xs,
  },
  calorieMain: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  calorieNum: { fontSize: 48, fontWeight: '700', color: colors.textPrimary, lineHeight: 56 },
  calorieLabel: { ...typography.h4, color: colors.textSecondary },
  caloriePill: {
    backgroundColor: colors.primary + '18', borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md, paddingVertical: 4,
  },
  caloriePillText: { ...typography.label, color: colors.primary },

  macroCard: {
    flexDirection: 'row', justifyContent: 'space-around',
    padding: spacing.lg, borderRadius: borderRadius.xl,
  },

  mealGroup: { gap: spacing.xs },
  mealGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  mealGroupIcon: { fontSize: 16 },
  mealGroupTitle: { ...typography.h4, color: colors.textPrimary, flex: 1 },
  mealGroupCal: { ...typography.caption, color: colors.textSecondary },
  emptyMeal: { ...typography.caption, color: colors.textMuted, paddingLeft: spacing.sm, paddingBottom: spacing.xs },
  mealRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderRadius: borderRadius.lg,
  },
  mealName: { ...typography.body, color: colors.textPrimary },
  mealMacros: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  mealCal: { ...typography.label, color: colors.textSecondary },
  deleteBtn: { padding: 4 },

  loadingText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },

  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm,
    borderBottomWidth: 0,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: spacing.sm,
  },
  sheetTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: 4 },
  typeTabs: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  typeTab: {
    paddingHorizontal: spacing.sm, paddingVertical: 6,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  typeTabActive: { backgroundColor: colors.primary + '18', borderColor: colors.primary },
  typeTabText: { ...typography.caption, color: colors.textSecondary },
  typeTabTextActive: { color: colors.primary, fontWeight: '600' },
  input: {
    height: 44, paddingHorizontal: spacing.md,
    ...typography.body, color: colors.textPrimary,
    borderRadius: borderRadius.lg,
  },
  inputLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 4, marginLeft: 4 },
  row: { flexDirection: 'row', gap: spacing.sm },
  modalBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  cancelBtn: {
    flex: 1, height: 48, alignItems: 'center', justifyContent: 'center',
    borderRadius: borderRadius.lg, borderWidth: 1.5, borderColor: colors.border,
  },
  cancelBtnText: { ...typography.h4, color: colors.textSecondary },
  saveBtn: {
    flex: 2, height: 48, alignItems: 'center', justifyContent: 'center',
    borderRadius: borderRadius.lg, backgroundColor: colors.primary,
  },
  saveBtnText: { ...typography.h4, color: '#fff' },
});
