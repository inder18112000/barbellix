import { StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

const { width } = Dimensions.get('window');
export const CARD_WIDTH = width - spacing.lg * 2;

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Card stack
  stackArea: { height: 280, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  swipeCard: { position: 'absolute', width: CARD_WIDTH, padding: spacing.lg, borderRadius: borderRadius.xl, gap: spacing.sm },
  cardEmoji: { fontSize: 36 },
  cardTitle: { ...typography.h3, color: colors.textPrimary },
  cardBody: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  cardType: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },

  // Accept/dismiss overlays
  overlayAccept: { position: 'absolute', top: spacing.md, right: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.success + '30', borderWidth: 2, borderColor: colors.success, transform: [{ rotate: '-12deg' }] },
  overlayDismiss: { position: 'absolute', top: spacing.md, left: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.error + '30', borderWidth: 2, borderColor: colors.error, transform: [{ rotate: '12deg' }] },
  overlayText: { ...typography.h4, fontWeight: '700' },

  // Action buttons
  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, marginBottom: spacing.lg },
  actionBtn: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontSize: 26 },

  emptyCard: { width: CARD_WIDTH, padding: spacing.xl, borderRadius: borderRadius.xl, alignItems: 'center', gap: spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },

  // Chat section
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md, marginBottom: spacing.md },
  chatLabel: { ...typography.label, color: colors.textMuted, marginHorizontal: spacing.md, marginBottom: spacing.sm },
  chipScroll: { gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border },
  chipText: { ...typography.label, color: colors.textSecondary },
  chatMessages: { paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.md },
  userBubble: { alignSelf: 'flex-end', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, borderBottomRightRadius: 4, backgroundColor: colors.primary, maxWidth: '80%' },
  userBubbleText: { ...typography.body, color: '#fff' },
  aiBubble: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, borderBottomLeftRadius: 4, maxWidth: '85%' },
  aiBubbleText: { ...typography.body, color: colors.textPrimary, lineHeight: 22 },
  inputRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  chatInput: { flex: 1, ...typography.body, color: colors.textPrimary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
});
