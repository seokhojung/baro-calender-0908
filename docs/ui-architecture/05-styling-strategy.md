# Styling Strategy

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처

---

## 🎨 **5. Styling Strategy**

### **5.1 Tailwind CSS + CSS Variables 전략**

**핵심 원칙**: **ShadCN UI + Tweak CN 테마 + 프로젝트별 커스터마이징**

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

#### **Tailwind CSS 설정**
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // 프로젝트 색상 시스템
        'project-blue': {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
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
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        // ... 다른 프로젝트 색상들
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      spacing: {
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
      },
      transitionDuration: {
        'fast': 'var(--transition-fast)',
        'normal': 'var(--transition-normal)',
        'slow': 'var(--transition-slow)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}

export default config
```

### **5.2 Tweak CN 테마 시스템 상세 설정**

#### **Tweak CN 설치 및 설정**
```bash
# 1. Tweak CN 초기화
npx tweak-cn@latest init

# 2. 기본 테마 추가
npx tweak-cn@latest add

# 3. 커스텀 색상 팔레트 생성
npx tweak-cn@latest add --palette custom
```

#### **커스텀 색상 팔레트 설정**
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

### **5.3 모바일 퍼스트 반응형 디자인 패턴**

#### **반응형 브레이크포인트 시스템**
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
```

#### **모바일 우선 CSS 클래스 시스템**
```css
/* src/styles/responsive.css */
/* 기본 (모바일) 스타일 */
.mobile-first {
  padding: var(--spacing-sm);
  font-size: 0.875rem;
  border-radius: var(--border-radius-sm);
}

/* 태블릿 이상 */
@media (min-width: 768px) {
  .mobile-first {
    padding: var(--spacing-md);
    font-size: 1rem;
    border-radius: var(--border-radius-md);
  }
}

/* 데스크톱 이상 */
@media (min-width: 1024px) {
  .mobile-first {
    padding: var(--spacing-lg);
    font-size: 1.125rem;
    border-radius: var(--border-radius-lg);
  }
}

/* 대형 데스크톱 */
@media (min-width: 1280px) {
  .mobile-first {
    padding: var(--spacing-xl);
    font-size: 1.25rem;
  }
}
```

### **5.4 다크모드 전환 시스템 및 테마 관리**

#### **테마 컨텍스트 및 훅**
```typescript
// src/contexts/ThemeContext.tsx
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
  }, [theme])
  
  useEffect(() => {
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
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()
  
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'light' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-secondary text-secondary-foreground hover:bg-accent'
        }`}
        aria-label="라이트 모드"
      >
        <Sun className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'system' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-secondary text-secondary-foreground hover:bg-accent'
        }`}
        aria-label="시스템 테마"
      >
        <Monitor className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'dark' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-secondary text-secondary-foreground hover:bg-accent'
        }`}
        aria-label="다크 모드"
      >
        <Moon className="h-4 w-4" />
      </button>
    </div>
  )
}
```

### **5.5 CSS 최적화 및 번들 크기 관리**

#### **CSS 번들 분석 및 최적화**
```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizeCss: true, // CSS 최적화 활성화
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // 프로덕션 빌드에서 CSS 최적화
      config.optimization.splitChunks.cacheGroups.styles = {
        name: 'styles',
        test: /\.(css|scss)$/,
        chunks: 'all',
        enforce: true,
      }
    }
    return config
  },
}

export default nextConfig
```

#### **CSS-in-JS 최적화**
```typescript
// src/lib/styles/optimizedStyles.ts
import { css } from '@emotion/react'

// CSS-in-JS 최적화를 위한 유틸리티
export const createOptimizedStyles = (styles: TemplateStringsArray, ...args: any[]) => {
  // 정적 스타일은 컴파일 타임에 최적화
  if (args.length === 0) {
    return css(styles)
  }
  
  // 동적 스타일은 런타임에 최적화
  return css(styles, ...args)
}

