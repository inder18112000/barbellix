import React, { useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { spacing, borderRadius } from '../../theme';
import { glow, glass } from '../../theme/effects';
import { ScreenShell } from '../../components/common/ScreenShell';
import { useAuthStore } from '../../store/authStore';
import { queryKeys, fetchAttendanceSummary } from '../../api/queries';
import { styles, CARD_WIDTH } from './MembershipCardScreen.styles';

// ─── Card ─────────────────────────────────────────────────────────────────────

function MemberCard() {
  const { user } = useAuthStore();
  const { data: attendance } = useQuery({ queryKey: queryKeys.attendance.summary, queryFn: fetchAttendanceSummary });
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const cardStyle = { width: CARD_WIDTH, height: 200 };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Animated.View style={[styles.card, cardStyle, glow.primary]}>
        <View style={styles.shimmerOverlay} />
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.cardBrand}>⚡ BarBellix</Text>
            <Text style={styles.cardBrandSub}>Premium Member</Text>
          </View>
          <View style={[styles.streakPill, { backgroundColor: 'rgba(18,18,18,0.15)' }]}>
            <Text style={styles.streakPillText}>🔥 {attendance?.streak ?? 0} streak</Text>
          </View>
        </View>
        <View style={styles.cardBottom}>
          <View>
            <Text style={styles.cardName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.cardId}>#{user?.id.slice(-8).toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
      </Animated.View>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function MembershipCardScreen() {
  const navigation = useNavigation();
  return (
    <ScreenShell title="Membership Card" onBack={() => navigation.goBack()}>
      <View style={styles.container}>
        <MemberCard />
      </View>
    </ScreenShell>
  );
}
