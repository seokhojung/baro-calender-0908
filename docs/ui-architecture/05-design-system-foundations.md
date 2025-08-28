# Design System Foundations

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처 - 디자인 시스템 기초

---

## 🎨 **5a. Design System Foundations**

### **5a.1 Design Tokens 시스템**

**핵심 원칙**: **일관성과 확장성을 위한 토큰 기반 디자인**

#### **CSS Variables (Design Tokens)**
```css
/* src/styles/globals.css */
:root {
  /* 프로젝트 색상 시스템 - 8가지 기본 색상 */
  --project-blue: #3B82F6;      /* #1: 블루 프로젝트 */
  --project-green: #10B981;     /* #2: 그린 프로젝트 */
  --project-purple: #8B5CF6;    /* #3: 퍼플 프로젝트 */
  --project-orange: #F59E0B;    /* #4: 오렌지 프로젝트 */
  --project-red: #EF4444;       /* #5: 레드 프로젝트 */
  --project-teal: #14B8A6;      /* #6: 틸 프로젝트 */
  --project-pink: #EC4899;      /* #7: 핑크 프로젝트 */
  --project-indigo: #6366F1;    /* #8: 인디고 프로젝트 */
  
  /* 시맨틱 색상 */
  --primary: var(--project-blue);
  --primary-foreground: #ffffff;
  --secondary: #f8fafc;
  --secondary-foreground: #0f172a;
  --accent: #f1f5f9;
  --accent-foreground: #0f172a;
  --destructive: #ef4444;
  --destructive-foreground: #ffffff;
  --muted: #f8fafc;
  --muted-foreground: #64748b;
  --border: #e2e8f0;
  --input: #e2e8f0;
  --ring: var(--primary);
  --background: #ffffff;
  --foreground: #0f172a;
  --card: #ffffff;
  --card-foreground: #0f172a;
  --popover: #ffffff;
  --popover-foreground: #0f172a;
  
  /* 타이포그래피 */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace;
  
  /* 간격 시스템 */
  --spacing-xs: 0.25rem;    /* 4px */
  --spacing-sm: 0.5rem;     /* 8px */
  --spacing-md: 1rem;       /* 16px */
  --spacing-lg: 1.5rem;     /* 24px */
  --spacing-xl: 2rem;       /* 32px */
  --spacing-2xl: 3rem;      /* 48px */
  --spacing-3xl: 4rem;      /* 64px */
  
  /* 그림자 시스템 */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  
  /* 애니메이션 */
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 300ms ease-in-out;
  --transition-slow: 500ms ease-in-out;
  
  /* 반응형 브레이크포인트 */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* 다크모드 */
[data-theme="dark"] {
  --background: #0f172a;
  --foreground: #f8fafc;
  --card: #1e293b;
  --card-foreground: #f8fafc;
  --popover: #1e293b;
  --popover-foreground: #f8fafc;
  --primary: #3b82f6;
  --primary-foreground: #ffffff;
  --secondary: #1e293b;
  --secondary-foreground: #f8fafc;
  --muted: #1e293b;
  --muted-foreground: #64748b;
  --accent: #1e293b;
  --accent-foreground: #f8fafc;
  --destructive: #ef4444;
  --destructive-foreground: #ffffff;
  --border: #334155;
  --input: #334155;
  --ring: #3b82f6;
}
```

### **5a.2 Color System 아키텍처**

#### **색상 팔레트 구조**
```typescript
// src/lib/design-tokens/colors.ts
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
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // 기본값
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
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

// CSS 변수로 색상 접근
export const getCSSVariable = (name: string) => `var(--${name})`

// 동적 색상 생성
export const generateColorScale = (baseColor: string) => {
  // HSL 기반으로 색상 스케일 생성 로직
  const hsl = hexToHsl(baseColor)
  return {
    50: hslToHex({ ...hsl, l: 97 }),
    100: hslToHex({ ...hsl, l: 94 }),
    200: hslToHex({ ...hsl, l: 87 }),
    300: hslToHex({ ...hsl, l: 75 }),
    400: hslToHex({ ...hsl, l: 62 }),
    500: baseColor, // 기본값
    600: hslToHex({ ...hsl, l: 48 }),
    700: hslToHex({ ...hsl, l: 38 }),
    800: hslToHex({ ...hsl, l: 30 }),
    900: hslToHex({ ...hsl, l: 24 }),
  }
}
```

