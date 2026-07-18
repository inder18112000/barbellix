import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  messageList: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  bubble: { maxWidth: '80%', padding: spacing.sm, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  bubbleTrainer: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleMember: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleText: { ...typography.body, lineHeight: 22 },
  bubbleTextTrainer: { color: '#fff' },
  bubbleTextMember: { color: colors.textPrimary },
  bubbleTime: { ...typography.caption, color: 'rgba(255,255,255,0.6)', marginTop: 2, textAlign: 'right' },
  bubbleTimeMember: { color: colors.textMuted },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, ...typography.body, color: colors.textPrimary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, maxHeight: 120 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { fontSize: 20 },
});
