import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { colors } from '../../theme';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { ScreenShell } from '../../components/common/ScreenShell';
import { queryKeys, fetchClassRoster } from '../../api/queries';
import type { TrainerStackParams } from '../../navigation/types';
import { styles } from './ClassRosterDetailScreen.styles';

type Route = RouteProp<TrainerStackParams, 'ClassRosterDetail'>;

export function ClassRosterDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { sessionId, className } = route.params;

  const { data, isPending } = useQuery({
    queryKey: queryKeys.classes.roster(sessionId),
    queryFn: () => fetchClassRoster(sessionId),
  });

  return (
    <ScreenShell title={className} onBack={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {isPending ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : !data || data.bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyTitle}>No Bookings Yet</Text>
          </View>
        ) : (
          data.bookings.map((booking) => (
            <Card key={booking.id} style={styles.memberRow}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{booking.memberName ?? 'Unknown member'}</Text>
                {booking.memberEmail && <Text style={styles.memberEmail}>{booking.memberEmail}</Text>}
              </View>
              <Badge label={booking.status} tone={booking.status === 'booked' ? 'success' : 'warning'} />
            </Card>
          ))
        )}
      </ScrollView>
    </ScreenShell>
  );
}
