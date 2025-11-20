/**
 * Golf-themed color palette
 * Green colors inspired by golf courses and nature
 */

import { Platform } from 'react-native';

const tintColorLight = '#2D7D3E'; // Golf course green
const tintColorDark = '#4CAF50'; // Lighter green for dark mode

export const Colors = {
  light: {
    text: '#1B3A1F',
    background: '#FAFFF5', // Very light green-tinted white
    tint: tintColorLight,
    icon: '#5D7A62',
    tabIconDefault: '#7A8F7E',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#E8F5E9',
    background: '#1A2E1A',
    tint: tintColorDark,
    icon: '#81C784',
    tabIconDefault: '#66BB6A',
    tabIconSelected: tintColorDark,
  },
};

// Golf-specific color palette
export const GolfColors = {
  // Primary greens (golf course inspired)
  primary: '#2D7D3E', // Main golf green
  primaryDark: '#1B5E2A', // Darker shade
  primaryLight: '#4CAF50', // Lighter shade

  // Secondary colors
  fairway: '#3D9654', // Bright fairway green
  rough: '#5B8F6A', // Muted rough green
  sand: '#D4A574', // Sand trap beige

  // Accent colors
  success: '#4CAF50', // Success/under par
  warning: '#FF9800', // Warning
  error: '#E74C3C', // Error/over par
  info: '#2196F3', // Info

  // Neutral colors
  white: '#FFFFFF',
  lightGray: '#F5F9F7', // Light green-tinted gray
  gray: '#8BA888',
  darkGray: '#4A5A4D',
  black: '#1B3A1F',

  // Card/Surface colors
  cardBg: '#F8FCF9', // Very light green for cards
  cardBgAlt: '#EBF5ED', // Slightly darker card bg

  // Semantic colors
  underPar: '#4CAF50', // Good score (green)
  par: '#607D8B', // Even par (gray)
  overPar: '#FF7043', // Bad score (orange)
};

// Gradient definitions for use with LinearGradient
export const Gradients = {
  // Primary gradients
  primary: ['#2D7D3E', '#4CAF50'],
  primaryDark: ['#1B5E2A', '#2D7D3E'],
  primaryLight: ['#4CAF50', '#81C784'],

  // Golf-themed gradients
  fairway: ['#3D9654', '#5B8F6A'],
  sunrise: ['#FF9800', '#4CAF50'],
  sunset: ['#E74C3C', '#FF9800', '#2D7D3E'],

  // Card/Surface gradients
  card: ['#F8FCF9', '#EBF5ED'],
  cardDark: ['#1A2E1A', '#243D24'],

  // Overlay gradients
  overlayLight: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)'],
  overlayDark: ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)'],
  overlayGreen: ['rgba(45,125,62,0.8)', 'rgba(45,125,62,0.4)'],
};

// Shadow definitions
export const Shadows = {
  small: {
    shadowColor: '#1B3A1F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#1B3A1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#1B3A1F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Spacing scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
