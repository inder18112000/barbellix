import { StyleSheet } from 'react-native';
import { colors, borderRadius } from './index';

// Cards — elevated dark surfaces for the Tech-Forward Powerhouse theme
export const glass = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  cardStrong: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.primary + '40',
    borderRadius: borderRadius.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
});

// Coloured shadows work on iOS; elevation handles Android depth. On the obsidian background
// these read as real neon glow, not just a subtle lift.
export const glow = {
  primary: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  accent: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  success: {
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Gradient presets (use with expo-linear-gradient)
export const gradients = {
  primary: ['#C6FF00', '#9FCC00'] as const,
  accent: ['#C6FF00', '#64D2FF'] as const,
  dark: ['#121212', '#1C1C1E'] as const,
  card: ['#1C1C1E', '#242426'] as const,
  fire: ['#FF6B35', '#FFB347'] as const,
  success: ['#34C759', '#30D158'] as const,
  hero: ['#121212', '#1A1F0A', '#121212'] as const,
};

export const shimmerConfig = {
  colors: [
    'rgba(255,255,255,0.03)',
    'rgba(255,255,255,0.08)',
    'rgba(255,255,255,0.03)',
  ] as const,
  duration: 1200,
};
