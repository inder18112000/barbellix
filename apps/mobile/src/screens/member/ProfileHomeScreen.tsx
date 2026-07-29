import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, Alert, Share, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../../theme';
import { glass, glow } from '../../theme/effects';
import { useAuthStore } from '../../store/authStore';
import { queryKeys, fetchAttendanceSummary, fetchWorkoutSessions } from '../../api/queries';
import type { ProfileStackParams } from '../../navigation/types';
import { Badge } from '../../components/common/Badge';
import { styles } from './ProfileHomeScreen.styles';

type Nav = NativeStackNavigationProp<ProfileStackParams, 'ProfileHome'>;

const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'Lose Weight',
  build_muscle: 'Build Muscle',
  improve_endurance: 'Endurance',
  increase_strength: 'Strength',
  general_fitness: 'General Fitness',
  sport_performance: 'Sport Performance',
};

function Avatar({ initials }: { initials: string }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[styles.avatar, glow.primary, { transform: [{ scale: scaleAnim }] }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </Animated.View>
  );
}

interface MenuRowProps {
  emoji: string;
  label: string;
  onPress: () => void;
  chevron?: boolean;
  danger?: boolean;
}

function MenuRow({ emoji, label, onPress, chevron = true, danger }: MenuRowProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 7, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity style={[styles.menuRow, glass.card]} onPress={handlePress} activeOpacity={0.8}>
        <Text style={styles.menuEmoji}>{emoji}</Text>
        <Text style={[styles.menuLabel, danger && { color: colors.error }]}>{label}</Text>
        {chevron && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ProfileHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuthStore();

  const { data: attendance } = useQuery({
    queryKey: queryKeys.attendance.summary,
    queryFn: fetchAttendanceSummary,
  });
  const { data: sessions } = useQuery({
    queryKey: queryKeys.workoutSessions,
    queryFn: fetchWorkoutSessions,
  });

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en', { month: 'long', year: 'numeric' })
    : '';
  const expLevel = user?.profile?.experienceLevel ?? 'intermediate';
  const expLabel = expLevel.charAt(0).toUpperCase() + expLevel.slice(1);

  const headerFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);

  const parent = navigation.getParent<any>();

  const handleLogout = () =>
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);

  const handleWorkoutPlans = () => parent?.navigate('Workout');
  const handleBodyMetrics  = () => parent?.navigate('Progress', { screen: 'BodyMetrics' });
  const handlePRs          = () => parent?.navigate('Progress', { screen: 'PersonalRecords' });
  const handleShare        = () => Share.share({ message: 'BarBellix - Feel every rep. Download now!' });
  const handleRate         = () => Linking.openURL('https://apps.apple.com/app/barbellix/id000000000');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Animated.View style={[styles.hero, { opacity: headerFade }]}>
          <Avatar initials={initials} />
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={[styles.expBadge, glass.card]}>
            <Text style={styles.expBadgeText}>{expLabel} | Member since {memberSince}</Text>
          </View>
          <View style={styles.goals}>
            {(user?.profile?.goals ?? []).map((g) => (
              <Badge key={g} label={GOAL_LABELS[g] ?? g} tone="primary" />
            ))}
          </View>
        </Animated.View>

        <View style={styles.statsRow}>
          <View style={[styles.statPill, glass.card]}>
            <Text style={styles.statPillValue}>{sessions?.length ?? 0}</Text>
            <Text style={styles.statPillLabel}>Sessions</Text>
          </View>
          <View style={[styles.statPill, glass.card]}>
            <Text style={styles.statPillValue}>{attendance?.streak ?? 0}</Text>
            <Text style={styles.statPillLabel}>Streak</Text>
          </View>
          <View style={[styles.statPill, glass.card]}>
            <Text style={styles.statPillValue}>{attendance?.totalThisMonth ?? 0}</Text>
            <Text style={styles.statPillLabel}>Check-ins</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.memberCard, glass.cardStrong, glow.primary]}
          onPress={() => navigation.navigate('MembershipCard')}
          activeOpacity={0.85}
        >
          <View>
            <Text style={styles.memberCardLabel}>Membership Card</Text>
            <Text style={styles.memberCardSub}>Tap to show QR for check-in</Text>
          </View>
          <Ionicons name="card" size={28} color={colors.primaryLight} />
        </TouchableOpacity>

        <Text style={styles.menuSection}>Training</Text>
        <MenuRow emoji="📋" label="My Workout Plans"  onPress={handleWorkoutPlans} />
        <MenuRow emoji="📏" label="Body Metrics"      onPress={handleBodyMetrics} />
        <MenuRow emoji="🏆" label="Personal Records"  onPress={handlePRs} />

        <Text style={styles.menuSection}>Account</Text>
        <MenuRow emoji="✏️" label="Edit Profile"   onPress={() => navigation.navigate('EditProfile')} />
        <MenuRow emoji="🔔" label="Notifications"  onPress={() => navigation.navigate('Notifications')} />
        <MenuRow emoji="⚙️" label="Settings"       onPress={() => navigation.navigate('Settings')} />

        <Text style={styles.menuSection}>App</Text>
        <MenuRow emoji="🤝" label="Sponsors"       onPress={() => navigation.navigate('Sponsorship')} />
        <MenuRow emoji="📤" label="Share BarBellix" onPress={handleShare} />
        <MenuRow emoji="⭐" label="Rate the App"   onPress={handleRate} />
        <MenuRow emoji="🚪" label="Log Out"        onPress={handleLogout} chevron={false} danger />

        <Text style={styles.versionText}>BarBellix v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
