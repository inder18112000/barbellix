interface BrandMarkProps {
  className?: string
}

// The BarBellix monogram: a bold "B" sliced by the bolt, matching apps/web/public/favicon.svg
// and the mobile app icon. Self-contained (own background + both colors), not a currentColor
// glyph, so it drops in directly without a wrapping colored container.
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <rect width="200" height="200" rx="40" fill="#121212" />
      <path
        fillRule="evenodd"
        fill="#E0E0E0"
        d="
          M34,26 L128,26 A36,36 0 0 1 128,98 L134,98 A38,38 0 0 1 134,174 L34,174 Z
          M64,40 L118,40 A22,22 0 0 1 118,84 L64,84 Z
          M64,112 L124,112 A26,26 0 0 1 124,164 L64,164 Z
        "
      />
      <path fill="#C6FF00" d="M112,9 L53,120 L98,120 L72,191 L157,87 L105,87 Z" />
    </svg>
  )
}
