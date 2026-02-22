import type { BrandPreferences, ThemeStyleVars } from './crm-types';

export function toTitleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((entry) => entry.charAt(0).toUpperCase() + entry.slice(1))
    .join(' ');
}

export function getBrandInitials(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    return 'CRM';
  }
  const parts = normalized.split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

export function normalizeHexColor(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (/^#([0-9a-fA-F]{6})$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return fallback;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHexColor(hex, '#1c1917').slice(1);
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

export function rgbToHex(red: number, green: number, blue: number): string {
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
  const toHex = (value: number) => clamp(value).toString(16).padStart(2, '0');
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

export function shiftHexColor(hex: string, shift: number): string {
  const { r, g, b } = hexToRgb(hex);
  if (shift >= 0) {
    const factor = shift / 100;
    return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor);
  }
  const factor = 1 + shift / 100;
  return rgbToHex(r * factor, g * factor, b * factor);
}

export function withHexAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function createDefaultBrandPreferences(tenantSlug: string): BrandPreferences {
  return {
    brandName: `${toTitleCase(tenantSlug)} Realty`,
    accentColor: '#1c1917',
    surfaceTint: '#d6cec4',
    customLogoUrl: '',
    useWebsiteFavicon: true,
    showTexture: true,
  };
}

export function buildBrandThemeVars(preferences: BrandPreferences): ThemeStyleVars {
  const accent = normalizeHexColor(preferences.accentColor, '#1c1917');
  const surfaceTint = normalizeHexColor(preferences.surfaceTint, '#d6cec4');
  const highlight = shiftHexColor(accent, -8);
  const accentHover = shiftHexColor(accent, -20);

  return {
    '--crm-accent': accent,
    '--crm-accent-hover': accentHover,
    '--crm-highlight': highlight,
    '--crm-highlight-soft': withHexAlpha(accent, 0.18),
    '--crm-brand-tint': withHexAlpha(surfaceTint, 0.24),
    '--crm-brand-accent-soft': withHexAlpha(accent, 0.08),
  };
}
