import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { queryKeys, fetchProgressMetrics, logBodyMetric } from '../../api/queries';
import { ScreenShell } from '../../components/common/ScreenShell';
import { FormInput } from '../../components/common/FormInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import type { BodyMetric } from '@barbellix/shared';
import { styles } from './BodyMetricsScreen.styles';

// Weight alone conflates fat and muscle loss/gain, so hypertrophy-focused members are
// better served by tracking limb/torso circumference trends - reuses the same
// BodyMetric.measurements history already logged above, no new backend needed.
function computeMuscleTrend(metrics: BodyMetric[], key: 'armCm' | 'chestCm') {
  const points = metrics.filter((m) => m.measurements?.[key] != null);
  if (points.length < 2) return null;
  const latest = points[0].measurements![key]!;
  const earliest = points[points.length - 1].measurements![key]!;
  return { latest, delta: latest - earliest };
}

function MuscleStat({ label, trend }: { label: string; trend: { latest: number; delta: number } | null }) {
  if (!trend) {
    return (
      <View style={styles.muscleStat}>
        <Text style={styles.muscleStatLabel}>{label}</Text>
        <Text style={[styles.muscleStatValue, { color: colors.textMuted }]}>--</Text>
      </View>
    );
  }
  const positive = trend.delta > 0;
  return (
    <View style={styles.muscleStat}>
      <Text style={styles.muscleStatLabel}>{label}</Text>
      <Text style={styles.muscleStatValue}>{trend.latest} cm</Text>
      {trend.delta !== 0 && (
        <Text style={[styles.muscleStatDelta, { color: positive ? colors.success : colors.error }]}>
          {positive ? '+' : ''}{trend.delta.toFixed(1)} cm
        </Text>
      )}
    </View>
  );
}

