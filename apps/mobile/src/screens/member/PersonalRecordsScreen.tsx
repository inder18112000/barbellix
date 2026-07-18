import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';

import { colors } from '../../theme';
import { glass, glow } from '../../theme/effects';
import { queryKeys, fetchPersonalRecords } from '../../api/queries';
import { ScreenShell } from '../../components/common/ScreenShell';
import { styles } from './PersonalRecordsScreen.styles';

const PODIUM_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const PODIUM_HEIGHTS = [90, 70, 50];

export function PersonalRecordsScreen() {
  const navigation = useNavigation();
  const { data: prs = [] } = useQuery({ queryKey: queryKeys.progress.prs, queryFn: fetchPersonalRecords });

  const top3 = prs.slice(0, 3);
  const rest = prs.slice(3);

  // Group rest by muscle group
  const grouped: Record<string, typeof prs> = {};
  rest.forEach((pr) => {
    const key = pr.exercise?.muscleGroups[0] ?? 'Other';
    (grouped[key] = grouped[key] ?? []).push(pr);
  });

  return (
    <ScreenShell title="Personal Records" onBack={() => navigation.goBack()}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Podium for top 3 */}
          {top3.length > 0 && (
            <View style={styles.podium}>
              {[top3[1], top3[0], top3[2]].map((pr, i) => {
                if (!pr) return <View key={i} style={{ flex: 1 }} />;
                const rank = i === 1 ? 0 : i === 0 ? 1 : 2;
                const col = PODIUM_COLORS[rank];
                const glowStyle = rank === 0 ? glow.primary : {};
                return (
                  <View key={pr.id} style={styles.podiumItem}>
                    <Text style={styles.podiumMedal}>{['🥇','🥈','🥉'][rank]}</Text>
                    <Text style={styles.podiumName} numberOfLines={2}>{pr.exercise?.name ?? 'Exercise'}</Text>
                    <Text style={styles.podiumValue}>{pr.value} {pr.unit}</Text>
                    <View style={[styles.podiumBlock, glowStyle, { height: PODIUM_HEIGHTS[rank], backgroundColor: col + '30', borderWidth: 1, borderColor: col }]}>
                      <Text style={[styles.podiumRank, { color: col }]}>{rank + 1}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Rest grouped by muscle */}
          {Object.entries(grouped).map(([group, groupPrs]) => (
            <View key={group}>
              <Text style={styles.groupTitle}>{group}</Text>
              {groupPrs.map((pr) => (
                <View key={pr.id} style={[styles.prRow, glass.card]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prExercise}>{pr.exercise?.name ?? 'Exercise'}</Text>
                    <Text style={styles.prDate}>{format(parseISO(pr.achievedAt), 'MMM d, yyyy')}</Text>
                  </View>
                  <Text style={styles.prValue}>{pr.value} {pr.unit}</Text>
                </View>
              ))}
            </View>
          ))}

          {prs.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 80, gap: 12 }}>
              <Text style={{ fontSize: 56 }}>🏆</Text>
              <Text style={{ color: colors.textPrimary }}>No records yet</Text>
              <Text style={{ color: colors.textSecondary }}>Complete workouts to set your first PR!</Text>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}
