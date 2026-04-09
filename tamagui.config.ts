import { createFont, createTamagui, createTokens } from "tamagui";

const figmaSans = createFont({
  family: "FigmaSans, System", // "FigmaSans" will be mapped in useFonts
  size: {
    1: 12,
    2: 14,
    3: 16, // Body / Button
    4: 18, // Body Light
    5: 20, // Body Large
    6: 24, // Feature Title
    7: 26, // Sub-heading
    8: 48,
    9: 64, // Section Heading
    10: 86, // Display / Hero
    true: 16,
  },
  weight: {
    1: "320",
    2: "330",
    3: "340",
    4: "400",
    5: "450",
    6: "480",
    7: "540",
    8: "700",
  },
  letterSpacing: {
    1: -0.1,
    2: -0.14,
    3: -0.26,
    4: -0.96,
    5: -1.72,
  },
  lineHeight: {
    1: 1.0,
    2: 1.1,
    3: 1.3,
    4: 1.35,
    5: 1.4,
    6: 1.45,
  },
});

const figmaMono = createFont({
  family: "FigmaMono, Menlo, 'SF Mono', monospace",
  size: {
    1: 12,
    2: 18,
    true: 12,
  },
  weight: {
    1: "400",
  },
  letterSpacing: {
    1: 0.54,
    2: 0.6,
  },
  lineHeight: {
    1: 1.0,
    2: 1.3,
  },
});

const tokens = createTokens({
  size: {
    0: 0,
    1: 1,
    2: 2,
    3: 4,
    4: 8,
    5: 10,
    6: 12,
    7: 16,
    8: 18,
    9: 24,
    10: 32,
    11: 40,
    12: 46,
    13: 48,
    14: 50,
    true: 16,
  },
  space: {
    0: 0,
    1: 1,
    2: 2,
    3: 4,
    4: 8,
    5: 10,
    6: 12,
    7: 16,
    8: 18,
    9: 24,
    10: 32,
    11: 40,
    12: 46,
    13: 48,
    14: 50,
    true: 16,
  },
  zIndex: {
    0: 0,
    1: 100,
    2: 200,
  },
  radius: {
    0: 0,
    minimal: 2,
    subtle: 6,
    comfortable: 8,
    pill: 50,
    circle: 999, // use 999 for full rounded circles in RN
    true: 8,
  },
  color: {
    pureBlack: "#000000",
    pureWhite: "#ffffff",
    glassDark: "rgba(0, 0, 0, 0.08)",
    glassLight: "rgba(255, 255, 255, 0.16)",
    // Functional colors needed by app (for status/tags as seen in dashboard)
    success: "#2EEA8A",
    danger: "#FF4D4F",
    warning: "#FFD54A",
    grayBorder: "#2B2B2B",
  },
});

const light = {
  background: tokens.color.pureWhite,
  backgroundGlass: tokens.color.glassDark,
  color: tokens.color.pureBlack,
  borderColor: tokens.color.pureBlack,
  buttonBg: tokens.color.pureBlack,
  buttonColor: tokens.color.pureWhite,
  // Card
  cardBackground: tokens.color.pureWhite,
  cardBorder: tokens.color.pureBlack,
  // Functional
  success: tokens.color.success,
  danger: tokens.color.danger,
  warning: tokens.color.warning,
};

const dark = {
  background: tokens.color.pureBlack,
  backgroundGlass: tokens.color.glassLight,
  color: tokens.color.pureWhite,
  borderColor: tokens.color.pureWhite,
  buttonBg: tokens.color.pureWhite,
  buttonColor: tokens.color.pureBlack,
  // Card
  cardBackground: tokens.color.pureBlack,
  cardBorder: tokens.color.grayBorder, // Use subtle gray border in dark mode to distinguish edge if requested, or pure white. Using #2D2D2D for subtle boundary. Let's stick to true B&W: pureWhite
  // Functional
  success: tokens.color.success,
  danger: tokens.color.danger,
  warning: tokens.color.warning,
};

const appConfig = createTamagui({
  fonts: {
    heading: figmaSans,
    body: figmaSans,
    mono: figmaMono,
  },
  tokens,
  themes: {
    light,
    dark,
  },
  shorthands: {
    bg: "backgroundColor",
    p: "padding",
    m: "margin",
    px: "paddingHorizontal",
    py: "paddingVertical",
    mx: "marginHorizontal",
    my: "marginVertical",
    br: "borderRadius",
  } as const,
});

export type AppConfig = typeof appConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig;
