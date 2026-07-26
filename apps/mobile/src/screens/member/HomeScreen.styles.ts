import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginTop: spacing.md, marginBottom: spacing.sm,
  },
  greeting: { ...typography.body, color: colors.textSecondary },
  name: { ...typography.h2, color: colors.textPrimary },
  notifBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderRadius: borderRadius.xl,
    marginTop: spacing.md, marginBottom: spacing.md,
  },
  profileName: { ...typography.h4, color: colors.textPrimary },
  profileBio: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  profileBioInput: {
    ...typography.caption, color: colors.textPrimary, marginTop: 2,
    borderBottomWidth: 1, borderBottomColor: colors.primary, paddingVertical: 2,
  },
  profileEditBtn: { padding: spacing.xs },

  datePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md, paddingVertical: 5,
    marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.primary + '30',
  },
  datePillText: { ...typography.label, color: colors.primary },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },

  streakCard: {
    width: 112, alignItems: 'center',
    padding: spacing.md, borderRadius: borderRadius.xl,
  },
  streakInner: {
    width: 56, height: 56,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  pulseRing: {
    position: 'absolute', width: 56, height: 56,
    borderRadius: 28, borderWidth: 2,
  },
  streakEmoji: { fontSize: 28 },
  streakCount: { ...typography.h2, color: colors.primary },
  streakLabel: { ...typography.caption, color: colors.textSecondary },

  statsColumn: { flex: 1, gap: spacing.sm },
  statCard: {
    flex: 1, padding: spacing.md, borderRadius: borderRadius.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  statEmoji: { fontSize: 20 },
  statValue: { ...typography.h4, color: colors.textPrimary },
  statUnit: { ...typography.caption, color: colors.textSecondary },
  statLabel: { ...typography.caption, color: colors.textMuted },

  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },

  aiCard: { padding: spacing.lg, borderRadius: borderRadius.xl },
  aiCardHeader: { marginBottom: spacing.sm },
  aiChip: {
    ...typography.label,
    color: colors.primary,
    backgroundColor: colors.primary + '18',
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  aiCardTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.xs },
  aiCardDesc: { ...typography.body, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.md },
  aiCardActions: { flexDirection: 'row', gap: spacing.sm },
  aiAcceptBtn: {
    flex: 1, backgroundColor: colors.primary,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md, alignItems: 'center',
  },
  aiAcceptText: { ...typography.label, color: '#fff', fontWeight: '700' },
  aiSkipBtn: { paddingHorizontal: spacing.md, justifyContent: 'center' },
  aiSkipText: { ...typography.body, color: colors.textMuted },

  quickActions: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm, columnGap: spacing.sm },
  quickAction: {
    width: '31%', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.lg, borderWidth: 1,
  },
  quickActionEmoji: { fontSize: 22, marginBottom: 6 },
  quickActionLabel: { ...typography.label, color: colors.textSecondary, textAlign: 'center' },

  sessionCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm,
  },
  sessionDate: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  sessionSets: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  rpeTag: {
    backgroundColor: colors.primary + '18',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  rpeText: { ...typography.label, color: colors.primary },
  viewAllBtn: { alignItems: 'center', paddingVertical: spacing.md },
  viewAllText: { ...typography.body, color: colors.primary, fontWeight: '600' },
});
