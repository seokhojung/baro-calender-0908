# Theme & Responsive Design

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처 - 테마 및 반응형 디자인

---

## 🎨 **5c. Theme & Responsive Design**

### **5c.1 Tweak CN 테마 시스템**

#### **Tweak CN 설치 및 기본 설정**
```bash
# 1. Tweak CN 초기화
npx tweak-cn@latest init

# 2. 기본 테마 추가
npx tweak-cn@latest add

# 3. 커스텀 색상 팔레트 생성
npx tweak-cn@latest add --palette custom
```

#### **커스텀 테마 설정**
```typescript
// tweak.config.ts
import { defineConfig } from 'tweak-cn'

export default defineConfig({
  themes: {
    light: {
      colors: {
        // 프로젝트 색상 시스템
        'project-blue': {
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
        'project-green': {
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
        // ... 다른 프로젝트 색상들
      },
      borderRadius: {
        'none': '0px',
        'sm': '0.125rem',
        'default': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px',
      },
      spacing: {
        'xs': '0.25rem',
        'sm': '0.5rem',
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
      },
    },
    dark: {
      colors: {
        // 다크모드 프로젝트 색상
        'project-blue': {
          50: '#0F172A',
          100: '#1E293B',
          200: '#334155',
          300: '#475569',
          400: '#64748B',
          500: '#94A3B8', // 다크모드 기본값
          600: '#CBD5E1',
          700: '#E2E8F0',
          800: '#F1F5F9',
          900: '#F8FAFC',
        },
        // ... 다른 다크모드 색상들
      },
    },
  },
  // 컴포넌트별 커스터마이징
  components: {
    button: {
      variants: {
        'project-blue': {
          backgroundColor: 'hsl(var(--project-blue-500))',
          color: 'hsl(var(--project-blue-50))',
          '&:hover': {
            backgroundColor: 'hsl(var(--project-blue-600))',
          },
        },
        'project-green': {
          backgroundColor: 'hsl(var(--project-green-500))',
          color: 'hsl(var(--project-green-50))',
          '&:hover': {
            backgroundColor: 'hsl(var(--project-green-600))',
          },
        },
      },
    },
    calendar: {
      variants: {
        'project-themed': {
          '.rdp-day_selected': {
            backgroundColor: 'hsl(var(--project-blue-500))',
            color: 'hsl(var(--project-blue-50))',
          },
          '.rdp-day_today': {
            borderColor: 'hsl(var(--project-blue-500))',
          },
        },
      },
    },
  },
})
```

### **5c.2 다크모드 구현 시스템**

#### **테마 컨텍스트 및 훅**
```typescript
// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  
  useEffect(() => {
    const root = window.document.documentElement
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setResolvedTheme(systemTheme)
      root.setAttribute('data-theme', systemTheme)
    } else {
      setResolvedTheme(theme)
      root.setAttribute('data-theme', theme)
    }
    
    // 로컬 스토리지에 저장
    localStorage.setItem('theme', theme)
  }, [theme])
  
  useEffect(() => {
    // 시스템 테마 변경 감지
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const newTheme = e.matches ? 'dark' : 'light'
        setResolvedTheme(newTheme)
        window.document.documentElement.setAttribute('data-theme', newTheme)
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])
  
  // 초기 테마 로드
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system'
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
```

#### **테마 전환 컴포넌트**
```typescript
// src/components/ui/ThemeToggle.tsx
import React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()
  
  return (
    <div className="flex items-center space-x-2 bg-muted rounded-lg p-1">
      <button
        onClick={() => setTheme('light')}
        className={cn(
          'p-2 rounded-md transition-all duration-200',
          'flex items-center justify-center',
          'hover:bg-background hover:shadow-sm',
          theme === 'light' 
            ? 'bg-background text-foreground shadow-sm' 
            : 'text-muted-foreground'
        )}
        aria-label="라이트 모드"
        title="라이트 모드"
      >
        <Sun className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => setTheme('system')}
        className={cn(
          'p-2 rounded-md transition-all duration-200',
          'flex items-center justify-center',
          'hover:bg-background hover:shadow-sm',
          theme === 'system' 
            ? 'bg-background text-foreground shadow-sm' 
            : 'text-muted-foreground'
        )}
        aria-label="시스템 테마"
        title="시스템 테마"
      >
        <Monitor className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          'p-2 rounded-md transition-all duration-200',
          'flex items-center justify-center',
          'hover:bg-background hover:shadow-sm',
          theme === 'dark' 
            ? 'bg-background text-foreground shadow-sm' 
            : 'text-muted-foreground'
        )}
        aria-label="다크 모드"
        title="다크 모드"
      >
        <Moon className="h-4 w-4" />
      </button>
    </div>
  )
}

// 간단한 토글 버전
export const SimpleThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme()
  
  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className={cn(
        'p-2 rounded-md transition-colors',
        'bg-muted hover:bg-accent',
        'text-foreground'
      )}
      aria-label={`${resolvedTheme === 'dark' ? '라이트' : '다크'} 모드로 전환`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  )
}
```

