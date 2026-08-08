import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  brandWordmark: { ...typography.label, color: colors.textPrimary, fontWeight: '800', fontSize: 15, letterSpacing: 0.5, textTransform: 'uppercase' },
  brandWordmarkAccent: { color: colors.primary },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    marginTop: spacing.md, marginBottom: spacing.sm,
  },
  greeting: { ...typography.body, color: colors.textSecondary },
  name: { ...typography.h1, color: colors.textPrimary, marginTop: 2 },
  nameUnderline: { width: 40, height: 3, borderRadius: borderRadius.full, backgroundColor: colors.primary, marginTop: spacing.xs },
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
    padding: spacing.md, borderRadius: borderRadius.xl, gap: spacing.md,
    marginTop: spacing.md, marginBottom: spacing.md,
  },
  profileCardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  profileLabel: { ...typography.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  profileTextBlock: { flex: 1 },
  profileName: { ...typography.h4, color: colors.textPrimary, marginTop: 4 },
  profileBio: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  profileBioInput: {
    ...typography.caption, color: colors.textPrimary, marginTop: 2,
    borderBottomWidth: 1, borderBottomColor: colors.primary, paddingVertical: 2,
  },
  profileEditBtn: { padding: spacing.xs },
  profileBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewProfileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: 7,
    borderRadius: borderRadius.full,
  },
  viewProfileBtnText: { ...typography.label, color: colors.onPrimary, fontWeight: '700', letterSpacing: 0.6 },
  profileChevron: { ...typography.h4, color: colors.textMuted },

  wizardCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  wizardIconBadge: {
    width: 44, height: 44, borderRadius: borderRadius.md,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  wizardTitle: { ...typography.h4, color: colors.textPrimary },
  wizardDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

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
  streakCount: { ...typography.h2, color: colors.primary },
  streakLabel: { ...typography.caption, color: colors.textSecondary },

  statsColumn: { flex: 1, gap: spacing.sm },
  statCard: {
    flex: 1, padding: spacing.md, borderRadius: borderRadius.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  statIconBadge: {
    width: 30, height: 30, borderRadius: borderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: { ...typography.h4, color: colors.textPrimary },
  statUnit: { ...typography.caption, color: colors.textSecondary },
  statLabel: { ...typography.caption, color: colors.textMuted },

  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },

  performanceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  performanceCell: { width: '47%' },

  aiCard: { padding: spacing.lg, borderRadius: borderRadius.xl },
  aiCardHeader: { marginBottom: spacing.sm },
  aiChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary + '18',
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  aiChipText: { ...typography.label, color: colors.primary, fontWeight: '700' },
  aiCardTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.xs },
  aiCardDesc: { ...typography.body, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.md },
  aiCardActions: { flexDirection: 'row', gap: spacing.sm },
  aiAcceptBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  aiAcceptText: { ...typography.label, color: '#fff', fontWeight: '700' },
  aiSkipBtn: { paddingHorizontal: spacing.md, justifyContent: 'center' },
  aiSkipText: { ...typography.body, color: colors.textMuted },

  exploreGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm, columnGap: spacing.sm },
  exploreCard: {
    width: '31%', minHeight: 132,
    padding: spacing.sm, borderRadius: borderRadius.lg, borderWidth: 1,
    justifyContent: 'space-between',
  },
  exploreIconBadge: {
    width: 38, height: 38, borderRadius: borderRadius.md,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs,
  },
  exploreTitle: { ...typography.label, color: colors.textPrimary, fontWeight: '700', fontSize: 12.5 },
  exploreDesc: { ...typography.caption, color: colors.textMuted, fontSize: 10.5, lineHeight: 13, marginTop: 2 },
  exploreFooterRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.xs },
  exploreChevronBtn: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated,
  },

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
