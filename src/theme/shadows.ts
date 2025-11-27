/**
 * Arena App Shadow System
 * Cross-platform shadows for iOS and Android
 */

import { Platform, ViewStyle } from 'react-native';

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

const createShadow = (
  offsetY: number,
  shadowRadius: number,
  shadowOpacity: number,
  elevation: number
): ShadowStyle => ({
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: offsetY },
  shadowOpacity: Platform.OS === 'ios' ? shadowOpacity : 0,
  shadowRadius: Platform.OS === 'ios' ? shadowRadius : 0,
  elevation: Platform.OS === 'android' ? elevation : 0,
});

export const shadows = {
  none: createShadow(0, 0, 0, 0),

  // Subtle shadows
  xs: createShadow(1, 2, 0.05, 1),
  sm: createShadow(1, 3, 0.1, 2),

  // Medium shadows
  md: createShadow(2, 6, 0.1, 4),
  lg: createShadow(4, 8, 0.1, 6),

  // Strong shadows
  xl: createShadow(6, 12, 0.15, 8),
  '2xl': createShadow(8, 16, 0.2, 12),

  // Semantic shadows
  card: createShadow(2, 8, 0.1, 4),
  modal: createShadow(8, 24, 0.2, 16),
  button: createShadow(2, 4, 0.1, 3),
  dropdown: createShadow(4, 12, 0.15, 8),
} as const;

export type Shadows = typeof shadows;
