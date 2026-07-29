import { StyleSheet } from 'react-native';
import { colors, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  logo: { alignSelf: 'center', marginBottom: 8 },
  brand: { ...typography.h1, color: colors.textPrimary, textAlign: 'center', letterSpacing: 2 },
  tagline: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
