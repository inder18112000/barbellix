import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';

import { colors } from '../../theme';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { ScreenShell } from '../../components/common/ScreenShell';
import { queryKeys, fetchMyBookings, cancelClassBooking } from '../../api/queries';
import { cancelClassReminder } from '../../lib/localNotifications';
import { styles } from './MyBookingsScreen.styles';

export function MyBookingsScreen() {
  const navigation = useNavigation();
  const qc = useQueryClient();
  const { data: bookings, isPending } = useQuery({ queryKey: queryKeys.classes.myBookings, queryFn: fetchMyBookings });

  const { mutate: cancel } = useMutation({
    mutationFn: ({ bookingId }: { bookingId: string; sessionId: string }) => cancelClassBooking(bookingId),
    onSuccess: (_, { sessionId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.classes.myBookings });
      qc.invalidateQueries({ queryKey: ['classes', 'schedule'] });
      cancelClassReminder(sessionId);
    },
    onError: (err: Error) => Alert.alert("Can't cancel", err.message),
  });

  const confirmCancel = (bookingId: string, sessionId: string, name: string) => {
    Alert.alert('Cancel booking?', `You'll give up your spot in ${name}.`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel booking', style: 'destructive', onPress: () => cancel({ bookingId, sessionId }) },
    ]);
  };

  return (
    <ScreenShell title="My Bookings" onBack={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {isPending ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : !bookings || bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>No Bookings Yet</Text>
            <Text style={styles.emptyBody}>Browse the class schedule and book a spot.</Text>
          </View>
        ) : (
          bookings.map((b) => (
            <Card key={b.id} style={styles.bookingCard}>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingName}>{b.session.name}</Text>
                <Text style={styles.bookingWhen}>
                  {format(parseISO(b.session.date), 'EEE, MMM d')} · {b.session.startTime}
                </Text>
                {b.status === 'waitlisted' && <Badge label="Waitlisted" tone="warning" style={{ marginTop: 6 }} />}
              </View>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => confirmCancel(b.id, b.session.id, b.session.name)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>
    </ScreenShell>
  );
}
