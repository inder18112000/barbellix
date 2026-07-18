import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Animated, ActivityIndicator,
  StyleSheet as RNStyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, borderRadius } from '../../theme';
import { glass, glow } from '../../theme/effects';
import { useCheckIn } from '../../hooks/useCheckIn';
import { ScreenShell } from '../../components/common/ScreenShell';
import { styles, SCANNER_SIZE } from './QRCheckInScreen.styles';

// ─── Laser Line ───────────────────────────────────────────────────────────────

function LaserLine() {
  const posAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(posAnim, { toValue: SCANNER_SIZE - 4, duration: 2000, useNativeDriver: true }),
      Animated.timing(posAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={[styles.laserLine, { transform: [{ translateY: posAnim }] }]} />;
}

// ─── Scanner Frame ────────────────────────────────────────────────────────────

interface ScannerFrameProps {
  active: boolean;
  permission: { granted: boolean } | null;
  onRequestPermission: () => Promise<any>;
  onScan: (data: string) => void;
}

function ScannerFrame({ active, permission, onRequestPermission, onScan }: ScannerFrameProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scannedRef = useRef(false);

  useEffect(() => {
    if (!active || !permission?.granted) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.02, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [active, permission?.granted]);

  useEffect(() => { if (active) scannedRef.current = false; }, [active]);

  const handleBarcode = useCallback(({ data }: { data: string }) => {
    if (!active || scannedRef.current) return;
    scannedRef.current = true;
    onScan(data);
    setTimeout(() => { scannedRef.current = false; }, 3000);
  }, [active, onScan]);

  const borderColor = active ? colors.primary : colors.border;

  const renderContent = () => {
    if (!permission) {
      return (
        <View style={styles.cameraPlaceholder}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.cameraText, { marginTop: 10 }]}>Loading camera…</Text>
        </View>
      );
    }
    if (!permission.granted) {
      return (
        <View style={styles.cameraPlaceholder}>
          <Ionicons name="camera-off-outline" size={40} color={colors.textMuted} />
          <Text style={[styles.cameraText, { marginTop: 12 }]}>Camera access needed</Text>
          <TouchableOpacity style={localStyles.permissionBtn} onPress={onRequestPermission}>
            <Text style={localStyles.permissionBtnText}>Grant Access</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <CameraView
        style={RNStyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcode}
      />
    );
  };

  return (
    <Animated.View style={[styles.scannerFrame, { transform: [{ scale: pulseAnim }] }]}>
      {renderContent()}
      {/* Corner overlays on top of camera */}
      {(['TL', 'TR', 'BL', 'BR'] as const).map((pos) => (
        <View
          key={pos}
          style={[styles.corner, styles[('corner' + pos) as keyof typeof styles] as any, { borderColor }]}
        />
      ))}
      {active && permission?.granted && <LaserLine />}
    </Animated.View>
  );
}

const localStyles = RNStyleSheet.create({
  permissionBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  permissionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

// ─── Success Burst ─────────────────────────────────────────────────────────────

function SuccessBurst({ streak }: { streak: number }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
      Animated.sequence([Animated.delay(200), Animated.timing(ring1, { toValue: 1, duration: 600, useNativeDriver: true })]),
      Animated.sequence([Animated.delay(400), Animated.timing(ring2, { toValue: 1, duration: 600, useNativeDriver: true })]),
    ]).start();
  }, []);

  const ring1Scale = ring1.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] });
  const ring1Opacity = ring1.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });
  const ring2Scale = ring2.interpolate({ inputRange: [0, 1], outputRange: [1, 3.5] });
  const ring2Opacity = ring2.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

  return (
    <Animated.View style={[styles.successContainer, { transform: [{ scale: scaleAnim }] }]}>
      <Animated.View style={[styles.ring, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity, borderColor: colors.success }]} />
      <Animated.View style={[styles.ring, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity, borderColor: colors.success }]} />
      <View style={[styles.successCircle, glow.success]}>
        <Ionicons name="checkmark" size={52} color="#fff" />
      </View>
      <Text style={styles.successTitle}>Checked In!</Text>
      <Text style={styles.successStreak}>🔥 {streak} day streak</Text>
    </Animated.View>
  );
}

// ─── PIN Pad ──────────────────────────────────────────────────────────────────

function PinPad({ onSubmit }: { onSubmit: (pin: string) => void }) {
  const [pin, setPin] = useState('');
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'ok'];
  const LABELS: Record<string, string> = { back: 'Del', ok: 'OK' };
  const handleDigit = (d: string) => {
    if (d === 'back') { setPin((p) => p.slice(0, -1)); return; }
    if (d === 'ok') { if (pin.length === 6) onSubmit(pin); return; }
    if (pin.length < 6) setPin((p) => p + d);
  };
  return (
    <View style={[styles.pinPad, glass.card]}>
      <Text style={styles.pinLabel}>Enter today's PIN</Text>
      <View style={styles.pinDots}>
        {Array.from({ length: 6 }, (_, i) => (
          <View key={i} style={[styles.pinDot, i < pin.length && styles.pinDotFilled]} />
        ))}
      </View>
      <View style={styles.pinGrid}>
        {digits.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.pinKey, d === 'ok' && pin.length === 6 && styles.pinKeyConfirm]}
            onPress={() => handleDigit(d)}
          >
            <Text style={[styles.pinKeyText, d === 'ok' && pin.length === 6 && styles.pinKeyTextConfirm]}>
              {LABELS[d] ?? d}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function QRCheckInScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [showPinPad, setShowPinPad] = useState(false);

  const { checkInState, streak, scanQR, enterPin } = useCheckIn(() => navigation.goBack());

  const isProcessing = checkInState === 'processing';

  return (
    <ScreenShell title="Check In" onBack={() => navigation.goBack()}>
      <View style={styles.container}>
        {checkInState === 'success' ? (
          <SuccessBurst streak={streak} />
        ) : (
          <>
            <Text style={styles.instruction}>
              {isProcessing
                ? 'Verifying your check-in…'
                : checkInState === 'error'
                  ? 'Invalid code. Please try again.'
                  : showPinPad
                    ? 'Enter the 6-digit gym PIN'
                    : 'Point camera at the gym QR code'}
            </Text>

            {!showPinPad ? (
              <>
                <ScannerFrame
                  active={checkInState === 'idle'}
                  permission={permission}
                  onRequestPermission={requestPermission}
                  onScan={scanQR}
                />
                <TouchableOpacity
                  style={[styles.simulateBtn, glass.cardStrong, glow.primary]}
                  onPress={() => scanQR('mock_qr_' + Date.now())}
                  disabled={isProcessing}
                >
                  <Text style={styles.simulateBtnText}>
                    {isProcessing ? 'Processing…' : 'Simulate Scan (Dev)'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pinToggle} onPress={() => setShowPinPad(true)}>
                  <Text style={styles.pinToggleText}>No QR? Enter PIN instead</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <PinPad onSubmit={enterPin} />
                <TouchableOpacity style={styles.pinToggle} onPress={() => setShowPinPad(false)}>
                  <Text style={styles.pinToggleText}>← Back to QR scan</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>
    </ScreenShell>
  );
}
