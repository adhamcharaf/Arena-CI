/**
 * Arena App Color Palette
 * Inspired by Tailwind CSS with brand-specific customizations
 */

export const colors = {
  // Brand Primary - Orange (from Arena logo)
  primary: {
    main: '#F97316',
    light: '#FFF7ED',
    dark: '#EA580C',
    contrast: '#FFFFFF',
  },

  // Brand Secondary - Black (from Arena logo "A")
  secondary: {
    main: '#1F2937',
    light: '#374151',
    dark: '#111827',
    contrast: '#FFFFFF',
  },

  // Sport-specific colors
  sport: {
    football: {
      main: '#10B981',
      light: '#D1FAE5',
      dark: '#065F46',
      contrast: '#FFFFFF',
    },
    padel: {
      main: '#3B82F6',
      light: '#DBEAFE',
      dark: '#1E40AF',
      contrast: '#FFFFFF',
    },
  },

  // Booking slot status colors
  status: {
    free: {
      main: '#22C55E',
      light: '#DCFCE7',
      dark: '#16A34A',
    },
    unpaid: {
      main: '#F97316',
      light: '#FFF7ED',
      dark: '#EA580C',
    },
    paid: {
      main: '#EF4444',
      light: '#FEF2F2',
      dark: '#DC2626',
    },
    past: {
      main: '#9CA3AF',
      light: '#F3F4F6',
      dark: '#6B7280',
    },
  },

  // Semantic colors
  success: {
    main: '#10B981',
    light: '#ECFDF5',
    dark: '#059669',
    contrast: '#FFFFFF',
  },
  warning: {
    main: '#F59E0B',
    light: '#FEF3C7',
    dark: '#D97706',
    contrast: '#1F2937',
  },
  error: {
    main: '#EF4444',
    light: '#FEF2F2',
    dark: '#DC2626',
    contrast: '#FFFFFF',
  },
  info: {
    main: '#3B82F6',
    light: '#EFF6FF',
    dark: '#2563EB',
    contrast: '#FFFFFF',
  },

  // Neutral palette (grayscale)
  neutral: {
    900: '#1F2937',
    800: '#1F2937',
    700: '#374151',
    600: '#4B5563',
    500: '#6B7280',
    400: '#9CA3AF',
    300: '#D1D5DB',
    200: '#E5E7EB',
    100: '#F3F4F6',
    50: '#F9FAFB',
    0: '#FFFFFF',
  },

  // Backgrounds
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
  },

  // Text colors
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    disabled: '#D1D5DB',
  },

  // Border colors
  border: {
    default: '#E5E7EB',
    light: '#F3F4F6',
    dark: '#D1D5DB',
    focus: '#F97316',
  },

  // Transparent variants
  transparent: {
    black10: 'rgba(0, 0, 0, 0.1)',
    black20: 'rgba(0, 0, 0, 0.2)',
    black50: 'rgba(0, 0, 0, 0.5)',
    white10: 'rgba(255, 255, 255, 0.1)',
    white20: 'rgba(255, 255, 255, 0.2)',
    white50: 'rgba(255, 255, 255, 0.5)',
  },
} as const;

export type Colors = typeof colors;
