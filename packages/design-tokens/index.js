/**
 * @real-estate/design-tokens
 *
 * Shared design tokens for cross-app visual consistency.
 * Portal (apps/portal) and SaaS apps (apps/web, apps/crm, apps/admin)
 * can import from this package to share color palettes, typography scales,
 * and spacing values.
 *
 * Usage:
 *   const { colors, typography, spacing } = require('@real-estate/design-tokens');
 *   // or: import { colors, typography, spacing } from '@real-estate/design-tokens';
 */

const colors = {
  brand: {
    primary: '#1a56db',
    primaryLight: '#3b82f6',
    primaryDark: '#1e40af',
    secondary: '#059669',
    secondaryLight: '#10b981',
    secondaryDark: '#047857',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  semantic: {
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
    info: '#2563eb',
  },
};

const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
};

const spacing = {
  px: '1px',
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
};

module.exports = { colors, typography, spacing };
