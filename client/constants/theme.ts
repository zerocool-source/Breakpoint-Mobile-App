import { Platform } from "react-native";

// Breakpoint Commercial Pool Systems Brand Colors
export const BrandColors = {
  // Primary Colors - Richer, more vibrant
  azureBlue: "#0078D4",
  azureBlueLight: "#2899F5",
  azureBlueDark: "#005A9E",
  vividTangerine: "#FF8000",
  vividTangerineLight: "#FF9933",
  tropicalTeal: "#17BEBB",
  tropicalTealLight: "#3DD1CE",
  emerald: "#22D69A",
  emeraldLight: "#4EEAB5",
  
  // Service Tech Theme
  royalPurple: "#4169E1",
  
  // Status Colors
  danger: "#FF3B30",
  dangerLight: "#FF6961",
  warning: "#FF8000",
  warningLight: "#FFA347",
  success: "#22D69A",
  successLight: "#4EEAB5",
  info: "#0078D4",
  infoLight: "#2899F5",
  
  // Priority Colors
  urgent: "#FF3B30",
  high: "#FF8000",
  normal: "#0078D4",
  low: "#8E8E93",
  completed: "#22D69A",
  
  // Neutrals - Refined
  white: "#FFFFFF",
  background: "#F7F8FA",
  surface: "#FFFFFF",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  disabled: "#CBD5E1",
  dragHandle: "#CBD5E1",
  
  // Premium accents
  gold: "#F59E0B",
  platinum: "#94A3B8",
} as const;

const tintColorLight = BrandColors.azureBlue;
const tintColorDark = "#0A84FF";

export const Colors = {
  light: {
    text: BrandColors.textPrimary,
    textSecondary: BrandColors.textSecondary,
    textTertiary: BrandColors.textTertiary,
    buttonText: "#FFFFFF",
    tabIconDefault: "#94A3B8",
    tabIconSelected: tintColorLight,
    link: BrandColors.azureBlue,
    primary: BrandColors.azureBlue,
    primaryLight: BrandColors.azureBlueLight,
    accent: BrandColors.vividTangerine,
    accentLight: BrandColors.vividTangerineLight,
    success: BrandColors.emerald,
    successLight: BrandColors.emeraldLight,
    danger: BrandColors.danger,
    dangerLight: BrandColors.dangerLight,
    warning: BrandColors.warning,
    warningLight: BrandColors.warningLight,
    teal: BrandColors.tropicalTeal,
    tealLight: BrandColors.tropicalTealLight,
    backgroundRoot: BrandColors.background,
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#F8FAFC",
    backgroundTertiary: "#F1F5F9",
    surface: BrandColors.surface,
    surfaceElevated: "#FFFFFF",
    border: BrandColors.border,
    borderLight: BrandColors.borderLight,
    disabled: BrandColors.disabled,
    dragHandle: BrandColors.dragHandle,
    overlay: "rgba(15, 23, 42, 0.4)",
  },
  dark: {
    text: "#F8FAFC",
    textSecondary: "#94A3B8",
    textTertiary: "#64748B",
    buttonText: "#FFFFFF",
    tabIconDefault: "#64748B",
    tabIconSelected: tintColorDark,
    link: "#0A84FF",
    primary: "#0A84FF",
    primaryLight: "#3B9EFF",
    accent: "#FF9500",
    accentLight: "#FFB347",
    success: "#30D158",
    successLight: "#5AE57A",
    danger: "#FF453A",
    dangerLight: "#FF6961",
    warning: "#FF9F0A",
    warningLight: "#FFB84D",
    teal: "#64D2FF",
    tealLight: "#8DDDFF",
    backgroundRoot: "#0F172A",
    backgroundDefault: "#1E293B",
    backgroundSecondary: "#334155",
    backgroundTertiary: "#475569",
    surface: "#1E293B",
    surfaceElevated: "#334155",
    border: "#334155",
    borderLight: "#475569",
    disabled: "#475569",
    dragHandle: "#64748B",
    overlay: "rgba(0, 0, 0, 0.6)",
  },
};

