/**
 * Arena App Typography System
 * Using Plus Jakarta Sans for display and DM Sans for body
 */

import { TextStyle } from 'react-native';
import { colors } from './colors';

// Font family names (will be loaded via expo-font)
export const fontFamilies = {
  display: {
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_800ExtraBold',
  },
  body: {
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    semiBold: 'DMSans_600SemiBold',
    bold: 'DMSans_700Bold',
  },
} as const;

// Font sizes scale
export const fontSizes = {
  xs: 11,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

// Line heights
export const lineHeights = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.4,
  relaxed: 1.5,
  loose: 1.75,
} as const;

// Font weights (for system fonts fallback)
export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

// Pre-defined text styles
type TextStyleKey =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'bodyLarge'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'button'
  | 'buttonSmall'
  | 'overline';

export const textStyles: Record<TextStyleKey, TextStyle> = {
  // Headings (Plus Jakarta Sans)
  h1: {
    fontFamily: fontFamilies.display.extraBold,
    fontSize: fontSizes['3xl'],
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
    color: colors.text.primary,
    fontWeight: fontWeights.extraBold,
  },
  h2: {
    fontFamily: fontFamilies.display.bold,
    fontSize: fontSizes['2xl'],
    lineHeight: fontSizes['2xl'] * lineHeights.snug,
    color: colors.text.primary,
    fontWeight: fontWeights.bold,
  },
  h3: {
    fontFamily: fontFamilies.display.bold,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.snug,
    color: colors.text.primary,
    fontWeight: fontWeights.bold,
  },
  h4: {
    fontFamily: fontFamilies.display.bold,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.snug,
    color: colors.text.primary,
    fontWeight: fontWeights.bold,
  },

  // Body text (DM Sans)
  bodyLarge: {
    fontFamily: fontFamilies.body.regular,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.normal,
    color: colors.text.primary,
    fontWeight: fontWeights.regular,
  },
  body: {
    fontFamily: fontFamilies.body.regular,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
    color: colors.text.primary,
    fontWeight: fontWeights.regular,
  },
  bodySmall: {
    fontFamily: fontFamilies.body.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    color: colors.text.secondary,
    fontWeight: fontWeights.regular,
  },

  // Captions and labels
  caption: {
    fontFamily: fontFamilies.body.regular,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    color: colors.text.tertiary,
    fontWeight: fontWeights.regular,
  },
  label: {
    fontFamily: fontFamilies.body.semiBold,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    color: colors.text.primary,
    fontWeight: fontWeights.semiBold,
  },

  // Buttons
  button: {
    fontFamily: fontFamilies.body.bold,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.tight,
    color: colors.neutral[0],
    fontWeight: fontWeights.bold,
  },
  buttonSmall: {
    fontFamily: fontFamilies.body.semiBold,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.tight,
    color: colors.neutral[0],
    fontWeight: fontWeights.semiBold,
  },

  // Special
  overline: {
    fontFamily: fontFamilies.body.semiBold,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    color: colors.text.tertiary,
    fontWeight: fontWeights.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
};

export type TextStyles = typeof textStyles;
export type FontFamilies = typeof fontFamilies;
