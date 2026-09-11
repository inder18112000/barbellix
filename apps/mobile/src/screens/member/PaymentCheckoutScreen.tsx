import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography } from '../../theme';
import { ScreenShell } from '../../components/common/ScreenShell';
import { queryKeys, createMembershipCheckoutSession, fetchMembership } from '../../api/queries';
import type { ProfileStackParams } from '../../navigation/types';

type Phase = 'creating' | 'checkout-open' | 'confirming' | 'success' | 'timeout' | 'error';

const PAYMENT_RETURN_URL = 'barbellix://payment-return';
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

/**
 * Opens Cashfree's hosted checkout via the system browser (expo-web-browser -
 * openAuthSessionAsync), the same mechanism GoogleSignInButton.tsx uses for OAuth, rather than a
 * WebView or a native Cashfree SDK - no new dependency, no custom dev client needed, stays in
 * Expo Go. The browser's return value is never trusted as proof of payment (a user can dismiss or
 * the redirect can race the webhook) - the webhook is the real source of truth, so after the
 * browser closes this polls GET /me/membership until paymentStatus actually flips, with a timeout
 * in case the webhook is delayed or misconfigured.
 */
export function PaymentCheckoutScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ProfileStackParams, 'PaymentCheckout'>>();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>('creating');
  const pollStartedAt = useRef<number | null>(null);

  const sessionMutation = useMutation({
    mutationFn: () => createMembershipCheckoutSession(route.params.planId, PAYMENT_RETURN_URL),
  });

  const membershipQuery = useQuery({
    queryKey: queryKeys.membership,
    queryFn: fetchMembership,
    enabled: phase === 'confirming',
    refetchInterval: phase === 'confirming' ? POLL_INTERVAL_MS : false,
  });

  useEffect(() => {
    (async () => {
      try {
        const session = await sessionMutation.mutateAsync();
        setPhase('checkout-open');
        const result = await WebBrowser.openAuthSessionAsync(session.checkoutUrl, PAYMENT_RETURN_URL);
        if (result.type === 'cancel' || result.type === 'dismiss') {
          // The member may have completed payment and just closed the tab instead of being
          // auto-redirected - still worth polling rather than assuming cancellation.
        }
        pollStartedAt.current = Date.now();
        setPhase('confirming');
      } catch {
        setPhase('error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== 'confirming' || !membershipQuery.data) return;

    if (membershipQuery.data.subscriptionStatus === 'active') {
      queryClient.invalidateQueries({ queryKey: queryKeys.membership });
      setPhase('success');
      return;
    }

    if (pollStartedAt.current && Date.now() - pollStartedAt.current > POLL_TIMEOUT_MS) {
      setPhase('timeout');
    }
  }, [phase, membershipQuery.data, queryClient]);

  return (
    <ScreenShell title="Payment" onBack={() => navigation.goBack()}>
      <View style={styles.container}>
        {(phase === 'creating' || phase === 'checkout-open' || phase === 'confirming') && (
          <>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.statusText}>
              {phase === 'creating' && 'Setting up checkout…'}
              {phase === 'checkout-open' && 'Complete payment in the browser…'}
              {phase === 'confirming' && 'Confirming your payment…'}
            </Text>
          </>
        )}

        {phase === 'success' && (
          <>
            <Ionicons name="checkmark-circle" size={56} color={colors.success} />
            <Text style={styles.statusText}>Payment confirmed!</Text>
            <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'timeout' && (
          <>
            <Ionicons name="time-outline" size={56} color={colors.warning} />
            <Text style={styles.statusText}>Still confirming your payment - this can take a minute. Check back shortly.</Text>
            <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'error' && (
          <>
            <Ionicons name="alert-circle" size={56} color={colors.error} />
            <Text style={styles.statusText}>Couldn't start checkout. Please try again.</Text>
            <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScreenShell>
  );
}

const styles = {
  container: {
    flex: 1 as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  statusText: { ...typography.body, color: colors.textPrimary, textAlign: 'center' as const },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 999,
    marginTop: spacing.md,
  },
  buttonText: { ...typography.body, color: colors.onPrimary, fontWeight: '700' as const },
};
