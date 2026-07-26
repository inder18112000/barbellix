import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';

import { Card } from '../../components/common/Card';
import { ScreenShell } from '../../components/common/ScreenShell';
import { queryKeys, bookClassSession } from '../../api/queries';
import type { HomeStackParams } from '../../navigation/types';
import { styles } from './ClassDetailScreen.styles';

type Route = RouteProp<HomeStackParams, 'ClassDetail'>;

export function ClassDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { session } = route.params;
  const qc = useQueryClient();

  const { mutate: book, isPending } = useMutation({
    mutationFn: () => bookClassSession(session.id),
    onSuccess: ({ status }) => {
      qc.invalidateQueries({ queryKey: ['classes', 'schedule'] });
      Alert.alert(
        status === 'booked' ? "You're in!" : 'Added to waitlist',
        status === 'booked'
          ? `See you at ${session.name} on ${format(parseISO(session.date), 'EEE, MMM d')}.`
          : "This class is full - you'll be notified if a spot opens up.",
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    },
    onError: (err: Error) => Alert.alert('Could not book', err.message),
  });

  const alreadyBooked = session.myBookingStatus === 'booked' || session.myBookingStatus === 'waitlisted';
  const isFull = session.bookedCount >= session.capacity;

  return (
    <ScreenShell title="Class Details" onBack={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.heroCard}>
          <Text style={styles.className}>{session.name}</Text>
          <Text style={styles.trainerLine}>with {session.trainerName ?? 'TBD'}</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailPill}>
              <Text style={styles.detailValue}>{format(parseISO(session.date), 'MMM d')}</Text>
              <Text style={styles.detailLabel}>Date</Text>
            </View>
            <View style={styles.detailPill}>
              <Text style={styles.detailValue}>{session.startTime}</Text>
              <Text style={styles.detailLabel}>Start</Text>
            </View>
            <View style={styles.detailPill}>
              <Text style={styles.detailValue}>{session.durationMins}m</Text>
              <Text style={styles.detailLabel}>Duration</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailPill}>
              <Text style={styles.detailValue}>{session.bookedCount}/{session.capacity}</Text>
              <Text style={styles.detailLabel}>Booked</Text>
            </View>
            {session.waitlistCount > 0 && (
              <View style={styles.detailPill}>
                <Text style={styles.detailValue}>{session.waitlistCount}</Text>
                <Text style={styles.detailLabel}>Waitlisted</Text>
              </View>
            )}
          </View>
        </Card>

        {alreadyBooked ? (
          <View style={styles.statusSection}>
            <Text style={styles.statusText}>
              {session.myBookingStatus === 'booked' ? "You're booked into this class." : "You're on the waitlist for this class."}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyBookings')}>
              <Text style={styles.manageLink}>Manage in My Bookings →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.bookBtn, isFull && styles.bookBtnWaitlist]}
            onPress={() => book()}
            disabled={isPending}
            activeOpacity={0.85}
          >
            <Text style={styles.bookBtnText}>
              {isPending ? 'Booking…' : isFull ? 'Join Waitlist' : 'Book This Class'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ScreenShell>
  );
}
