import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, borderRadius, typography } from '../../theme';
import { glass } from '../../theme/effects';

type FormulaId = 'epley' | 'brzycki' | 'mayhew';

const FORMULAS: { id: FormulaId; label: string; description: string }[] = [
  { id: 'epley',   label: 'Epley',   description: 'Most widely used' },
  { id: 'brzycki', label: 'Brzycki', description: 'Better for <10 reps' },
  { id: 'mayhew',  label: 'Mayhew',  description: 'Higher rep ranges' },
];

function calc1RM(weight: number, reps: number, formula: FormulaId): number {
  if (reps === 1) return weight;
  switch (formula) {
    case 'epley':   return weight * (1 + reps / 30);
    case 'brzycki': return weight * (36 / (37 - reps));
    case 'mayhew':  return (100 * weight) / (52.2 + 41.9 * Math.exp(-0.055 * reps));
  }
}

const PERCENTAGES = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50];

const COLOR_BY_PCT: Record<number, string> = {
  100: colors.primary,
  95: '#17A046',
  90: '#0099CC',
  85: '#6C5CE7',
  80: colors.warning,
  75: '#FF9500',
};

export function OneRMCalculatorScreen() {
  const navigation = useNavigation();
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [formula, setFormula] = useState<FormulaId>('epley');

  const oneRM = useMemo(() => {
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (!w || !r || r < 1 || r > 30 || w <= 0) return null;
    return calc1RM(w, r, formula);
  }, [weight, reps, formula]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>1RM Calculator</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Inputs */}
          <View style={[styles.inputCard, glass.card]}>
            <Text style={styles.inputCardTitle}>Enter your best lift</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={[styles.input, glass.card]}
                  keyboardType="decimal-pad"
                  placeholder="100"
                  placeholderTextColor={colors.textMuted}
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reps</Text>
                <TextInput
                  style={[styles.input, glass.card]}
                  keyboardType="number-pad"
                  placeholder="5"
                  placeholderTextColor={colors.textMuted}
                  value={reps}
                  onChangeText={setReps}
                />
              </View>
            </View>
          </View>

          {/* Formula selector */}
          <View style={[styles.formulaCard, glass.card]}>
            <Text style={styles.inputCardTitle}>Formula</Text>
            <View style={styles.formulaTabs}>
              {FORMULAS.map(f => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.formulaTab, formula === f.id && styles.formulaTabActive]}
                  onPress={() => setFormula(f.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.formulaTabLabel, formula === f.id && styles.formulaTabLabelActive]}>
                    {f.label}
                  </Text>
                  <Text style={[styles.formulaTabDesc, formula === f.id && { color: colors.primary }]}>
                    {f.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Result */}
          {oneRM !== null ? (
            <>
              <View style={[styles.resultCard, glass.cardStrong]}>
                <Text style={styles.resultLabel}>Estimated 1RM</Text>
                <Text style={styles.resultValue}>{oneRM.toFixed(1)}<Text style={styles.resultUnit}> kg</Text></Text>
                <Text style={styles.resultSub}>Based on {weight}kg × {reps} reps ({FORMULAS.find(f => f.id === formula)?.label})</Text>
              </View>

              {/* Percentage table */}
              <Text style={styles.sectionTitle}>Training Zones</Text>
              <View style={[styles.tableCard, glass.card]}>
                {PERCENTAGES.map(pct => {
                  const load = (oneRM * pct / 100).toFixed(1);
                  const color = COLOR_BY_PCT[pct] ?? colors.textMuted;
                  return (
                    <View key={pct} style={styles.tableRow}>
                      <View style={[styles.pctBadge, { backgroundColor: color + '18' }]}>
                        <Text style={[styles.pctText, { color }]}>{pct}%</Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color + '60' }]} />
                      </View>
                      <Text style={styles.loadText}>{load} kg</Text>
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <View style={[styles.emptyCard, glass.card]}>
              <Ionicons name="barbell-outline" size={48} color={colors.primary + '80'} />
              <Text style={styles.emptyTitle}>Enter your lift above</Text>
              <Text style={styles.emptyDesc}>Add weight and reps to see your estimated 1RM and training zones.</Text>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
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

  scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },

  inputCard: { padding: spacing.lg, borderRadius: borderRadius.xl, gap: spacing.md },
  inputCardTitle: { ...typography.h4, color: colors.textPrimary },
  inputRow: { flexDirection: 'row', gap: spacing.md },
  inputGroup: { flex: 1, gap: 6 },
  inputLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  input: {
    height: 52, paddingHorizontal: spacing.md,
    fontSize: 22, fontWeight: '700', color: colors.textPrimary,
    textAlign: 'center', borderRadius: borderRadius.lg,
  },

  formulaCard: { padding: spacing.lg, borderRadius: borderRadius.xl, gap: spacing.md },
  formulaTabs: { flexDirection: 'row', gap: spacing.sm },
  formulaTab: {
    flex: 1, padding: spacing.sm,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceElevated, alignItems: 'center',
  },
  formulaTabActive: { backgroundColor: colors.primary + '12', borderColor: colors.primary },
  formulaTabLabel: { ...typography.label, color: colors.textSecondary, textAlign: 'center' },
  formulaTabLabelActive: { color: colors.primary },
  formulaTabDesc: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: 2 },

  resultCard: { padding: spacing.xl, borderRadius: borderRadius.xl, alignItems: 'center', gap: spacing.xs },
  resultLabel: { ...typography.label, color: colors.primary, letterSpacing: 1 },
  resultValue: { fontSize: 56, fontWeight: '800', color: colors.textPrimary, lineHeight: 64 },
  resultUnit: { fontSize: 20, fontWeight: '400', color: colors.textSecondary },
  resultSub: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },

  sectionTitle: { ...typography.h4, color: colors.textPrimary },

  tableCard: { padding: spacing.md, borderRadius: borderRadius.xl, gap: 6 },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: 36 },
  pctBadge: {
    width: 52, height: 28, borderRadius: borderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  pctText: { ...typography.label },
  barTrack: {
    flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
  loadText: { width: 60, ...typography.label, color: colors.textPrimary, textAlign: 'right' },

  emptyCard: {
    padding: spacing.xxl, borderRadius: borderRadius.xl,
    alignItems: 'center', gap: spacing.md,
  },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  emptyDesc: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
