import { StyleSheet } from 'react-native';
import { colors, borderRadius } from './index';

// Cards — clean white with subtle shadow for the light theme
export const glass = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardStrong: {
    backgroundColor: '#F0F6FF',
    borderWidth: 1.5,
    borderColor: colors.primary + '40',
    borderRadius: borderRadius.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
});

// Coloured shadows work on iOS; elevation handles Android depth
export const glow = {
  primary: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  accent: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  success: {
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Gradient presets (use with expo-linear-gradient)
export const gradients = {
  primary: ['#0A84FF', '#0066CC'] as const,
  accent: ['#34C759', '#0A84FF'] as const,
  dark: ['#F5F7FA', '#EEF2FB'] as const,
  card: ['#FFFFFF', '#F8FAFB'] as const,
  fire: ['#FF6B35', '#FFB347'] as const,
  success: ['#34C759', '#30D158'] as const,
  hero: ['#F5F7FA', '#EAF3FF', '#F5F7FA'] as const,
};

export const shimmerConfig = {
  colors: [
    'rgba(0,0,0,0.03)',
    'rgba(0,0,0,0.07)',
    'rgba(0,0,0,0.03)',
  ] as const,
  duration: 1200,
};
