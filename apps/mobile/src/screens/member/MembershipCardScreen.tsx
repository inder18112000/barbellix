import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'react-native-qrcode-svg';

import { colors, spacing, borderRadius } from '../../theme';
import { glow, glass } from '../../theme/effects';
import { ScreenShell } from '../../components/common/ScreenShell';
import { useAuthStore } from '../../store/authStore';
import { queryKeys, fetchAttendanceSummary } from '../../api/queries';
import { styles, CARD_WIDTH } from './MembershipCardScreen.styles';

// ─── QR Display with rotating token ──────────────────────────────────────────

const REFRESH_SECS = 300; // 5 minutes per bucket

function QRDisplay({ userId }: { userId: string }) {
  const getBucket = () => Math.floor(Date.now() / (REFRESH_SECS * 1000));

  const [bucket, setBucket] = useState(getBucket);
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const bucketStart = getBucket() * REFRESH_SECS * 1000;
    return REFRESH_SECS - Math.floor((Date.now() - bucketStart) / 1000);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setBucket(getBucket());
          return REFRESH_SECS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const refresh = () => {
    setBucket(getBucket());
    setSecondsLeft(REFRESH_SECS);
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const qrValue = `barbellix:checkin:${userId}:${bucket}`;

  return (
    <View style={styles.qrContainer}>
      <View style={styles.qrWrapper}>
        <QRCode value={qrValue} size={160} color="#1C1C1E" backgroundColor="#ffffff" />
      </View>
      <Text style={styles.qrHint}>
        Refreshes in {mins}:{String(secs).padStart(2, '0')}
      </Text>
      <TouchableOpacity onPress={refresh}>
        <Text style={[styles.qrHint, { color: colors.primary, marginTop: 4 }]}>Refresh now</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Flip Card ────────────────────────────────────────────────────────────────

function MemberCard() {
  const { user } = useAuthStore();
  const { data: attendance } = useQuery({ queryKey: queryKeys.attendance.summary, queryFn: fetchAttendanceSummary });
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = React.useState(false);
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleFlip = () => {
    Animated.spring(flipAnim, { toValue: flipped ? 0 : 1, tension: 70, friction: 9, useNativeDriver: true }).start();
    setFlipped(!flipped);
  };

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const cardStyle = { width: CARD_WIDTH, height: 200 };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity onPress={handleFlip} activeOpacity={1}>
        {/* Front — membership info */}
        <Animated.View style={[styles.card, cardStyle, glow.primary, { transform: [{ rotateY: frontRotate }], backfaceVisibility: 'hidden' }]}>
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
            <Text style={styles.cardFlipHint}>Tap to show QR →</Text>
          </View>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
        </Animated.View>

        {/* Back — real QR code */}
        <Animated.View style={[
          styles.card, cardStyle, styles.cardBack,
          { transform: [{ rotateY: backRotate }], backfaceVisibility: 'hidden', position: 'absolute', top: 0, left: 0 },
        ]}>
          <Text style={styles.cardBackTitle}>Scan to Check In</Text>
          <QRDisplay userId={user?.id ?? 'guest'} />
        </Animated.View>
      </TouchableOpacity>
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
        <Text style={styles.note}>
          Your QR code is unique and rotates every 5 minutes for security.{'\n'}
          Tap the card to reveal your QR — show it at the gym entrance.
        </Text>
      </View>
    </ScreenShell>
  );
}