### **5c.3 반응형 디자인 시스템**

#### **브레이크포인트 시스템**
```typescript
// src/lib/constants/breakpoints.ts
export const BREAKPOINTS = {
  xs: 0,      // 모바일 세로
  sm: 640,    // 모바일 가로
  md: 768,    // 태블릿
  lg: 1024,   // 데스크톱
  xl: 1280,   // 대형 데스크톱
  '2xl': 1536, // 초대형 데스크톱
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

// 반응형 훅
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('xs')
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      
      if (width >= BREAKPOINTS['2xl']) setBreakpoint('2xl')
      else if (width >= BREAKPOINTS.xl) setBreakpoint('xl')
      else if (width >= BREAKPOINTS.lg) setBreakpoint('lg')
      else if (width >= BREAKPOINTS.md) setBreakpoint('md')
      else if (width >= BREAKPOINTS.sm) setBreakpoint('sm')
      else setBreakpoint('xs')
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return breakpoint
}

// 반응형 유틸리티
export const isMobile = (breakpoint: Breakpoint) => breakpoint === 'xs' || breakpoint === 'sm'
export const isTablet = (breakpoint: Breakpoint) => breakpoint === 'md'
export const isDesktop = (breakpoint: Breakpoint) => breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl'

// 미디어 쿼리 유틸리티
export const mediaQuery = {
  up: (breakpoint: Breakpoint) => `@media (min-width: ${BREAKPOINTS[breakpoint]}px)`,
  down: (breakpoint: Breakpoint) => `@media (max-width: ${BREAKPOINTS[breakpoint] - 1}px)`,
  between: (min: Breakpoint, max: Breakpoint) => 
    `@media (min-width: ${BREAKPOINTS[min]}px) and (max-width: ${BREAKPOINTS[max] - 1}px)`,
}
```

#### **반응형 컴포넌트 패턴**
```typescript
// src/components/layout/ResponsiveContainer.tsx
import React from 'react'
import { cn } from '@/lib/utils'
import { useBreakpoint } from '@/lib/constants/breakpoints'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  maxWidth = 'xl',
  padding = 'md',
}) => {
  const breakpoint = useBreakpoint()
  const isMobileView = breakpoint === 'xs' || breakpoint === 'sm'
  
  return (
    <div className={cn(
      'mx-auto w-full',
      // 최대 너비 설정
      {
        'max-w-sm': maxWidth === 'sm',
        'max-w-md': maxWidth === 'md',
        'max-w-lg': maxWidth === 'lg',
        'max-w-xl': maxWidth === 'xl',
        'max-w-2xl': maxWidth === '2xl',
        'max-w-none': maxWidth === 'full',
      },
      // 패딩 설정
      {
        'px-0': padding === 'none',
        'px-4 sm:px-6': padding === 'sm',
        'px-4 sm:px-6 lg:px-8': padding === 'md',
        'px-6 sm:px-8 lg:px-12': padding === 'lg',
      },
      className
    )}>
      {children}
    </div>
  )
}

// 반응형 그리드 컴포넌트
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode
  cols?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}> = ({
  children,
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
  gap = 'md',
  className,
}) => {
  return (
    <div className={cn(
      'grid',
      // 반응형 그리드 열
      {
        [`grid-cols-${cols.xs}`]: cols.xs,
        [`sm:grid-cols-${cols.sm}`]: cols.sm,
        [`md:grid-cols-${cols.md}`]: cols.md,
        [`lg:grid-cols-${cols.lg}`]: cols.lg,
        [`xl:grid-cols-${cols.xl}`]: cols.xl,
      },
      // 간격 설정
      {
        'gap-2': gap === 'sm',
        'gap-4': gap === 'md',
        'gap-6': gap === 'lg',
      },
      className
    )}>
      {children}
    </div>
  )
}
```

