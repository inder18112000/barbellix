import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { FormInput } from '../../components/common/FormInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { api } from '../../api/client';
import { styles } from './RegisterScreen.styles';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterScreen() {
  const navigation = useNavigation<any>();
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  });

  const { mutate: doRegister, isPending } = useMutation({
    mutationFn: (data: RegisterForm) => api.post('/auth/register', data),
    onSuccess: () => navigation.navigate('GoalSelection'),
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
