import { Platform } from "react-native";

// Breakpoint Commercial Pool Systems Brand Colors
export const BrandColors = {
  // Primary Colors
  azureBlue: "#0078D4",
  vividTangerine: "#FF8000",
  tropicalTeal: "#17BEBB",
  emerald: "#22D69A",
  
  // Service Tech Theme
  royalPurple: "#4169E1",
  
  // Status Colors
  danger: "#FF3B30",
  warning: "#FF8000",
  success: "#22D69A",
  info: "#0078D4",
  
  // Priority Colors
  urgent: "#FF3B30",
  high: "#FF8000",
  normal: "#0078D4",
  low: "#8E8E93",
  completed: "#22D69A",
  
  // Neutrals
  white: "#FFFFFF",
  background: "#F5F5F5",
  surface: "#FFFFFF",
  textPrimary: "#1A1A1A",
  textSecondary: "#666666",
  border: "#E0E0E0",
  disabled: "#CCCCCC",
  dragHandle: "#CCCCCC",
} as const;

const tintColorLight = BrandColors.azureBlue;
const tintColorDark = "#0A84FF";

export const Colors = {
  light: {
    text: BrandColors.textPrimary,
    textSecondary: BrandColors.textSecondary,
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    link: BrandColors.azureBlue,
    primary: BrandColors.azureBlue,
    accent: BrandColors.vividTangerine,
    success: BrandColors.emerald,
    danger: BrandColors.danger,
    warning: BrandColors.warning,
    teal: BrandColors.tropicalTeal,
    backgroundRoot: BrandColors.background,
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#F8F8F8",
    backgroundTertiary: "#F0F0F0",
    surface: BrandColors.surface,
    border: BrandColors.border,
    disabled: BrandColors.disabled,
    dragHandle: BrandColors.dragHandle,
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    link: "#0A84FF",
    primary: "#0A84FF",
    accent: "#FF9500",
    success: "#30D158",
    danger: "#FF453A",
    warning: "#FF9F0A",
    teal: "#64D2FF",
    backgroundRoot: "#1F2123",
    backgroundDefault: "#2A2C2E",
    backgroundSecondary: "#353739",
    backgroundTertiary: "#404244",
    surface: "#2A2C2E",
    border: "#404244",
    disabled: "#636366",
    dragHandle: "#636366",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
  cardPadding: 16,
  screenPadding: 16,
  quickActionSize: 80,
  avatarSmall: 32,
  avatarMedium: 48,
  avatarLarge: 64,
  fabSize: 56,
  fabOffset: 16,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  h3: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400" as const,
  },
  badge: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
  },
};

export const Shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  fab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
