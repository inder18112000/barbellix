/**
 * GoogleSignInButton -- SRP: owns the Google OAuth request/response lifecycle and hands the
 * verified ID token to the caller.
 *
 * expo-auth-session's Google provider validates its config eagerly, inside the hook, the moment
 * useAuthRequest() is called - it throws synchronously if the platform-appropriate client ID is
 * missing (Android needs androidClientId specifically, it does not fall back to webClientId).
 * Since hooks can't be called conditionally, this component must not be mounted at all when
 * unconfigured - callers should gate on isGoogleSignInConfigured() before rendering it, rather
 * than relying on this component to bail out internally.
 */
import React from 'react';
import { Platform, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { colors, spacing, borderRadius, typography } from '../../theme';

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

/** The specific client ID expo-auth-session's Google provider requires for the current
 * platform - matches its own internal validation, so this predicts exactly when useAuthRequest
 * would throw. */
export function isGoogleSignInConfigured(): boolean {
  if (Platform.OS === 'ios') return !!IOS_CLIENT_ID;
  if (Platform.OS === 'android') return !!ANDROID_CLIENT_ID;
  return !!WEB_CLIENT_ID;
}

interface Props {
  onIdToken: (idToken: string) => void;
  disabled?: boolean;
}

export function GoogleSignInButton({ onIdToken, disabled }: Props) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
  });

  React.useEffect(() => {
    if (response?.type === 'success' && response.authentication?.idToken) {
      onIdToken(response.authentication.idToken);
    }
  }, [response]);

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
        borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md,
        paddingVertical: spacing.md, backgroundColor: colors.surface,
      }}
      disabled={!request || disabled}
      onPress={() => promptAsync()}
      activeOpacity={0.85}
    >
      {!request ? (
        <ActivityIndicator size="small" color={colors.textSecondary} />
      ) : (
        <>
          <Ionicons name="logo-google" size={18} color={colors.textPrimary} />
          <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
