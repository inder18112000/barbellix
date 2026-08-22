import React from 'react';
import { Image } from 'react-native';
import type { StyleProp, ImageStyle } from 'react-native';

interface BrandMarkProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
  /** 'badge' - the gold ring/barbell/figure mark alone (landscape, ~4:3), for tight header
   * contexts. 'full' - the same badge plus the "BARBELLIX GYM" wordmark (~23:20), for hero
   * placements (splash, login) with no separate adjacent wordmark text. `size` is the mark's
   * height in both cases - width follows the source image's real aspect ratio via resizeMode. */
  variant?: 'badge' | 'full';
}

const BADGE_ASPECT = 954 / 720;
const FULL_ASPECT = 1174 / 1020;

// The real Barbellix gym logo (badge + wordmark artwork, not a hand-coded vector) - both crops
// are generated once from the same source image (see assets/logo-badge.png / logo-full.png) so
// they never drift out of sync with each other.
export function BrandMark({ size = 64, style, variant = 'badge' }: BrandMarkProps) {
  const aspect = variant === 'full' ? FULL_ASPECT : BADGE_ASPECT;
  const source = variant === 'full' ? require('../../../assets/logo-full.png') : require('../../../assets/logo-badge.png');

  return (
    <Image
      source={source}
      resizeMode="contain"
      style={[{ height: size, width: size * aspect }, style]}
    />
  );
}