#### **모바일 퍼스트 CSS 패턴**
```css
/* src/styles/responsive.css */
/* 기본 (모바일) 스타일 */
.responsive-component {
  padding: var(--spacing-sm);
  font-size: 0.875rem;
  border-radius: var(--border-radius-sm);
  grid-template-columns: 1fr;
}

/* 모바일 가로 이상 */
@media (min-width: 640px) {
  .responsive-component {
    padding: var(--spacing-md);
    font-size: 1rem;
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 태블릿 이상 */
@media (min-width: 768px) {
  .responsive-component {
    padding: var(--spacing-md);
    font-size: 1rem;
    border-radius: var(--border-radius-md);
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 데스크톱 이상 */
@media (min-width: 1024px) {
  .responsive-component {
    padding: var(--spacing-lg);
    font-size: 1.125rem;
    border-radius: var(--border-radius-lg);
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 대형 데스크톱 */
@media (min-width: 1280px) {
  .responsive-component {
    padding: var(--spacing-xl);
    font-size: 1.25rem;
    grid-template-columns: repeat(5, 1fr);
  }
}

/* 반응형 텍스트 크기 */
.responsive-text {
  font-size: clamp(1rem, 2.5vw, 1.5rem);
}

/* 반응형 간격 */
.responsive-spacing {
  margin: clamp(1rem, 5vw, 3rem) 0;
}
```

### **5c.4 테마 커스터마이징 시스템**

#### **프로젝트별 테마 생성**
```typescript
// src/lib/themes/project-themes.ts
export const PROJECT_THEMES = {
  blue: {
    name: '블루 프로젝트',
    primary: 'var(--project-blue)',
    secondary: '#E0F2FE',
    accent: '#0EA5E9',
    gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
  },
  green: {
    name: '그린 프로젝트',
    primary: 'var(--project-green)',
    secondary: '#DCFCE7',
    accent: '#059669',
    gradient: 'linear-gradient(135deg, #10B981, #047857)',
  },
  purple: {
    name: '퍼플 프로젝트',
    primary: 'var(--project-purple)',
    secondary: '#F3E8FF',
    accent: '#7C3AED',
    gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
  },
  orange: {
    name: '오렌지 프로젝트',
    primary: 'var(--project-orange)',
    secondary: '#FEF3C7',
    accent: '#D97706',
    gradient: 'linear-gradient(135deg, #F59E0B, #B45309)',
  },
  red: {
    name: '레드 프로젝트',
    primary: 'var(--project-red)',
    secondary: '#FEE2E2',
    accent: '#DC2626',
    gradient: 'linear-gradient(135deg, #EF4444, #B91C1C)',
  },
  teal: {
    name: '틸 프로젝트',
    primary: 'var(--project-teal)',
    secondary: '#F0FDFA',
    accent: '#0D9488',
    gradient: 'linear-gradient(135deg, #14B8A6, #0F766E)',
  },
  pink: {
    name: '핑크 프로젝트',
    primary: 'var(--project-pink)',
    secondary: '#FCE7F3',
    accent: '#DB2777',
    gradient: 'linear-gradient(135deg, #EC4899, #BE185D)',
  },
  indigo: {
    name: '인디고 프로젝트',
    primary: 'var(--project-indigo)',
    secondary: '#E0E7FF',
    accent: '#4F46E5',
    gradient: 'linear-gradient(135deg, #6366F1, #4338CA)',
  },
} as const

export type ProjectThemeKey = keyof typeof PROJECT_THEMES

// 테마 적용 훅
export const useProjectTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<ProjectThemeKey>('blue')
  
  const applyTheme = (themeKey: ProjectThemeKey) => {
    const theme = PROJECT_THEMES[themeKey]
    const root = document.documentElement
    
    root.style.setProperty('--current-primary', theme.primary)
    root.style.setProperty('--current-secondary', theme.secondary)
    root.style.setProperty('--current-accent', theme.accent)
    root.style.setProperty('--current-gradient', theme.gradient)
    
    setCurrentTheme(themeKey)
    localStorage.setItem('projectTheme', themeKey)
  }
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('projectTheme') as ProjectThemeKey
    if (savedTheme && PROJECT_THEMES[savedTheme]) {
      applyTheme(savedTheme)
    }
  }, [])
  
  return {
    currentTheme,
    applyTheme,
    availableThemes: PROJECT_THEMES,
  }
}
```

