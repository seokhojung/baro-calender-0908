// Accessibility utilities for WCAG 2.2 AA compliance

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Convert HSL color to RGB values
 */
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 1/6) {
    r = c; g = x; b = 0;
  } else if (1/6 <= h && h < 2/6) {
    r = x; g = c; b = 0;
  } else if (2/6 <= h && h < 3/6) {
    r = 0; g = c; b = x;
  } else if (3/6 <= h && h < 4/6) {
    r = 0; g = x; b = c;
  } else if (4/6 <= h && h < 5/6) {
    r = x; g = 0; b = c;
  } else if (5/6 <= h && h < 1) {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return { r, g, b };
}

/**
 * Parse HSL string to RGB values
 */
export function parseHslToRgb(hslString: string): { r: number; g: number; b: number } | null {
  const match = hslString.match(/hsl\(\s*(\d+)\s*,?\s*(\d+)%\s*,?\s*(\d+)%\s*\)/);
  if (!match) return null;
  
  const h = parseInt(match[1]);
  const s = parseInt(match[2]);
  const l = parseInt(match[3]);
  
  return hslToRgb(h, s, l);
}

/**
 * Calculate relative luminance according to WCAG guidelines
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  // Convert to sRGB
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  // Apply gamma correction
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  // Parse colors
  let rgb1 = hexToRgb(color1);
  let rgb2 = hexToRgb(color2);
  
  // Try parsing as HSL if hex parsing fails
  if (!rgb1) {
    rgb1 = parseHslToRgb(color1);
  }
  if (!rgb2) {
    rgb2 = parseHslToRgb(color2);
  }
  
  if (!rgb1 || !rgb2) {
    console.warn('Unable to parse colors for contrast calculation:', { color1, color2 });
    return 1; // Return minimum contrast if parsing fails
  }

  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color contrast meets WCAG AA standard (4.5:1)
 */
export function meetsWCAGAA(backgroundColor: string, textColor: string): boolean {
  const contrastRatio = getContrastRatio(backgroundColor, textColor);
  return contrastRatio >= 4.5;
}

/**
 * Check if color contrast meets WCAG AAA standard (7:1)
 */
export function meetsWCAGAAA(backgroundColor: string, textColor: string): boolean {
  const contrastRatio = getContrastRatio(backgroundColor, textColor);
  return contrastRatio >= 7;
}

/**
 * Get appropriate text color (black or white) for a background color
 */
export function getAccessibleTextColor(backgroundColor: string): string {
  const whiteContrast = getContrastRatio(backgroundColor, '#ffffff');
  const blackContrast = getContrastRatio(backgroundColor, '#000000');
  
  return whiteContrast > blackContrast ? '#ffffff' : '#000000';
}

/**
 * Generate screen reader announcement for project updates
 */
export function generateProjectAnnouncement(
  action: 'created' | 'updated' | 'deleted' | 'selected',
  projectName: string,
  additional?: string
): string {
  const announcements = {
    created: `새 프로젝트 "${projectName}"이 생성되었습니다.`,
    updated: `프로젝트 "${projectName}"이 업데이트되었습니다.`,
    deleted: `프로젝트 "${projectName}"이 삭제되었습니다.`,
    selected: `프로젝트 "${projectName}"이 선택되었습니다.`
  };
  
  const base = announcements[action];
  return additional ? `${base} ${additional}` : base;
}

/**
 * Announce to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Focus management utilities
 */
export class FocusManager {
  private static focusStack: HTMLElement[] = [];
  
  /**
   * Store current focus and move to new element
   */
  static pushFocus(element: HTMLElement | null) {
    const currentFocus = document.activeElement as HTMLElement;
    if (currentFocus && currentFocus !== document.body) {
      this.focusStack.push(currentFocus);
    }
    
    if (element) {
      element.focus();
    }
  }
  
  /**
   * Restore previous focus
   */
  static popFocus() {
    const previousFocus = this.focusStack.pop();
    if (previousFocus) {
      previousFocus.focus();
    }
  }
  
  /**
   * Clear focus stack
   */
  static clearFocusStack() {
    this.focusStack = [];
  }
}

/**
 * Keyboard trap for modals and dropdowns
 */
export class KeyboardTrap {
  private element: HTMLElement;
  private focusableElements: HTMLElement[];
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;
  
  constructor(element: HTMLElement) {
    this.element = element;
    this.focusableElements = this.getFocusableElements();
    this.updateFocusableElements();
    this.addEventListeners();
  }
  
  private getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    return Array.from(this.element.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }
  
  private updateFocusableElements() {
    this.focusableElements = this.getFocusableElements();
    this.firstFocusable = this.focusableElements[0] || null;
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1] || null;
  }
  
  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    this.updateFocusableElements();
    
    if (!this.firstFocusable || !this.lastFocusable) return;
    
    if (e.shiftKey) {
      // Shift + Tab (backward)
      if (document.activeElement === this.firstFocusable) {
        e.preventDefault();
        this.lastFocusable.focus();
      }
    } else {
      // Tab (forward)
      if (document.activeElement === this.lastFocusable) {
        e.preventDefault();
        this.firstFocusable.focus();
      }
    }
  };
  
  private addEventListeners() {
    this.element.addEventListener('keydown', this.handleKeyDown);
  }
  
  public focusFirst() {
    if (this.firstFocusable) {
      this.firstFocusable.focus();
    }
  }
  
  public destroy() {
    this.element.removeEventListener('keydown', this.handleKeyDown);
  }
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}