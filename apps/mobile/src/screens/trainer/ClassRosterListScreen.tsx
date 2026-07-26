import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, addDays } from 'date-fns';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../../theme';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { ScreenShell } from '../../components/common/ScreenShell';
import { queryKeys, fetchClassSchedule } from '../../api/queries';
import { useAuthStore } from '../../store/authStore';
import type { TrainerStackParams } from '../../navigation/types';
import { styles } from './ClassRosterListScreen.styles';

type Nav = NativeStackNavigationProp<TrainerStackParams, 'ClassRosterList'>;

export function ClassRosterListScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();

  const from = format(new Date(), 'yyyy-MM-dd');
  const to = format(addDays(new Date(), 13), 'yyyy-MM-dd');

  const { data: sessions, isPending } = useQuery({
    queryKey: queryKeys.classes.schedule(user?.branchId ?? '', from, to),
    queryFn: () => fetchClassSchedule(user!.branchId!, from, to),
    enabled: !!user?.branchId,
  });

  const grouped = (sessions ?? []).reduce<Record<string, typeof sessions>>((acc, s) => {
    (acc[s.date] ??= []).push(s);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort();

  return (
    <ScreenShell title="Class Rosters" onBack={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {isPending ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : dates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>No Upcoming Classes</Text>
            <Text style={styles.emptyBody}>No sessions scheduled in the next two weeks.</Text>
          </View>
        ) : (
          dates.map((date) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateLabel}>{format(parseISO(date), 'EEEE, MMM d')}</Text>
              {grouped[date]!.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('ClassRosterDetail', { sessionId: session.id, className: session.name })}
                >
                  <Card style={styles.sessionCard}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionName}>{session.name}</Text>
                      <Text style={styles.sessionMeta}>{session.startTime} · {session.durationMins} min</Text>
                    </View>
                    <Badge label={`${session.bookedCount}/${session.capacity}`} tone={session.bookedCount >= session.capacity ? 'warning' : 'success'} />
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </ScreenShell>
  );
}