// 자주 사용되는 스타일 패턴
export const commonStyles = {
  flexCenter: css`
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  absoluteCenter: css`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  `,
  textEllipsis: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  smoothTransition: css`
    transition: all var(--transition-normal);
  `,
} as const
```

### **5.6 애니메이션 시스템 및 성능 최적화**

#### **Framer Motion 기반 애니메이션**
```typescript
// src/components/ui/AnimatedContainer.tsx
import { motion, AnimatePresence } from 'framer-motion'

interface AnimatedContainerProps {
  children: React.ReactNode
  className?: string
  animation?: 'fade' | 'slide' | 'scale' | 'slide-up' | 'slide-down'
  duration?: number
  delay?: number
  stagger?: number
}

const animationVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
  },
  scale: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
  },
  'slide-up': {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  },
  'slide-down': {
    initial: { y: -20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 },
  },
}

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  className,
  animation = 'fade',
  duration = 0.3,
  delay = 0,
  stagger = 0,
}) => {
  const variant = animationVariants[animation]
  
  return (
    <motion.div
      className={className}
      variants={variant}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        duration,
        delay,
        staggerChildren: stagger,
        ease: [0.4, 0, 0.2, 1], // ease-out
      }}
    >
      {children}
    </motion.div>
  )
}

// 성능 최적화된 애니메이션
export const OptimizedAnimation: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.2,
        ease: 'easeOut',
      }}
      style={{
        willChange: 'opacity', // GPU 가속 힌트
      }}
    >
      {children}
    </motion.div>
  )
}
```

#### **애니메이션 성능 모니터링**
```typescript
// src/hooks/useAnimationPerformance.ts
export const useAnimationPerformance = () => {
  const [frameRate, setFrameRate] = useState(60)
  const [droppedFrames, setDroppedFrames] = useState(0)
  
  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let animationId: number
    
    const measureFrameRate = (currentTime: number) => {
      frameCount++
      
      if (currentTime - lastTime >= 1000) {
        const currentFrameRate = Math.round((frameCount * 1000) / (currentTime - lastTime))
        setFrameRate(currentFrameRate)
        
        // 60fps 기준으로 드롭된 프레임 계산
        const expectedFrames = 60
        const dropped = Math.max(0, expectedFrames - currentFrameRate)
        setDroppedFrames(dropped)
        
        frameCount = 0
        lastTime = currentTime
      }
      
      animationId = requestAnimationFrame(measureFrameRate)
    }
    
    animationId = requestAnimationFrame(measureFrameRate)
    
    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])
  
  return { frameRate, droppedFrames }
}
```

### **5.7 접근성을 고려한 스타일링 가이드라인**

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
```

#### **접근성 컴포넌트 래퍼**
```typescript
// src/components/ui/AccessibleWrapper.tsx
interface AccessibleWrapperProps {
  children: React.ReactNode
  className?: string
  role?: string
  'aria-label'?: string
  'aria-describedby'?: string
  tabIndex?: number
  onKeyDown?: (event: React.KeyboardEvent) => void
}

export const AccessibleWrapper: React.FC<AccessibleWrapperProps> = ({
  children,
  className,
  role,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  tabIndex,
  onKeyDown,
  ...props
}) => {
  return (
    <div
      className={cn('accessible-wrapper', className)}
      role={role}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      {...props}
    >
      {children}
    </div>
  )
}

// 접근성 스타일 적용
const accessibleStyles = css`
  .accessible-wrapper {
    /* 기본 접근성 스타일 */
    position: relative;
    
    &:focus-visible {
      outline: 2px solid var(--ring);
      outline-offset: 2px;
    }
    
    /* 터치 디바이스 최적화 */
    @media (hover: none) and (pointer: coarse) {
      min-height: 44px;
      min-width: 44px;
    }
  }
`
```

### **5.8 디자인 시스템 문서화 및 Storybook 연동**

#### **Storybook 설정**
```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y', // 접근성 테스트
    '@storybook/addon-viewport', // 반응형 테스트
    '@storybook/addon-backgrounds', // 배경색 테스트
    'storybook-addon-themes', // 테마 테스트
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../public'],
}

export default config
```

#### **컴포넌트 스토리 예시**
```typescript
// src/components/ui/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '접근성을 고려한 버튼 컴포넌트입니다.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: '버튼의 시각적 스타일',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: '버튼의 크기',
    },
    disabled: {
      control: 'boolean',
      description: '버튼 비활성화 여부',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: '버튼',
    variant: 'default',
    size: 'default',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">🚀</Button>
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button>
        <Sun className="mr-2 h-4 w-4" />
        라이트 모드
      </Button>
      <Button variant="outline">
        <Moon className="mr-2 h-4 w-4" />
        다크 모드
      </Button>
    </div>
  ),
}
```

---

## 📚 **관련 문서**

- [**3. Component Standards**](./03-component-standards.md) - 컴포넌트 표준 및 패턴
- [**4. State Management**](./04-state-management.md) - 상태 관리 전략 및 구현
- [**6. Performance Optimization**](./06-performance-optimization.md) - 성능 최적화 및 Core Web Vitals

---

## 🎯 **다음 단계**

이 스타일링 전략을 기반으로:

1. **성능 최적화**: 6번 섹션 참조
2. **보안 및 접근성**: 7번 섹션 참조
3. **모바일 및 API**: 8번 섹션 참조

**개발팀이 일관된 스타일링 패턴으로 작업할 수 있는 기반이 마련되었습니다!** 🚀