#### **시맨틱 색상 매핑**
```typescript
// src/lib/design-tokens/semantic-colors.ts
export const SEMANTIC_COLORS = {
  primary: {
    light: getCSSVariable('project-blue'),
    dark: getCSSVariable('project-blue'),
  },
  secondary: {
    light: '#f8fafc',
    dark: '#1e293b',
  },
  success: {
    light: getCSSVariable('project-green'),
    dark: getCSSVariable('project-green'),
  },
  warning: {
    light: getCSSVariable('project-orange'),
    dark: getCSSVariable('project-orange'),
  },
  danger: {
    light: getCSSVariable('project-red'),
    dark: getCSSVariable('project-red'),
  },
  info: {
    light: getCSSVariable('project-blue'),
    dark: getCSSVariable('project-blue'),
  },
  neutral: {
    light: '#64748b',
    dark: '#94a3b8',
  },
} as const

// 사용 예시
export const useSemanticColor = (color: keyof typeof SEMANTIC_COLORS, theme: 'light' | 'dark' = 'light') => {
  return SEMANTIC_COLORS[color][theme]
}
```

### **5a.3 Typography System**

#### **폰트 계층 구조**
```typescript
// src/lib/design-tokens/typography.ts
export const TYPOGRAPHY = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
    heading: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  },
  fontSize: {
    'xs': ['0.75rem', { lineHeight: '1rem' }],        // 12px
    'sm': ['0.875rem', { lineHeight: '1.25rem' }],    // 14px
    'base': ['1rem', { lineHeight: '1.5rem' }],       // 16px
    'lg': ['1.125rem', { lineHeight: '1.75rem' }],    // 18px
    'xl': ['1.25rem', { lineHeight: '1.75rem' }],     // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],   // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],     // 36px
    '5xl': ['3rem', { lineHeight: '1' }],             // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],          // 60px
    '7xl': ['4.5rem', { lineHeight: '1' }],           // 72px
    '8xl': ['6rem', { lineHeight: '1' }],             // 96px
    '9xl': ['8rem', { lineHeight: '1' }],             // 128px
  },
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const

// 타이포그래피 유틸리티
export type FontSize = keyof typeof TYPOGRAPHY.fontSize
export type FontWeight = keyof typeof TYPOGRAPHY.fontWeight
export type LetterSpacing = keyof typeof TYPOGRAPHY.letterSpacing

export const getTypographyStyles = (
  size: FontSize,
  weight: FontWeight = 'normal',
  spacing: LetterSpacing = 'normal'
) => ({
  fontSize: TYPOGRAPHY.fontSize[size][0],
  lineHeight: TYPOGRAPHY.fontSize[size][1].lineHeight,
  fontWeight: TYPOGRAPHY.fontWeight[weight],
  letterSpacing: TYPOGRAPHY.letterSpacing[spacing],
})
```

#### **타이포그래피 컴포넌트**
```typescript
// src/components/ui/Typography.tsx
interface TypographyProps {
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'overline'
  children: React.ReactNode
  className?: string
  as?: React.ElementType
}

const typographyVariants = {
  h1: 'text-4xl font-bold leading-tight tracking-tight',
  h2: 'text-3xl font-semibold leading-tight tracking-tight',
  h3: 'text-2xl font-semibold leading-snug',
  h4: 'text-xl font-medium leading-snug',
  h5: 'text-lg font-medium leading-normal',
  h6: 'text-base font-medium leading-normal',
  body1: 'text-base leading-relaxed',
  body2: 'text-sm leading-relaxed',
  caption: 'text-xs leading-normal text-muted-foreground',
  overline: 'text-xs font-medium uppercase tracking-wider text-muted-foreground',
} as const

export const Typography: React.FC<TypographyProps> = ({
  variant,
  children,
  className,
  as,
}) => {
  const Component = as || getDefaultElement(variant)
  
  return (
    <Component className={cn(typographyVariants[variant], className)}>
      {children}
    </Component>
  )
}

const getDefaultElement = (variant: TypographyProps['variant']): React.ElementType => {
  switch (variant) {
    case 'h1': return 'h1'
    case 'h2': return 'h2'
    case 'h3': return 'h3'
    case 'h4': return 'h4'
    case 'h5': return 'h5'
    case 'h6': return 'h6'
    case 'overline': return 'span'
    default: return 'p'
  }
}
```

### **5a.4 Spacing System**

