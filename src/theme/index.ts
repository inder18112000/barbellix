export const colors = {
  // Brand
  primary: '#0A84FF',
  primaryDark: '#0066CC',
  primaryLight: '#5AABFF',
  accent: '#34C759',

  // Backgrounds
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceElevated: '#EEF2FB',
  card: '#FFFFFF',

  // Text
  textPrimary: '#1C1C1E',
  textSecondary: '#48484A',
  textMuted: '#8E8E93',

  // Status
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#0A84FF',

  // Misc
  border: '#D8DCE8',
  divider: '#EEF2FB',
  overlay: 'rgba(0,0,0,0.5)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  h1: { fontSize: 30, fontWeight: '700' as const, lineHeight: 38, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32, letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  h4: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 22 },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 26 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18 },
  label: { fontSize: 11, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.4 },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;
