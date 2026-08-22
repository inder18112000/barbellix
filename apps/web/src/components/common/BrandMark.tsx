interface BrandMarkProps {
  className?: string
  /** 'badge' - the gold ring/barbell/figure mark alone, for tight header/sidebar contexts.
   * 'full' - the same badge plus the "BARBELLIX GYM" wordmark, for hero/login placements where
   * there's no separate adjacent wordmark text already doing that job. */
  variant?: 'badge' | 'full'
}

// The real Barbellix gym logo (badge + wordmark artwork, not a hand-coded vector) - both crops
// are generated once from the same source image (see apps/web/public/logo-badge.png /
// logo-full.png) so they never drift out of sync with each other.
export function BrandMark({ className, variant = 'badge' }: BrandMarkProps) {
  return (
    <img
      src={variant === 'full' ? '/logo-full.png' : '/logo-badge.png'}
      alt="Barbellix"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  )
}
