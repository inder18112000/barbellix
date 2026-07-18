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
import { register } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { registerSchema, type RegisterInput as RegisterForm } from '@fitpulse/shared';
import { styles } from './RegisterScreen.styles';

export function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { beginRegistration } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  });

  const { mutate: doRegister, isPending } = useMutation({
    mutationFn: (data: RegisterForm) => register(data),
    onSuccess: async ({ user, accessToken, refreshToken }) => {
      // Real tokens now, not the hardcoded 'mock_token' BodyStatsScreen used to fake -
      // the /me/profile update at the end of onboarding has a valid session to
      // attach to. Not a full login() yet: that would jump straight past the
      // remaining Goals/BodyStats onboarding screens.
      await beginRegistration(user, accessToken, refreshToken);
      navigation.navigate('GoalSelection');
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join FitPulse and start your journey</Text>
          </View>

          <View style={[styles.card, glass.card]}>
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Controller control={control} name="firstName" render={({ field: { onChange, value, onBlur } }) => (
                  <FormInput label="First Name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.firstName?.message} placeholder="John" />
                )} />
              </View>
              <View style={{ flex: 1 }}>
                <Controller control={control} name="lastName" render={({ field: { onChange, value, onBlur } }) => (
                  <FormInput label="Last Name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.lastName?.message} placeholder="Doe" />
                )} />
              </View>
            </View>

            <Controller control={control} name="email" render={({ field: { onChange, value, onBlur } }) => (
              <FormInput label="Email" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
            )} />

            <Controller control={control} name="password" render={({ field: { onChange, value, onBlur } }) => (
              <FormInput label="Password" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} secureTextEntry={!showPassword} autoCapitalize="none" placeholder="Min. 8 characters"
                rightIcon={<Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁'}</Text>}
                onRightIconPress={() => setShowPassword((v) => !v)}
              />
            )} />

            <Controller control={control} name="confirmPassword" render={({ field: { onChange, value, onBlur } }) => (
              <FormInput label="Confirm Password" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.confirmPassword?.message} secureTextEntry={!showPassword} autoCapitalize="none" placeholder="Repeat password" />
            )} />

            <PrimaryButton label="Create Account" onPress={handleSubmit((data) => doRegister(data))} loading={isPending} />

            <Text style={styles.terms}>By signing up you agree to our Terms of Service and Privacy Policy.</Text>
          </View>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.replace('Login')}>
            <Text style={styles.loginLinkText}>Already have an account? <Text style={{ color: colors.primary }}>Log in</Text></Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
