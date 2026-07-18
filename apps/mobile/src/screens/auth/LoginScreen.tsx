import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { FormInput } from '../../components/common/FormInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { useAuthStore } from '../../store/authStore';
import { login as loginRequest } from '../../api/auth';
import { loginSchema, type LoginInput as LoginForm } from '@fitpulse/shared';
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.logoSection}>
            <Text style={styles.logoEmoji}>⚡</Text>
            <Text style={styles.logoText}>FitPulse</Text>
            <Text style={styles.tagline}>Feel every rep.</Text>
          </View>

          <View style={[styles.card, glass.card]}>
            <Text style={styles.cardTitle}>Welcome back</Text>

            {isError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>⚠️ Invalid email or password</Text>
              </View>
            )}

            <Controller control={control} name="email" render={({ field: { onChange, value, onBlur } }) => (
              <FormInput label="Email" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
            )} />

            <Controller control={control} name="password" render={({ field: { onChange, value, onBlur } }) => (
              <FormInput label="Password" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} secureTextEntry={!showPassword} autoCapitalize="none" placeholder="••••••••"
                rightIcon={<Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁'}</Text>}
                onRightIconPress={() => setShowPassword((v) => !v)}
              />
            )} />

            <TouchableOpacity style={styles.forgotLink} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotLinkText}>Forgot password?</Text>
            </TouchableOpacity>

            <PrimaryButton label="Log In" onPress={handleSubmit((data) => doLogin(data))} loading={isPending} />
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
