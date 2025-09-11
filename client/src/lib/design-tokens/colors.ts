// Design Token Colors for Baro Calendar
// 8가지 프로젝트 색상 시스템

export const PROJECT_COLORS = {
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE', 
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // 기본값
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  green: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // 기본값
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  purple: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6', // 기본값
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },
  orange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316', // 기본값
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444', // 기본값
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  teal: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6', // 기본값
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },
  pink: {
    50: '#FDF2F8',
    100: '#FCE7F3',
    200: '#FBCFE8',
    300: '#F9A8D4',
    400: '#F472B6',
    500: '#EC4899', // 기본값
    600: '#DB2777',
    700: '#BE185D',
    800: '#9D174D',
    900: '#831843',
  },
  indigo: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1', // 기본값
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
} as const

export type ProjectColor = keyof typeof PROJECT_COLORS
export type ColorScale = keyof (typeof PROJECT_COLORS)[ProjectColor]

// 색상 유틸리티 함수
export const getProjectColor = (color: ProjectColor, scale: ColorScale = 500) => {
  return PROJECT_COLORS[color][scale]
}

export const getCSSVariable = (name: string) => `var(--${name})`

// 프로젝트 색상 목록 (UI에서 사용)
export const PROJECT_COLOR_LIST: { name: ProjectColor; label: string; hex: string }[] = [
  { name: 'blue', label: '블루', hex: PROJECT_COLORS.blue[500] },
  { name: 'green', label: '그린', hex: PROJECT_COLORS.green[500] },
  { name: 'purple', label: '퍼플', hex: PROJECT_COLORS.purple[500] },
  { name: 'orange', label: '오렌지', hex: PROJECT_COLORS.orange[500] },
  { name: 'red', label: '레드', hex: PROJECT_COLORS.red[500] },
  { name: 'teal', label: '틸', hex: PROJECT_COLORS.teal[500] },
  { name: 'pink', label: '핑크', hex: PROJECT_COLORS.pink[500] },
  { name: 'indigo', label: '인디고', hex: PROJECT_COLORS.indigo[500] },
]

// 색상 접근성 검증 함수
export const checkColorContrast = (foreground: string, background: string): number => {
  // RGB 변환 함수
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  // 상대 휘도 계산
  const getLuminance = (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  
  const fgLuminance = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  const brightest = Math.max(fgLuminance, bgLuminance);
  const darkest = Math.min(fgLuminance, bgLuminance);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

// WCAG 준수 여부 확인
export const isWCAGCompliant = (foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
  const contrast = checkColorContrast(foreground, background);
  return level === 'AA' ? contrast >= 4.5 : contrast >= 7;
}

// 색상 팔레트 생성 함수 (밝기 조절)
export const generateColorPalette = (baseColor: string, steps = 9) => {
  // HSL 변환을 통한 팔레트 생성 (구현 간소화)
  const palette: Record<string, string> = {};
  const scales = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  
  scales.slice(0, steps).forEach((scale, index) => {
    palette[scale.toString()] = baseColor; // 실제로는 HSL 조작 필요
  });
  
  return palette;
}