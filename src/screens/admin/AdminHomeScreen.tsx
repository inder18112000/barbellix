import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { colors } from '../../theme';
import { glass, glow } from '../../theme/effects';
import { useAuthStore } from '../../store/authStore';
import { queryKeys, fetchAdminAttendanceAnalytics } from '../../api/queries';
import { styles } from './AdminHomeScreen.styles';

const ALERTS = [
  { id: 'a1', color: colors.error,   text: 'Peak hour capacity at 94% — 3:00–5:00 PM',  time: '5 min ago' },
  { id: 'a2', color: '#FFB347',      text: 'Jake Wilson hasn\'t checked in for 7 days',   time: '1h ago' },
  { id: 'a3', color: colors.success, text: 'Monthly attendance target reached (312 visits)', time: '2h ago' },
];

const NAV_ITEMS = [
  { emoji: '📡', label: 'Live Attendance Feed', screen: 'AttendanceFeed' },
  { emoji: '📊', label: 'Analytics & Reports',  screen: 'Analytics' },
  { emoji: '👥', label: 'Member Management',    screen: 'MemberManagement' },
  { emoji: '⚙️', label: 'Branch Settings',      screen: 'BranchSettings' },
];

function KPICard({ value, label, delta, deltaPositive, emoji }: { value: string; label: string; delta?: string; deltaPositive?: boolean; emoji: string }) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[styles.kpiCard, glass.card, { transform: [{ scale: scaleAnim }] }]}>
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {delta && <Text style={[styles.kpiDelta, { color: deltaPositive ? colors.success : colors.error }]}>{deltaPositive ? '↑' : '↓'} {delta}</Text>}
    </Animated.View>
  );
}

export function AdminHomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { data: analytics } = useQuery({ queryKey: queryKeys.admin.attendanceAnalytics, queryFn: fetchAdminAttendanceAnalytics });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start(); }, []);

  const todayCount = analytics?.at(-1)?.count ?? 47;
  const peakHour = '4:00 PM';
  const totalMembers = 127;
  const activeRate = 73;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView style={{ opacity: fadeAnim }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>{user?.firstName} · {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>

        {/* KPIs */}
        <View style={styles.kpiGrid}>
          <KPICard emoji="🏃" value={String(todayCount)}    label="Today's Check-ins"   delta="12%"  deltaPositive={true} />
          <KPICard emoji="👥" value={String(totalMembers)}  label="Total Members"        delta="3"    deltaPositive={true} />
          <KPICard emoji="📈" value={`${activeRate}%`}      label="Active Rate (30d)"    delta="2%"   deltaPositive={true} />
          <KPICard emoji="⏰" value={peakHour}              label="Peak Hour"            />
        </View>

        {/* Alerts */}
        <Text style={styles.sectionTitle}>Alerts</Text>
        {ALERTS.map((a) => (
          <View key={a.id} style={[styles.alertCard, glass.card]}>
            <View style={[styles.alertDot, { backgroundColor: a.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertText}>{a.text}</Text>
              <Text style={styles.alertTime}>{a.time}</Text>
            </View>
          </View>
        ))}

        {/* Navigation */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Management</Text>
        {NAV_ITEMS.map((item) => (
          <TouchableOpacity key={item.screen} style={[styles.navRow, glass.card]} onPress={() => navigation.navigate(item.screen)} activeOpacity={0.85}>
            <Text style={styles.navEmoji}>{item.emoji}</Text>
            <Text style={styles.navLabel}>{item.label}</Text>
            <Text style={styles.navChevron}>›</Text>
          </TouchableOpacity>
        ))}

      </Animated.ScrollView>
    </SafeAreaView>
  );
}
