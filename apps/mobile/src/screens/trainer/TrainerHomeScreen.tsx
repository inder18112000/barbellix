import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { glass, glow } from '../../theme/effects';
import { useAuthStore } from '../../store/authStore';
import { useTrainerData } from '../../hooks/useTrainerData';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import { ErrorState } from '../../components/common/ErrorState';
import type { TrainerMemberSummary } from '../../types';
import { styles } from './TrainerHomeScreen.styles';

function StatCard({ value, label, emoji }: { value: string; label: string; emoji: string }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[styles.statCard, glass.card, { transform: [{ scale: scaleAnim }] }]}>
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function MemberRow({ member, onPress }: { member: TrainerMemberSummary; onPress: () => void }) {
  const initials = `${member.firstName[0]}${member.lastName[0]}`;
  const lastSeen = member.lastSeenAt
    ? (() => {
        const diff = Date.now() - new Date(member.lastSeenAt).getTime();
        const hrs = Math.floor(diff / 3600000);
        if (hrs < 1) return 'Just now';
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
      })()
    : 'Unknown';
  return (
    <TouchableOpacity style={[styles.memberRow, glass.card]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.memberName}>{member.firstName} {member.lastName}</Text>
        <Text style={styles.memberSub}>{member.plan} · {lastSeen}</Text>
      </View>
      <View style={styles.streakBadge}>
        <Text style={styles.streakText}>🔥 {member.streak}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function TrainerHomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { members, stats, isLoading, membersError, refetchMembers } = useTrainerData();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  if (isLoading) return (
    <SafeAreaView style={styles.container}>
      <View style={{ padding: 16, gap: 12 }}>
        <SkeletonCard lines={1} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={2} />
      </View>
    </SafeAreaView>
  );

  if (membersError) return <ErrorState message="Could not load member data." onRetry={refetchMembers} />;

  const activeCount = stats?.activeMembersCount ?? members.length;
  const sessionsToday = stats?.sessionsTodayCount ?? 0;
  const attendanceRate = stats?.attendanceRate ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView style={{ opacity: fadeAnim }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.greeting}>Hey, {user?.firstName ?? 'Coach'}</Text>
          <Text style={styles.greetingSub}>You have {activeCount} active members today</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard value={String(activeCount)} label="Active Members" emoji="👥" />
          <StatCard value={String(sessionsToday)} label="Sessions Today" emoji="🏋️" />
          <StatCard value={`${attendanceRate}%`} label="Attendance" emoji="📈" />
        </View>

        <Text style={styles.sectionTitle}>Your Members</Text>
        {members.slice(0, 4).map((m) => (
          <MemberRow key={m.id} member={m} onPress={() => navigation.navigate('MemberDetail', { memberId: m.id })} />
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Quick Actions</Text>
        {[
          { emoji: '👥', label: 'All Members', screen: 'MemberList' },
          { emoji: '📋', label: 'Assign Workout Plan', screen: 'MemberList' },
        ].map((action) => (
          <TouchableOpacity key={action.label} style={[styles.quickAction, glass.card]} onPress={() => navigation.navigate(action.screen)} activeOpacity={0.85}>
            <Text style={styles.qaEmoji}>{action.emoji}</Text>
            <Text style={styles.qaLabel}>{action.label}</Text>
            <Text style={styles.qaChevron}>›</Text>
          </TouchableOpacity>
        ))}

      </Animated.ScrollView>
    </SafeAreaView>
  );
}
