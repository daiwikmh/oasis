import type { Config } from "tailwindcss";
import { colors, radius } from "./theme/tokens";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: colors.canvas,
        "canvas-alt": colors.canvasAlt,
        surface: colors.surface,
        "surface-white": colors.surfaceWhite,
        ink: colors.ink,
        lime: { DEFAULT: colors.lime, strong: colors.limeStrong, soft: colors.limeSoft },
        cyan: { DEFAULT: colors.cyan, glow: colors.cyanGlow },
        muted: colors.textMuted,
        inverse: colors.textInverse,
        hairline: colors.hairline,
        success: colors.success,
        danger: colors.danger,
        warning: colors.warning,
      },
      borderRadius: {
        sm: `${radius.sm}px`,
        md: `${radius.md}px`,
        lg: `${radius.lg}px`,
        xl: `${radius.xl}px`,
        "2xl": `${radius["2xl"]}px`,
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
