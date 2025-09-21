// Keep values centralized; UI should prefer Tailwind semantic tokens in className.
// But when TS values are needed, import from here.

export const VPeak_COLORS = {
  background: "#ffffff", // matches bg-background
  foreground: "#000000", // black text for text-foreground
  primary: "#4012c9", // purple brand color
  primaryForeground: "#ffffff", // readable on purple
  secondary: "#a7a9f6", // light purple secondary
  accent: "#f931bd", // pink accent
  border: "#e5e7eb",
  muted: "#f8f9fa",
} as const

// Matches global CSS variable set via next/font in layout.tsx
export const VPeak_FONTS = {
  brandVar: "var(--font-press-start-2p)",
  // Optional: map to Tailwind utility usage
  brandClass: "font-serif", // ensure layout maps serif to Press Start 2P or override with a utility class
} as const

// Optional helpers for components that toggle themes programmatically
export const THEME = {
  lightOnDark: {
    bg: "bg-background",
    fg: "text-foreground",
    primaryText: "text-primary",
    primaryBg: "bg-primary",
    border: "border-border",
  },
} as const

// Named exports to match imports in app/page.tsx, mapped to semantic Tailwind tokens
export const fontBrand = "font-brand"
export const bgBackground = "bg-background"
export const textForeground = "text-foreground"
export const textPrimary = "text-primary"
export const textMutedForeground = "text-muted-foreground"
