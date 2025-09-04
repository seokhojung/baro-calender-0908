/**
 * Design Tokens TypeScript Utilities
 * Provides type-safe access to CSS custom properties
 */

// === Color Palette Types ===
export type ColorScale = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export type ColorName = 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'yellow' | 'teal' | 'pink';

// === Typography Types ===
export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
export type FontWeight = 'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
export type LineHeight = 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';

// === Spacing Types ===
export type SpacingScale = 
  | '0' | 'px' | '0.5' | '1' | '1.5' | '2' | '2.5' | '3' | '3.5' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
  | '11' | '12' | '14' | '16' | '20' | '24' | '28' | '32' | '36' | '40' | '44' | '48' | '52' | '56' | '60' 
  | '64' | '72' | '80' | '96';

// === Radius Types ===
export type BorderRadius = 'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';

// === Design Token Values ===
export const designTokens = {
  colors: {
    blue: '#3B82F6',
    green: '#10B981',
    purple: '#8B5CF6',
    red: '#EF4444',
    orange: '#F97316',
    yellow: '#EAB308',
    teal: '#14B8A6',
    pink: '#EC4899',
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
    '5xl': '3rem',
  },

  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  spacing: {
    '0': '0',
    'px': '1px',
    '0.5': '0.125rem',
    '1': '0.25rem',
    '1.5': '0.375rem',
    '2': '0.5rem',
    '2.5': '0.625rem',
    '3': '0.75rem',
    '3.5': '0.875rem',
    '4': '1rem',
    '5': '1.25rem',
    '6': '1.5rem',
    '7': '1.75rem',
    '8': '2rem',
    '9': '2.25rem',
    '10': '2.5rem',
    '11': '2.75rem',
    '12': '3rem',
    '14': '3.5rem',
    '16': '4rem',
    '20': '5rem',
    '24': '6rem',
    '28': '7rem',
    '32': '8rem',
    '36': '9rem',
    '40': '10rem',
    '44': '11rem',
    '48': '12rem',
    '52': '13rem',
    '56': '14rem',
    '60': '15rem',
    '64': '16rem',
    '72': '18rem',
    '80': '20rem',
    '96': '24rem',
  },

  borderRadius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
} as const;

// === Utility Functions ===

/**
 * Get a color CSS variable
 */
export function getColor(color: ColorName, scale?: ColorScale): string {
  if (scale) {
    return `var(--color-${color}-${scale})`;
  }
  return `var(--color-${color})`;
}

/**
 * Get a typography CSS variable
 */
export function getFontSize(size: FontSize): string {
  return `var(--text-${size})`;
}

export function getFontWeight(weight: FontWeight): string {
  return `var(--font-${weight})`;
}

export function getLineHeight(height: LineHeight): string {
  return `var(--leading-${height})`;
}

/**
 * Get a spacing CSS variable
 */
export function getSpacing(scale: SpacingScale): string {
  return `var(--space-${scale})`;
}

/**
 * Get a border radius CSS variable
 */
export function getBorderRadius(radius: BorderRadius): string {
  return `var(--radius-${radius})`;
}

/**
 * Create CSS style object using design tokens
 */
export function createStyles(styles: {
  color?: { name: ColorName; scale?: ColorScale };
  fontSize?: FontSize;
  fontWeight?: FontWeight;
  lineHeight?: LineHeight;
  spacing?: { property: 'margin' | 'padding' | 'gap'; scale: SpacingScale };
  borderRadius?: BorderRadius;
}) {
  const result: Record<string, string> = {};

  if (styles.color) {
    result.color = getColor(styles.color.name, styles.color.scale);
  }

  if (styles.fontSize) {
    result.fontSize = getFontSize(styles.fontSize);
  }

  if (styles.fontWeight) {
    result.fontWeight = getFontWeight(styles.fontWeight);
  }

  if (styles.lineHeight) {
    result.lineHeight = getLineHeight(styles.lineHeight);
  }

  if (styles.spacing) {
    result[styles.spacing.property] = getSpacing(styles.spacing.scale);
  }

  if (styles.borderRadius) {
    result.borderRadius = getBorderRadius(styles.borderRadius);
  }

  return result;
}

// === Breakpoints ===
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export type Breakpoint = keyof typeof breakpoints;