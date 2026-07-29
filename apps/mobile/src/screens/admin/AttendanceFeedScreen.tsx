import React, { useRef, useEffect } from 'react';
import { View, Text, FlatList, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import type { RecentCheckIn, CheckInMethod } from '@barbellix/shared';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { ScreenShell } from '../../components/common/ScreenShell';
import { queryKeys, fetchRecentAttendance } from '../../api/queries';
import { styles } from './AttendanceFeedScreen.styles';

const METHOD_LABEL: Record<CheckInMethod, string> = { qr: 'QR', nfc: 'NFC', pin: 'PIN', manual: 'Manual' };
const METHOD_COLOR: Record<CheckInMethod, string> = { qr: colors.primary, nfc: colors.accent, pin: '#FFB347', manual: colors.textMuted };

function CheckInRow({ entry }: { entry: RecentCheckIn }) {
  const initials = entry.memberName.split(' ').map((n) => n[0]).join('');
  const col = METHOD_COLOR[entry.method];
  const time = new Date(entry.checkedInAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  return (
    <View style={[styles.entryRow, glass.card]}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.entryName}>{entry.memberName}</Text>
        <Text style={styles.entryMeta}>{time}</Text>
      </View>
      <View style={[styles.methodBadge, { backgroundColor: col + '25', borderWidth: 1, borderColor: col }]}>
        <Text style={[styles.methodText, { color: col }]}>{METHOD_LABEL[entry.method]}</Text>
      </View>
    </View>
  );
}

export function AttendanceFeedScreen() {
  const navigation = useNavigation();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Real data, refetched every 15s - not a fabricated feed, but a genuinely "live-ish" one.
  const { data: entries = [], isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.admin.recentAttendance,
    queryFn: () => fetchRecentAttendance(30),
    refetchInterval: 15000,
  });

  // Pulse live dot
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <ScreenShell title="Live Attendance" onBack={() => navigation.goBack()}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={[styles.liveBar, glass.card]}>
          <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
          <Text style={styles.liveText}>LIVE</Text>
          <Text style={styles.liveCount}>{entries.length} check-ins</Text>
        </View>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
        ) : isError ? (
          <Text style={[styles.entryMeta, { textAlign: 'center', marginTop: 32 }]} onPress={() => refetch()}>
            Couldn't load the attendance feed - tap to retry.
          </Text>
        ) : entries.length === 0 ? (
          <Text style={[styles.entryMeta, { textAlign: 'center', marginTop: 32 }]}>No check-ins yet today.</Text>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(e) => e.id}
            renderItem={({ item }) => <CheckInRow entry={item} />}
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </ScreenShell>
  );
}
