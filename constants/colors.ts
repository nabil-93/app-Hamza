export const Colors = {
  // Primary brand
  mintPrimary: "#00D4A8",
  mintLight: "#4DFFD4",
  mintDark: "#00A882",
  tealPrimary: "#0891B2",
  tealLight: "#22D3EE",
  tealDark: "#0E7490",

  // Gradients
  gradientMint: ["#00D4A8", "#0891B2"] as [string, string],
  gradientMintLight: ["#4DFFD4", "#00D4A8"] as [string, string],
  gradientDark: ["#0A0E1A", "#141B2D"] as [string, string],
  gradientNeon: ["#00FF88", "#00B4FF"] as [string, string],
  gradientPurple: ["#7C3AED", "#A855F7"] as [string, string],
  gradientDanger: ["#FF4444", "#FF6B6B"] as [string, string],
  gradientCard: ["rgba(20,27,45,0.9)", "rgba(10,14,26,0.95)"] as [string, string],

  // Backgrounds
  bgPrimary: "#0A0E1A",
  bgSecondary: "#111827",
  bgCard: "#141B2D",
  bgCardLight: "#1E2A3E",
  bgGlass: "rgba(20, 27, 45, 0.8)",
  bgGlassLight: "rgba(255, 255, 255, 0.05)",
  bgGlassBorder: "rgba(0, 212, 168, 0.2)",

  // Neon accents (AI chat)
  neonGreen: "#00FF88",
  neonBlue: "#00B4FF",
  neonPurple: "#A855F7",
  neonPink: "#FF006E",
  neonCyan: "#00FFFF",

  // Status
  danger: "#FF4444",
  dangerLight: "#FF6B6B",
  warning: "#FFB800",
  warningLight: "#FFD04D",
  success: "#00D4A8",
  info: "#22D3EE",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#8B9DB5",
  textMuted: "#4A5568",
  textDim: "#2D3748",

  // Borders
  border: "rgba(139, 157, 181, 0.15)",
  borderMint: "rgba(0, 212, 168, 0.3)",
  borderNeon: "rgba(0, 255, 136, 0.4)",

  // Shadows
  shadowMint: "rgba(0, 212, 168, 0.3)",
  shadowDark: "rgba(0, 0, 0, 0.5)",
  shadowNeon: "rgba(0, 255, 136, 0.4)",

  // Charts
  chartGlucose: "#00D4A8",
  chartCarbs: "#22D3EE",
  chartCalories: "#A855F7",
  chartInsulin: "#FF6B6B",
  chartProtein: "#FFB800",
} as const;

export type ColorKey = keyof typeof Colors;
