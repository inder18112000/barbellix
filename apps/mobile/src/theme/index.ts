// "Forged Gold on Carbon": Pitch-black base + warm carbon surfaces + a single Signal Gold
// accent, condensed-bold display type - the Barbellix brand system, replacing the earlier
// "Tech-Forward Powerhouse" (Obsidian/Volt) identity.
export const colors = {
  // Brand - Signal Gold is the one high-energy accent (CTAs, active states, glows). It's too
  // light for white text to sit on top of, so onPrimary (dark) is the paired foreground token
  // wherever primary/accent is used as a solid fill.
  primary: '#FFD200',
  primaryDark: '#C8940A',
  primaryLight: '#FFE873',
  onPrimary: '#0B0A08',
  accent: '#FFD200',
  onAccent: '#0B0A08',

  // Backgrounds - Pitch black base, stepped up for elevation through warm carbon tones
  background: '#080807',
  surface: '#111010',
  surfaceElevated: '#1A1815',
  card: '#111010',

  // Text - Chalk for headlines, warm muted tones for body/meta copy
  textPrimary: '#F6F5F1',
  textSecondary: '#B7B2A5',
  textMuted: '#7E7869',

  // Status - kept semantically distinct from the gold brand accent, tuned for dark backgrounds
  success: '#34C759',
  warning: '#FF9F0A',
  error: '#FF453A',
  info: '#64D2FF',

  // Misc
  border: '#2A2620',
  divider: '#221F1A',
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

// Display headings run in Saira Condensed ExtraBold (loaded via @expo-google-fonts - see
// App.tsx's useFonts gate), body/caption in Barlow, and the small mono-tracked label style in
// JetBrains Mono - matching the brand system's "condensed display + warm body + mono meta" type
// stack. fontWeight is intentionally omitted wherever fontFamily names an exact weight: pairing
// the two confuses Android's font matching and can silently fall back to the system font.
export const typography = {
  h1: { fontFamily: 'SairaCondensed_800ExtraBold', fontSize: 30, lineHeight: 38, letterSpacing: -0.5 },
  h2: { fontFamily: 'SairaCondensed_800ExtraBold', fontSize: 24, lineHeight: 32, letterSpacing: -0.3 },
  h3: { fontFamily: 'SairaCondensed_800ExtraBold', fontSize: 20, lineHeight: 28 },
  h4: { fontFamily: 'SairaCondensed_800ExtraBold', fontSize: 16, lineHeight: 24 },
  body: { fontFamily: 'Barlow_400Regular', fontSize: 14, lineHeight: 22 },
  bodyLarge: { fontFamily: 'Barlow_400Regular', fontSize: 16, lineHeight: 26 },
  caption: { fontFamily: 'Barlow_400Regular', fontSize: 12, lineHeight: 18 },
  label: { fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 11, lineHeight: 16, letterSpacing: 0.4 },
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
