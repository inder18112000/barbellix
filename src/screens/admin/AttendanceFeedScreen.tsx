import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { ScreenShell } from '../../components/common/ScreenShell';
import { styles } from './AttendanceFeedScreen.styles';

interface CheckInEntry { id: string; name: string; method: 'QR' | 'NFC' | 'PIN'; time: string; }

const SEED_ENTRIES: CheckInEntry[] = [
  { id: '1', name: 'Alex Chen',     method: 'QR',  time: '4:58 PM' },
  { id: '2', name: 'Maria Lopez',   method: 'NFC', time: '4:55 PM' },
  { id: '3', name: 'Jake Wilson',   method: 'PIN', time: '4:51 PM' },
  { id: '4', name: 'Sam Park',      method: 'QR',  time: '4:47 PM' },
  { id: '5', name: 'Priya Sharma',  method: 'QR',  time: '4:44 PM' },
];

const METHOD_COLOR: Record<string, string> = {
  QR: colors.primary, NFC: colors.accent, PIN: '#FFB347',
};

const NEW_MEMBERS = ['Chris Lee', 'Tanya Rao', 'Ben Carter', 'Lily Nguyen'];

function CheckInRow({ entry }: { entry: CheckInEntry }) {
  const initials = entry.name.split(' ').map((n) => n[0]).join('');
  const col = METHOD_COLOR[entry.method] ?? colors.primary;
  return (
    <View style={[styles.entryRow, glass.card]}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.entryName}>{entry.name}</Text>
        <Text style={styles.entryMeta}>{entry.time}</Text>
      </View>
      <View style={[styles.methodBadge, { backgroundColor: col + '25', borderWidth: 1, borderColor: col }]}>
        <Text style={[styles.methodText, { color: col }]}>{entry.method}</Text>
      </View>
    </View>
  );
}

export function AttendanceFeedScreen() {
  const navigation = useNavigation();
  const [entries, setEntries] = useState<CheckInEntry[]>(SEED_ENTRIES);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse live dot
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  // Simulate new check-ins every 8s
  useEffect(() => {
    const interval = setInterval(() => {
      const name = NEW_MEMBERS[Math.floor(Math.random() * NEW_MEMBERS.length)];
      const methods: CheckInEntry['method'][] = ['QR', 'NFC', 'PIN'];
      const method = methods[Math.floor(Math.random() * methods.length)];
      const now = new Date();
      const time = now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
      setEntries((prev) => [{ id: String(Date.now()), name, method, time }, ...prev.slice(0, 19)]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScreenShell title="Live Attendance" onBack={() => navigation.goBack()}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={[styles.liveBar, glass.card]}>
          <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
          <Text style={styles.liveText}>LIVE</Text>
          <Text style={styles.liveCount}>{entries.length} check-ins today</Text>
        </View>
        <FlatList
          data={entries}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => <CheckInRow entry={item} />}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </ScreenShell>
  );
}
