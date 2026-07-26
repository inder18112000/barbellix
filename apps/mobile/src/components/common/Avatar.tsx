/**
 * Avatar -- SRP: the initials-or-photo circle, extracted from HomeScreen's ProfileCard (which
 * had this exact image-vs-initials branch inline) and ProfileHomeScreen's hero Avatar.
 */
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography } from '../../theme';
import { glow as glowStyles } from '../../theme/effects';

interface AvatarProps {
  uri?: string;
  initials: string;
  size?: number;
  glow?: boolean;
  badge?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

export function Avatar({ uri, initials, size = 56, glow, badge, onPress, disabled }: AvatarProps) {
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };
  const content = (
    <View style={[styles.base, dimensionStyle, glow && glowStyles.primary]}>
      {uri ? (
        <Image source={{ uri }} style={[dimensionStyle]} />
      ) : (
        <Text style={[styles.text, { fontSize: size * 0.36 }]}>{initials}</Text>
      )}
      {badge && <View style={styles.badge}>{badge}</View>}
    </View>
  );

  if (!onPress) return content;
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.8}>
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    position: 'relative',
    overflow: 'visible',
  },
  text: { ...typography.h4, color: '#fff', fontWeight: '700' },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
});
