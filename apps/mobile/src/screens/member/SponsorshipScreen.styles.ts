import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  heroBadge: {
    alignSelf: 'center', paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: borderRadius.full, marginBottom: spacing.sm,
  },
  heroBadgeText: { ...typography.label, color: '#fff', letterSpacing: 1 },
  heroTitle: { ...typography.h1, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.xs },
  heroSubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl, paddingHorizontal: spacing.md },

  card: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.md },
  logoBadge: {
    width: 52, height: 52, borderRadius: borderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  logoBadgeText: { ...typography.h3, color: '#fff', fontWeight: '800' },
  cardHeaderText: { flex: 1 },
  sponsorName: { ...typography.h3, color: '#fff', fontWeight: '800' },
  activeChip: {
    alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.25)',
  },
  activeChipText: { ...typography.caption, color: '#fff', fontWeight: '700' },
  cardBody: { backgroundColor: 'rgba(0,0,0,0.16)', padding: spacing.lg, paddingTop: spacing.md },
  sponsorDescription: { ...typography.body, color: '#fff', opacity: 0.95, marginBottom: spacing.md, lineHeight: 21 },
  visitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: borderRadius.md,
    paddingVertical: spacing.sm, alignSelf: 'flex-start', paddingHorizontal: spacing.md,
  },
  visitBtnText: { ...typography.label, fontWeight: '800' },

  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
