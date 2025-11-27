/**
 * Arena App Theme Provider
 * Provides theme context to all components
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { colors, Colors } from './colors';
import { spacing, borderRadius, dimensions, Spacing, BorderRadius, Dimensions } from './spacing';
import { shadows, Shadows } from './shadows';
import { textStyles, fontFamilies, fontSizes, TextStyles, FontFamilies } from './typography';

// Theme interface
export interface Theme {
  colors: Colors;
  spacing: Spacing;
  borderRadius: BorderRadius;
  dimensions: Dimensions;
  shadows: Shadows;
  textStyles: TextStyles;
  fontFamilies: FontFamilies;
  fontSizes: typeof fontSizes;
}

// Create the theme object
const theme: Theme = {
  colors,
  spacing,
  borderRadius,
  dimensions,
  shadows,
  textStyles,
  fontFamilies,
  fontSizes,
};

// Create context
const ThemeContext = createContext<Theme | undefined>(undefined);

// Provider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Theme Provider component
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme
export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export theme for direct access (useful in StyleSheet.create)
export { theme };