export function BodyMetricsScreen() {
  const navigation = useNavigation();
  const qc = useQueryClient();
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [arm, setArm] = useState('');
  const [thigh, setThigh] = useState('');

  const { data: metrics = [] } = useQuery({
    queryKey: queryKeys.progress.metrics,
    queryFn: fetchProgressMetrics,
  });

  const hasMeasurements = chest || waist || hips || arm || thigh;

  const { mutate: saveMetric, isPending } = useMutation({
    mutationFn: () =>
      logBodyMetric({
        weightKg: weight ? parseFloat(weight) : undefined,
        bodyFatPct: bodyFat ? parseFloat(bodyFat) : undefined,
        measurements: hasMeasurements
          ? {
              chestCm: chest ? parseFloat(chest) : undefined,
              waistCm: waist ? parseFloat(waist) : undefined,
              hipsCm: hips ? parseFloat(hips) : undefined,
              armCm: arm ? parseFloat(arm) : undefined,
              thighCm: thigh ? parseFloat(thigh) : undefined,
            }
          : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.progress.metrics });
      setWeight('');
      setBodyFat('');
      setChest('');
      setWaist('');
      setHips('');
      setArm('');
      setThigh('');
    },
  });

  const canSave = !!(weight || bodyFat || hasMeasurements);

  return (
    <ScreenShell title="Body Metrics" onBack={() => navigation.goBack()}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <View style={[styles.logCard, glass.card]}>
            <Text style={styles.logTitle}>Log Today</Text>
            <View style={styles.logRow}>
              <View style={{ flex: 1 }}>
                <FormInput
                  label="Weight (kg)"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  placeholder="70.5"
                />
              </View>
              <View style={{ flex: 1 }}>
                <FormInput
                  label="Body Fat (%)"
                  value={bodyFat}
                  onChangeText={setBodyFat}
                  keyboardType="decimal-pad"
                  placeholder="18.0"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.measureToggle}
              onPress={() => setShowMeasurements((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.measureToggleText}>
                📏 Measurements {showMeasurements ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {showMeasurements && (
              <>
                <View style={styles.logRow}>
                  <View style={{ flex: 1 }}>
                    <FormInput
                      label="Chest (cm)"
                      value={chest}
                      onChangeText={setChest}
                      keyboardType="decimal-pad"
                      placeholder="100"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormInput
                      label="Waist (cm)"
                      value={waist}
                      onChangeText={setWaist}
                      keyboardType="decimal-pad"
                      placeholder="80"
                    />
                  </View>
                </View>
                <View style={styles.logRow}>
                  <View style={{ flex: 1 }}>
                    <FormInput
                      label="Hips (cm)"
                      value={hips}
                      onChangeText={setHips}
                      keyboardType="decimal-pad"
                      placeholder="96"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormInput
                      label="Arm (cm)"
                      value={arm}
                      onChangeText={setArm}
                      keyboardType="decimal-pad"
                      placeholder="35"
                    />
                  </View>
                </View>
                <View style={[styles.logRow, { justifyContent: 'flex-start' }]}>
                  <View style={{ flex: 1 }}>
                    <FormInput
                      label="Thigh (cm)"
                      value={thigh}
                      onChangeText={setThigh}
                      keyboardType="decimal-pad"
                      placeholder="58"
                    />
                  </View>
                  <View style={{ flex: 1 }} />
                </View>
              </>
            )}

            <View style={styles.logBtn}>
              <PrimaryButton
                label="Log Metrics"
                onPress={() => saveMetric()}
                loading={isPending}
                disabled={!canSave}
              />
            </View>
          </View>

          {(() => {
            const armTrend = computeMuscleTrend(metrics, 'armCm');
            const chestTrend = computeMuscleTrend(metrics, 'chestCm');
            if (!armTrend && !chestTrend) return null;
            return (
              <View style={[styles.muscleCard, glass.cardStrong]}>
                <Text style={styles.muscleTitle}>💪 Muscle Gain Tracker</Text>
                <Text style={styles.muscleSubtitle}>Circumference change since your first log</Text>
                <View style={styles.muscleRow}>
                  <MuscleStat label="Arm" trend={armTrend} />
                  <MuscleStat label="Chest" trend={chestTrend} />
                </View>
              </View>
            );
          })()}

          <Text style={styles.sectionTitle}>History</Text>
          {metrics.map((m, i) => {
            const prev = metrics[i + 1];
            const delta =
              prev?.weightKg != null && m.weightKg != null
                ? (m.weightKg - prev.weightKg).toFixed(1)
                : null;
            const positive = delta != null && parseFloat(delta) < 0;
            const ms = m.measurements;
            return (
              <View key={m.id} style={[styles.historyRow, glass.card]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.historyTop}>
                    <Text style={styles.historyDate}>
                      {format(parseISO(m.recordedAt), 'MMM d')}
                    </Text>
                    <Text style={styles.historyVal}>
                      {m.weightKg != null ? `${m.weightKg} kg` : '--'}
                      {m.bodyFatPct != null ? ` | ${m.bodyFatPct}%` : ''}
                    </Text>
                    {delta != null && (
                      <View
                        style={[
                          styles.deltaBadge,
                          { backgroundColor: positive ? colors.success + '25' : colors.error + '25' },
                        ]}
                      >
                        <Text style={[styles.deltaText, { color: positive ? colors.success : colors.error }]}>
                          {parseFloat(delta) > 0 ? '+' : ''}{delta} kg
                        </Text>
                      </View>
                    )}
                  </View>
                  {ms && (
                    <Text style={styles.measureLine}>
                      {[
                        ms.chestCm != null && `C: ${ms.chestCm}`,
                        ms.waistCm != null && `W: ${ms.waistCm}`,
                        ms.hipsCm != null && `H: ${ms.hipsCm}`,
                        ms.armCm != null && `A: ${ms.armCm}`,
                        ms.thighCm != null && `T: ${ms.thighCm}`,
                      ]
                        .filter(Boolean)
                        .join('  ·  ')}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}

        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}
