// "Tech-Forward Powerhouse": Obsidian base + Titanium neutrals + an Electric Volt energy
// accent - raw fitness energy against a clean, dark system-software backdrop.
export const colors = {
  // Brand - Electric Volt is the one high-energy accent (CTAs, active states, glows).
  // It's too light for white text to sit on top of, so onPrimary (dark) is the paired
  // foreground token wherever primary/accent is used as a solid fill.
  primary: '#C6FF00',
  primaryDark: '#9FCC00',
  primaryLight: '#D9FF4D',
  onPrimary: '#121212',
  accent: '#C6FF00',
  onAccent: '#121212',

  // Backgrounds - Obsidian Black base, stepped up for elevation
  background: '#121212',
  surface: '#1C1C1E',
  surfaceElevated: '#242426',
  card: '#1C1C1E',

  // Text - Titanium Silver for body copy, near-white for headlines
  textPrimary: '#F5F5F5',
  textSecondary: '#E0E0E0',
  textMuted: '#9A9A9E',

  // Status - kept semantically distinct from the Volt brand accent, tuned for dark backgrounds
  success: '#34C759',
  warning: '#FF9F0A',
  error: '#FF453A',
  info: '#64D2FF',

  // Misc
  border: '#333335',
  divider: '#242426',
  overlay: 'rgba(0,0,0,0.7)',
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
