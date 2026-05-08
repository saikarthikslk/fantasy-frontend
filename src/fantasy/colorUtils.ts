/** Add alpha channel to hex color */
export const withOpacity = (hex: string, opacity: number): string =>
  `${hex}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`

/** Parse RGB channels from hex color */
export const hexToRgb = (hex: string): [number, number, number] =>
  [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]

/**
 * Calculate WCAG 2.0 relative luminance.
 * Returns 0 (black) to 1 (white).
 * Used for determining proper text contrast.
 */
export const calculateLuminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex).map(channel => {
    const normalized = channel / 255
    // Apply gamma correction per WCAG formula
    return normalized <= 0.03928 
      ? normalized / 12.92 
      : Math.pow((normalized + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Adjusts dark colors for better readability on dark backgrounds.
 * - Very dark (luminance < 0.1): lighten 35%
 * - Dark (luminance < 0.2): lighten 20%
 * - Others: unchanged
 */
export const adjustForDarkBackground = (hex: string): string => {
  const luminance = calculateLuminance(hex)
  const lightenFactor = luminance < 0.1 ? 0.35 : luminance < 0.2 ? 0.20 : 0
  
  if (lightenFactor === 0) return hex
  
  const rgb = hexToRgb(hex).map(channel =>
    Math.min(255, Math.round(channel + (255 - channel) * lightenFactor))
  )
  
  return `#${rgb.map(c => c.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Determines optimal text color (black or white) based on background luminance.
 * Follows WCAG contrast ratio guidelines.
 */
export const getContrastText = (backgroundHex: string): '#000000' | '#FFFFFF' =>
  calculateLuminance(backgroundHex) > 0.5 ? '#000000' : '#FFFFFF'

/**
 * Saturated fallback for very pale brand colors (luminance > 0.7) that would
 * disappear into dark UI even after lightening. Currently only PBKS (#D8D8D8)
 * hits this branch — red is brand-adjacent (PBKS kit uses red ink).
 */
export const PALE_FALLBACK = '#ed5e5e'

/**
 * Returns a hex color reliably visible on the app's dark background
 * (oklch(0.07 0 0)). Used for selected-state chrome (border, gradient,
 * check badge). Distinct from `adjustForDarkBackground`, which is tuned
 * for text contrast and lifts less aggressively.
 *   lum < 0.18 → lift 50% toward white (DC, KKR, GT)
 *   lum > 0.70 → PALE_FALLBACK (PBKS)
 *   else       → lift 12% toward white
 */
export const getDisplayColor = (hex: string): string => {
  const luminance = calculateLuminance(hex)
  if (luminance > 0.70) return PALE_FALLBACK
  const lift = luminance < 0.18 ? 0.5 : 0.12
  const rgb = hexToRgb(hex).map(channel =>
    Math.min(255, Math.round(channel + (255 - channel) * lift))
  )
  return `#${rgb.map(c => c.toString(16).padStart(2, '0')).join('')}`
}
