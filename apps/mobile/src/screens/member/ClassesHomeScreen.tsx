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
import type { HomeStackParams } from '../../navigation/types';
import { styles } from './ClassesHomeScreen.styles';

type Nav = NativeStackNavigationProp<HomeStackParams, 'ClassesHome'>;

function capacityBadge(session: { bookedCount: number; capacity: number; waitlistCount: number; myBookingStatus?: string }) {
  if (session.myBookingStatus === 'booked') return <Badge label="You're in" tone="success" />;
  if (session.myBookingStatus === 'waitlisted') return <Badge label="Waitlisted" tone="warning" />;
  if (session.bookedCount >= session.capacity) return <Badge label="Full - waitlist open" tone="warning" />;
  return <Badge label={`${session.capacity - session.bookedCount} spots left`} tone="success" />;
}

export function ClassesHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();

  const from = format(new Date(), 'yyyy-MM-dd');
  const to = format(addDays(new Date(), 6), 'yyyy-MM-dd');

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
    <ScreenShell
      title="Classes"
      onBack={() => navigation.goBack()}
      rightAction={
        <TouchableOpacity style={styles.myBookingsBtn} onPress={() => navigation.navigate('MyBookings')}>
          <Text style={styles.myBookingsBtnText}>Mine</Text>
        </TouchableOpacity>
      }
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {isPending ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : !user?.branchId ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧘</Text>
            <Text style={styles.emptyTitle}>No Branch Set</Text>
            <Text style={styles.emptyBody}>Ask the front desk to assign you to a branch to see the class schedule.</Text>
          </View>
        ) : dates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧘</Text>
            <Text style={styles.emptyTitle}>No Classes Scheduled</Text>
            <Text style={styles.emptyBody}>Check back soon - your gym hasn't scheduled any classes this week.</Text>
          </View>
        ) : (
          dates.map((date) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateLabel}>{format(parseISO(date), 'EEEE, MMM d')}</Text>
              {grouped[date]!.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('ClassDetail', { session })}
                >
                  <Card style={styles.sessionCard}>
                    <View style={styles.timeBlock}>
                      <Text style={styles.timeText}>{session.startTime}</Text>
                    </View>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionName}>{session.name}</Text>
                      <Text style={styles.sessionTrainer}>{session.trainerName ?? 'TBD'} · {session.durationMins} min</Text>
                    </View>
                    {capacityBadge(session)}
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
