/**
 * Arena App Spacing System
 * Consistent spacing scale based on 4px base unit
 */

export const spacing = {
  // Base spacing scale
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,

  // Semantic spacing
  screenPadding: 20,
  cardPadding: 16,
  modalPadding: 24,
  inputPadding: 16,
  buttonPadding: 16,
  sectionGap: 24,
  itemGap: 12,
  iconGap: 8,
} as const;

// Border radius scale
export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,

  // Semantic
  button: 12,
  card: 16,
  modal: 20,
  input: 12,
  badge: 6,
  avatar: 9999,
} as const;

// Component-specific dimensions
export const dimensions = {
  // Input heights
  inputHeight: 56,
  buttonHeight: 56,
  smallButtonHeight: 44,

  // Touch targets (minimum)
  touchTarget: 44,

  // Icons
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  iconXl: 32,

  // Avatar sizes
  avatarSm: 32,
  avatarMd: 48,
  avatarLg: 64,
  avatarXl: 96,

  // Time slot
  timeSlotSize: 80,

  // Code input box
  codeBoxWidth: 48,
  codeBoxHeight: 56,

  // Tab bar
  tabBarHeight: 60,

  // Header
  headerHeight: 56,
} as const;

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Dimensions = typeof dimensions;
