/**
 * Card -- SRP: the glass/elevated surface every screen was re-spreading `glass.card` /
 * `glass.cardStrong` onto a bare View to get. OCP: `variant` and `glow` extend the look
 * without touching callers that just want the default.
 */
import React from 'react';
import { View, type ViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { glass, glow } from '../../theme/effects';

interface CardProps extends ViewProps {
  variant?: 'default' | 'strong';
  glowColor?: 'primary' | 'accent' | 'success';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function Card({ variant = 'default', glowColor, style, children, ...rest }: CardProps) {
  return (
    <View
      style={[
        variant === 'strong' ? glass.cardStrong : glass.card,
        glowColor && glow[glowColor],
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
