export const colors = {
  canvas:       "#EFF6D8",
  canvasAlt:    "#E6F0C2",
  surface:      "#FBFFE8",
  surfaceWhite: "#FFFFFF",
  ink:          "#0E1410",

  lime:         "#C8F560",
  limeStrong:   "#B4E84A",
  limeSoft:     "#DEF59A",

  cyan:         "#5DC9C1",
  cyanGlow:     "#8DE0DA",

  text:         "#1A1F1A",
  textMuted:    "#7A867A",
  textInverse:  "#F5FFE0",
  textOnLime:   "#0E1410",

  success:      "#5BBF6A",
  danger:       "#E5484D",
  warning:      "#F0B429",

  hairline:     "rgba(14,20,16,0.08)",
  hairlineDark: "rgba(245,255,224,0.12)",
} as const;

export const radius = {
  none: 0, sm: 8, md: 14, lg: 20, xl: 24, "2xl": 32, pill: 999,
} as const;

export const spacing = {
  0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20,
  6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 14: 56, 16: 64, 20: 80,
} as const;

export const shadow = {
  card: {
    shadowColor: "#0E1410", shadowOpacity: 0.06, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  hero: {
    shadowColor: "#0E1410", shadowOpacity: 0.18, shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 }, elevation: 8,
  },
} as const;

export const font = {
  regular: "PlusJakartaSans_400Regular",
  medium:  "PlusJakartaSans_500Medium",
  semibold:"PlusJakartaSans_600SemiBold",
  bold:    "PlusJakartaSans_700Bold",
} as const;
