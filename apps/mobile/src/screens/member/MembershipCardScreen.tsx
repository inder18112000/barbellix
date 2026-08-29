import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, borderRadius } from '../../theme';
import { glow, glass } from '../../theme/effects';
import { ScreenShell } from '../../components/common/ScreenShell';
import { useAuthStore } from '../../store/authStore';
import { queryKeys, fetchAttendanceSummary, fetchMembership, fetchMembershipPlans } from '../../api/queries';
import type { ProfileStackParams } from '../../navigation/types';
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

// ─── Payment status + plan picker ──────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  active: { label: 'Active', color: colors.success, icon: 'checkmark-circle' },
  pending: { label: 'Payment due', color: colors.warning, icon: 'alert-circle' },
  expired: { label: 'Expired', color: colors.error, icon: 'close-circle' },
};

function PaymentSection() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParams>>();
  const membershipQuery = useQuery({ queryKey: queryKeys.membership, queryFn: fetchMembership });
  const plansQuery = useQuery({ queryKey: queryKeys.membershipPlans, queryFn: fetchMembershipPlans });

  const membership = membershipQuery.data;
  const needsPayment = !membership || membership.subscriptionStatus !== 'active';
  const status = STATUS_CONFIG[membership?.subscriptionStatus ?? 'expired'];

  return (
    <View style={sectionStyles.container}>
      <View style={[sectionStyles.statusCard, glass.card]}>
        <View style={sectionStyles.statusRow}>
          <Ionicons name={status.icon} size={20} color={status.color} />
          <Text style={[sectionStyles.statusLabel, { color: status.color }]}>{status.label}</Text>
        </View>
        {membership?.plan && <Text style={sectionStyles.planName}>{membership.plan}</Text>}
        {membership?.endDate && (
          <Text style={sectionStyles.endDate}>
            {membership.subscriptionStatus === 'active' ? 'Renews' : 'Expired'} {new Date(membership.endDate).toLocaleDateString()}
          </Text>
        )}
      </View>

      {needsPayment && (
        <View style={sectionStyles.plansBlock}>
          <Text style={sectionStyles.plansTitle}>Choose a plan</Text>
          {plansQuery.isPending ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
          ) : plansQuery.data && plansQuery.data.length > 0 ? (
            plansQuery.data.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[sectionStyles.planCard, glass.card]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('PaymentCheckout', { planId: plan.id })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={sectionStyles.planCardName}>{plan.name}</Text>
                  <Text style={sectionStyles.planCardPrice}>
                    {plan.currency.toUpperCase()} {(plan.priceCents / 100).toFixed(2)}/{plan.billingInterval}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={sectionStyles.emptyPlans}>No plans available yet - ask the front desk.</Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function MembershipCardScreen() {
  const navigation = useNavigation();
  return (
    <ScreenShell title="Membership Card" onBack={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <MemberCard />
        <PaymentSection />
      </ScrollView>
    </ScreenShell>
  );
}

const sectionStyles = {
  container: { width: '100%' as const, marginTop: spacing.lg },
  statusCard: { borderRadius: borderRadius.lg, padding: spacing.md, gap: 4 },
  statusRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.sm },
  statusLabel: { fontSize: 15, fontWeight: '700' as const },
  planName: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  endDate: { color: colors.textMuted, fontSize: 12 },
  plansBlock: { marginTop: spacing.lg, gap: spacing.sm },
  plansTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' as const, marginBottom: 4 },
  planCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  planCardName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' as const },
  planCardPrice: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  emptyPlans: { color: colors.textMuted, fontSize: 13, textAlign: 'center' as const, marginTop: spacing.md },
};
