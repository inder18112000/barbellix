/**
 * PlaceholderScreen — Renders a consistent "coming soon" stub.
 * Used during UI-first phase so navigation works before screens are built.
 * OCP: replace by passing children to ScreenShell when ready — no changes here needed.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenShell } from './ScreenShell';
import { colors, typography, spacing } from '../../theme';

interface Props {
  title: string;
  emoji?: string;
  description?: string;
  onBack?: () => void;
}

export function PlaceholderScreen({ title, emoji = '🚧', description, onBack }: Props) {
  return (
    <ScreenShell title={title} onBack={onBack}>
      <View style={styles.center}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description ?? 'This screen is under construction.'}</Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emoji: { fontSize: 48, marginBottom: spacing.md },
  title: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm, textAlign: 'center' },
  desc: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