#### **간격 토큰 시스템**
```typescript
// src/lib/design-tokens/spacing.ts
export const SPACING = {
  // 기본 간격 (4px 기준)
  px: '1px',
  0: '0px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
  
  // 시맨틱 간격
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
  '4xl': '5rem',    // 80px
  '5xl': '6rem',    // 96px
} as const

// 레이아웃 간격
export const LAYOUT_SPACING = {
  // 컨테이너 패딩
  containerPadding: {
    mobile: SPACING.md,    // 16px
    tablet: SPACING.lg,    // 24px
    desktop: SPACING.xl,   // 32px
  },
  
  // 섹션 간격
  sectionSpacing: {
    small: SPACING['2xl'],   // 48px
    medium: SPACING['3xl'],  // 64px
    large: SPACING['4xl'],   // 80px
  },
  
  // 컴포넌트 간격
  componentSpacing: {
    tight: SPACING.sm,     // 8px
    normal: SPACING.md,    // 16px
    loose: SPACING.lg,     // 24px
  },
} as const
```

#### **간격 유틸리티**
```typescript
// src/lib/utils/spacing.ts
export type SpacingKey = keyof typeof SPACING
export type SpacingValue = typeof SPACING[SpacingKey]

// 반응형 간격 생성
export const createResponsiveSpacing = (
  mobile: SpacingKey,
  tablet?: SpacingKey,
  desktop?: SpacingKey
) => {
  const styles = [SPACING[mobile]]
  
  if (tablet) {
    styles.push(`md:${SPACING[tablet]}`)
  }
  
  if (desktop) {
    styles.push(`lg:${SPACING[desktop]}`)
  }
  
  return styles.join(' ')
}

// 간격 계산 유틸리티
export const multiplySpacing = (base: SpacingKey, multiplier: number): string => {
  const baseValue = parseFloat(SPACING[base])
  const unit = SPACING[base].replace(baseValue.toString(), '')
  return `${baseValue * multiplier}${unit}`
}

// 간격 합산 유틸리티
export const addSpacing = (spaces: SpacingKey[]): string => {
  const total = spaces.reduce((sum, space) => {
    const value = parseFloat(SPACING[space])
    return sum + value
  }, 0)
  
  return `${total}rem`
}
```

### **5a.5 Shadow & Elevation System**

#### **그림자 토큰**
```typescript
// src/lib/design-tokens/shadows.ts
export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  
  // 컬러드 그림자
  colored: {
    blue: '0 10px 15px -3px rgb(59 130 246 / 0.1), 0 4px 6px -4px rgb(59 130 246 / 0.1)',
    green: '0 10px 15px -3px rgb(16 185 129 / 0.1), 0 4px 6px -4px rgb(16 185 129 / 0.1)',
    purple: '0 10px 15px -3px rgb(139 92 246 / 0.1), 0 4px 6px -4px rgb(139 92 246 / 0.1)',
    red: '0 10px 15px -3px rgb(239 68 68 / 0.1), 0 4px 6px -4px rgb(239 68 68 / 0.1)',
  },
} as const

// 엘레베이션 시스템 (Material Design 기반)
export const ELEVATION = {
  0: SHADOWS.none,
  1: SHADOWS.sm,
  2: SHADOWS.DEFAULT,
  3: SHADOWS.md,
  4: SHADOWS.lg,
  5: SHADOWS.xl,
  6: SHADOWS['2xl'],
} as const

export type ElevationLevel = keyof typeof ELEVATION

// 그림자 유틸리티
export const getElevation = (level: ElevationLevel) => ELEVATION[level]

export const createColoredShadow = (color: string, opacity = 0.1) => {
  const rgb = hexToRgb(color)
  return `0 10px 15px -3px rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${opacity}), 0 4px 6px -4px rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${opacity})`
}
```

---

## 📚 **관련 문서**

- [**05b. Component Styling Patterns**](./05b-component-styling-patterns.md) - 컴포넌트 스타일링 접근법
- [**05c. Theme & Responsive Design**](./05c-theme-responsive-design.md) - 테마 커스터마이징 및 반응형 디자인
- [**03. Component Standards**](./03-component-standards.md) - 컴포넌트 표준 및 패턴

---

## 🎯 **요약**

이 문서는 바로캘린더의 디자인 시스템 기초를 정의합니다:

1. **Design Tokens**: 일관된 디자인을 위한 CSS 변수 시스템
2. **Color System**: 8가지 프로젝트 색상과 시맨틱 매핑
3. **Typography**: 체계적인 폰트 계층 구조
4. **Spacing**: 4px 기반의 간격 시스템
5. **Shadows**: Material Design 기반의 엘레베이션

**개발팀이 일관된 디자인 토큰으로 작업할 수 있는 기반이 마련되었습니다!**