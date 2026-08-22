import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { BrandMark } from '../../components/common/BrandMark';
import { FormInput } from '../../components/common/FormInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { GoogleSignInButton, isGoogleSignInConfigured } from '../../components/common/GoogleSignInButton';
import { useAuthStore } from '../../store/authStore';
import { login as loginRequest, loginWithGoogle } from '../../api/auth';
import { loginSchema, type LoginInput as LoginForm } from '@barbellix/shared';
import { styles } from './LoginScreen.styles';

export function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const { mutate: doLogin, isPending, isError } = useMutation({
    mutationFn: (data: LoginForm) => loginRequest(data),
    onSuccess: ({ user, accessToken, refreshToken }) => login(user, accessToken, refreshToken),
  });

  const { mutate: doGoogleLogin, isPending: isGooglePending, isError: isGoogleError } = useMutation({
    mutationFn: (idToken: string) => loginWithGoogle(idToken),
    onSuccess: ({ user, accessToken, refreshToken }) => login(user, accessToken, refreshToken),
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.logoSection}>
            <BrandMark variant="full" size={120} style={styles.logoMark} />
            <Text style={styles.tagline}>Feel every rep.</Text>
          </View>

          <View style={[styles.card, glass.card]}>
            <Text style={styles.cardTitle}>Welcome back</Text>

            {(isError || isGoogleError) && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorBannerText}>{isGoogleError ? 'Google sign-in failed' : 'Invalid email or password'}</Text>
              </View>
            )}

            <Controller control={control} name="email" render={({ field: { onChange, value, onBlur } }) => (
              <FormInput label="Email" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
            )} />

            <Controller control={control} name="password" render={({ field: { onChange, value, onBlur } }) => (
              <FormInput label="Password" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} secureTextEntry={!showPassword} autoCapitalize="none" placeholder="••••••••"
                rightIcon={<Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />}
                onRightIconPress={() => setShowPassword((v) => !v)}
              />
            )} />

            <TouchableOpacity style={styles.forgotLink} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotLinkText}>Forgot password?</Text>
            </TouchableOpacity>

            <PrimaryButton label="Log In" onPress={handleSubmit((data) => doLogin(data))} loading={isPending} />

            {isGoogleSignInConfigured() && (
              <>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <GoogleSignInButton onIdToken={(idToken) => doGoogleLogin(idToken)} disabled={isGooglePending} />
              </>
            )}

            <TouchableOpacity style={styles.scanLink} onPress={() => navigation.navigate('ScanToSignIn')}>
              <Ionicons name="camera-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.scanLinkText}>Scan to sign in</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.registerLink} onPress={() => navigation.replace('Register')}>
            <Text style={styles.registerLinkText}>
              {"Don't have an account? "}<Text style={{ color: colors.primary }}>Sign up free</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