#### **테마 선택 컴포넌트**
```typescript
// src/components/ui/ThemeSelector.tsx
import React from 'react'
import { Check } from 'lucide-react'
import { useProjectTheme, PROJECT_THEMES, ProjectThemeKey } from '@/lib/themes/project-themes'
import { cn } from '@/lib/utils'

export const ThemeSelector = () => {
  const { currentTheme, applyTheme } = useProjectTheme()
  
  return (
    <div className="grid grid-cols-4 gap-3 p-4">
      {Object.entries(PROJECT_THEMES).map(([key, theme]) => (
        <button
          key={key}
          onClick={() => applyTheme(key as ProjectThemeKey)}
          className={cn(
            'relative flex flex-col items-center p-3 rounded-lg',
            'border-2 transition-all duration-200',
            'hover:shadow-md hover:scale-105',
            currentTheme === key
              ? 'border-primary bg-primary/10'
              : 'border-border bg-card hover:border-muted-foreground/50'
          )}
          title={theme.name}
        >
          {/* 색상 프리뷰 */}
          <div 
            className="w-8 h-8 rounded-full mb-2 shadow-sm"
            style={{ background: theme.gradient }}
          />
          
          {/* 테마 이름 */}
          <span className="text-xs font-medium text-center">
            {theme.name}
          </span>
          
          {/* 선택 표시 */}
          {currentTheme === key && (
            <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
              <Check className="w-3 h-3" />
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

// 간단한 드롭다운 버전
export const ThemeSelectorDropdown = () => {
  const { currentTheme, applyTheme, availableThemes } = useProjectTheme()
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md bg-muted hover:bg-accent transition-colors"
      >
        <div 
          className="w-4 h-4 rounded-full"
          style={{ background: availableThemes[currentTheme].gradient }}
        />
        <span className="text-sm">{availableThemes[currentTheme].name}</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-popover border border-border rounded-md shadow-lg min-w-[200px] z-50">
          {Object.entries(availableThemes).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => {
                applyTheme(key as ProjectThemeKey)
                setIsOpen(false)
              }}
              className="flex items-center space-x-3 w-full px-3 py-2 text-left hover:bg-accent"
            >
              <div 
                className="w-4 h-4 rounded-full"
                style={{ background: theme.gradient }}
              />
              <span className="text-sm">{theme.name}</span>
              {currentTheme === key && <Check className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

### **5c.5 접근성 고려 사항**

#### **접근성 스타일 유틸리티**
```css
/* src/styles/accessibility.css */
/* 포커스 표시 */
.focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

/* 고대비 모드 지원 */
@media (prefers-contrast: high) {
  .high-contrast {
    border: 2px solid currentColor;
  }
  
  .high-contrast-text {
    color: CanvasText;
    background-color: Canvas;
  }
}

/* 모션 감소 설정 지원 */
@media (prefers-reduced-motion: reduce) {
  .motion-reduce {
    animation: none !important;
    transition: none !important;
  }
  
  .motion-reduce * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 스크린 리더 전용 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 키보드 네비게이션 */
.keyboard-navigation:focus {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

/* 터치 타겟 크기 */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* 색상 대비 보장 */
.accessible-text {
  color: var(--foreground);
  background-color: var(--background);
  
  /* 최소 대비율 4.5:1 보장 */
  @supports (color: color-contrast(white vs black)) {
    color: color-contrast(var(--background) vs var(--foreground), black);
  }
}
```

#### **접근성 테스트 유틸리티**
```typescript
// src/lib/utils/accessibility.ts
export const checkColorContrast = (foreground: string, background: string): number => {
  // 색상을 RGB로 변환
  const fg = hexToRgb(foreground)
  const bg = hexToRgb(background)
  
  // 상대적 휘도 계산
  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }
  
  const l1 = getLuminance(fg.r, fg.g, fg.b)
  const l2 = getLuminance(bg.r, bg.g, bg.b)
  
  // 대비율 계산
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  
  return (lighter + 0.05) / (darker + 0.05)
}

export const isAccessibleContrast = (foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
  const contrast = checkColorContrast(foreground, background)
  return level === 'AA' ? contrast >= 4.5 : contrast >= 7
}

// 접근성 테스트 훅
export const useAccessibilityTest = () => {
  const testColorContrast = (foreground: string, background: string) => {
    const contrast = checkColorContrast(foreground, background)
    return {
      ratio: contrast,
      passesAA: contrast >= 4.5,
      passesAAA: contrast >= 7,
    }
  }
  
  return { testColorContrast }
}
```

---

## 📚 **관련 문서**

- [**05a. Design System Foundations**](./05a-design-system-foundations.md) - 디자인 토큰 및 기초 시스템
- [**05b. Component Styling Patterns**](./05b-component-styling-patterns.md) - 컴포넌트 스타일링 접근법
- [**07. Security & Accessibility**](./07-security-accessibility.md) - 보안 및 접근성

---

## 🎯 **요약**

이 문서는 바로캘린더의 테마 시스템과 반응형 디자인을 정의합니다:

1. **Tweak CN 테마**: 프로젝트별 커스텀 테마 시스템
2. **다크모드**: 시스템 선호도를 반영한 테마 전환
3. **반응형 디자인**: 모바일 퍼스트 접근법
4. **테마 커스터마이징**: 8가지 프로젝트 테마 선택
5. **접근성**: 색상 대비 및 키보드 네비게이션 지원

**사용자 경험을 고려한 포용적이고 반응형인 디자인 시스템이 완성되었습니다!**