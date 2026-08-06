export const NeonTheme = {
  Colors: {
    magenta: "#FF3DE8",
    magentaStrong: "#FF00B8",
    cyan: "#00E6FF",
    white: "#FFFFFF",
    background: "#0B0C16",
    surface: "#121326",
    surfaceSoft: "#191A30",
    orange: "#FF8A00",
  },

  Glow: {
    magenta:
      "drop-shadow(0 0 4px rgba(255,61,232,0.95)) drop-shadow(0 0 11px rgba(255,61,232,0.55))",

    cyan:
      "drop-shadow(0 0 4px rgba(0,230,255,0.95)) drop-shadow(0 0 11px rgba(0,230,255,0.50))",

    white:
      "drop-shadow(0 0 5px rgba(255,255,255,0.42))",
  },

  Shadows: {
    magenta:
      "0 0 12px rgba(255,61,232,0.35), 0 10px 28px rgba(0,0,0,0.30)",

    cyan:
      "0 0 12px rgba(0,230,255,0.28), 0 10px 28px rgba(0,0,0,0.30)",

    card:
      "0 18px 45px rgba(0,0,0,0.32)",
  },
} as const;

export type NeonTone =
  | "magenta"
  | "cyan"
  | "white";