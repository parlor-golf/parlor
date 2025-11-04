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
