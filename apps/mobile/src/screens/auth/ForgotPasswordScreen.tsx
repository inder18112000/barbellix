import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';

import { glow } from '../../theme/effects';
import { FormInput } from '../../components/common/FormInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { forgotPassword } from '../../api/auth';
import { forgotPasswordSchema as schema, type ForgotPasswordInput as Form } from '@fitpulse/shared';
import { styles } from './ForgotPasswordScreen.styles';

// ─── Success State (SRP) ──────────────────────────────────────────────────────

function SuccessView({ email, onBack }: { email: string; onBack: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[styles.successContainer, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.successIcon, glow.accent]}>
        <Text style={{ fontSize: 40 }}>📧</Text>
      </View>
      <Text style={styles.successTitle}>Check your inbox</Text>
      <Text style={styles.successBody}>
        We sent a reset link to{'\n'}
        <Text style={{ color: '#4F6EF7' }}>{email}</Text>
      </Text>
      <Text style={styles.successHint}>Didn't receive it? Check your spam folder or try again in a few minutes.</Text>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backBtnText}>← Back to Login</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const { control, handleSubmit, getValues, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const { mutate: sendReset, isPending, isError } = useMutation({
    mutationFn: (data: Form) => forgotPassword(data),
    onSuccess: () => { setSentEmail(getValues('email')); setSent(true); },
  });

  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Animated.ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" style={{ opacity: fadeAnim }}>

          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {sent ? (
            <SuccessView email={sentEmail} onBack={() => navigation.navigate('Login')} />
          ) : (
            <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
              <View style={styles.header}>
                <Text style={styles.emoji}>🔐</Text>
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>Enter your email and we'll send you a link to reset your password.</Text>
              </View>

              <View style={styles.card}>
                {isError && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>Something went wrong. Please try again.</Text>
                  </View>
                )}
                <Controller control={control} name="email" render={({ field: { onChange, value, onBlur } }) => (
                  <FormInput label="Email Address" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
                )} />
                <PrimaryButton label="Send Reset Link" onPress={handleSubmit((data) => sendReset(data))} loading={isPending} />
              </View>
            </Animated.View>
          )}

        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