// HD Upscaled Spacing - More generous for premium feel
export const Spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  "2xl": 32,
  "3xl": 40,
  "4xl": 52,
  "5xl": 64,
  "6xl": 80,
  inputHeight: 56,
  buttonHeight: 58,
  buttonHeightLarge: 64,
  cardPadding: 20,
  cardPaddingLarge: 28,
  screenPadding: 20,
  screenPaddingLarge: 28,
  quickActionSize: 92,
  quickActionSizeLarge: 108,
  avatarXSmall: 32,
  avatarSmall: 40,
  avatarMedium: 56,
  avatarLarge: 72,
  avatarXLarge: 96,
  fabSize: 64,
  fabOffset: 20,
  iconSmall: 18,
  iconMedium: 24,
  iconLarge: 32,
  iconXLarge: 44,
  listItemHeight: 72,
  sectionGap: 28,
};

// HD Upscaled Border Radius - Smoother, more modern
export const BorderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  "2xl": 28,
  "3xl": 36,
  "4xl": 48,
  full: 9999,
};

// HD Typography - Larger, crisper, with adequate line height for mobile
export const Typography = {
  display: {
    fontSize: 40,
    lineHeight: 52,
    fontWeight: "800" as const,
    letterSpacing: -1,
  },
  h1: {
    fontSize: 32,
    lineHeight: 42,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    lineHeight: 34,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: "600" as const,
    letterSpacing: 0,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: "400" as const,
    letterSpacing: 0,
  },
  bodyLarge: {
    fontSize: 18,
    lineHeight: 30,
    fontWeight: "400" as const,
    letterSpacing: 0,
  },
  small: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "400" as const,
    letterSpacing: 0.1,
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500" as const,
    letterSpacing: 0.2,
  },
  captionSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500" as const,
    letterSpacing: 0.3,
  },
  link: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: "500" as const,
    letterSpacing: 0,
  },
  badge: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600" as const,
    letterSpacing: 0.3,
  },
  buttonLarge: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
  },
  metric: {
    fontSize: 36,
    lineHeight: 48,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"] as any,
  },
  metricSmall: {
    fontSize: 28,
    lineHeight: 40,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
    fontVariant: ["tabular-nums"] as any,
  },
};

// Cross-platform shadow helper
const createShadow = (
  color: string,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number
) => {
  const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return Platform.select({
    web: {
      boxShadow: `0px ${offsetY}px ${radius}px rgba(15, 23, 42, ${opacity})`,
    },
    default: {
      shadowColor: color,
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
      elevation: elevation,
    },
  });
};

// Premium Shadows - Softer, more depth (cross-platform)
export const Shadows = {
  none: Platform.select({
    web: { boxShadow: 'none' },
    default: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  }),
  subtle: createShadow("#0F172A", 1, 0.04, 2, 1),
  card: createShadow("#0F172A", 2, 0.06, 8, 3),
  cardHover: createShadow("#0F172A", 4, 0.08, 12, 4),
  cardElevated: createShadow("#0F172A", 6, 0.10, 16, 6),
  fab: createShadow("#0F172A", 4, 0.15, 12, 8),
  modal: Platform.select({
    web: { boxShadow: '0px -4px 24px rgba(15, 23, 42, 0.12)' },
    default: {
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 16,
    },
  }),
  header: createShadow("#0F172A", 2, 0.04, 4, 2),
  button: Platform.select({
    web: { boxShadow: '0px 4px 8px rgba(0, 120, 212, 0.25)' },
    default: {
      shadowColor: "#0078D4",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
  }),
  buttonPressed: Platform.select({
    web: { boxShadow: '0px 2px 4px rgba(0, 120, 212, 0.20)' },
    default: {
      shadowColor: "#0078D4",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.20,
      shadowRadius: 4,
      elevation: 2,
    },
  }),
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

// Animation Durations for smooth transitions
export const AnimationDurations = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  deliberate: 700,
};

// Spring Configs for natural motion
export const SpringConfigs = {
  gentle: {
    damping: 20,
    stiffness: 100,
    mass: 1,
  },
  responsive: {
    damping: 15,
    stiffness: 150,
    mass: 0.8,
  },
  bouncy: {
    damping: 12,
    stiffness: 180,
    mass: 0.6,
  },
  snappy: {
    damping: 20,
    stiffness: 300,
    mass: 0.5,
  },
};
