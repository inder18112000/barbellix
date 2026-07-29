import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, ActivityIndicator, StyleSheet as RNStyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { pairDevice } from '../../api/auth';
import { BrandMark } from '../../components/common/BrandMark';
import { styles, SCANNER_SIZE } from './ScanToSignInScreen.styles';

// Mirrors QRCheckInScreen's laser-line scan animation for a consistent scanning feel.
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

export function ScanToSignInScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { mutate: doPair, isPending } = useMutation({
    mutationFn: (token: string) => pairDevice(token),
    onSuccess: ({ user, accessToken, refreshToken }) => login(user, accessToken, refreshToken),
    onError: () => {
      setErrorMsg('This code has expired or already been used. Generate a new one from the front desk and try again.');
      setTimeout(() => { scannedRef.current = false; }, 2500);
    },
  });

  const handleBarcode = useCallback(({ data }: { data: string }) => {
    if (scannedRef.current || isPending) return;
    scannedRef.current = true;
    setErrorMsg(null);
    doPair(data);
  }, [isPending, doPair]);

  const renderCamera = () => {
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
          <Ionicons name="camera-outline" size={40} color={colors.textMuted} />
          <Text style={[styles.cameraText, { marginTop: 12 }]}>Camera access needed</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Access</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (isPending) {
      return (
        <View style={styles.cameraPlaceholder}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.cameraText, { marginTop: 10 }]}>Signing you in…</Text>
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
    <View style={[styles.container, { flex: 1, backgroundColor: colors.background }]}>
      <BrandMark size={40} style={styles.logoMark} />
      <Text style={styles.heading}>Scan to sign in</Text>
      <Text style={styles.instruction}>
        Ask the front desk to generate a sign-in code from the Admin Portal, then scan it here.
      </Text>

      {errorMsg && (
        <View style={[styles.statusBanner, styles.statusBannerError]}>
          <Ionicons name="alert-circle" size={18} color={colors.error} />
          <Text style={styles.statusBannerText}>{errorMsg}</Text>
        </View>
      )}

      <View style={styles.scannerFrame}>
        {renderCamera()}
        {(['TL', 'TR', 'BL', 'BR'] as const).map((pos) => (
          <View
            key={pos}
            style={[styles.corner, styles[('corner' + pos) as keyof typeof styles] as any, { borderColor: colors.primary }]}
          />
        ))}
        {permission?.granted && !isPending && <LaserLine />}
      </View>

      <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
        <Text style={styles.backLinkText}>← Back to password sign in</Text>
      </TouchableOpacity>
    </View>
  );
}
