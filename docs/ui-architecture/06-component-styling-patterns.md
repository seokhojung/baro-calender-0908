# Component Styling Patterns

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처 - 컴포넌트 스타일링

---

## 🎨 **5b. Component Styling Patterns**

### **5b.1 Tailwind CSS 설정 및 확장**

#### **Tailwind CSS 기본 설정**
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

### **5b.2 CSS Modules 패턴**

#### **CSS Modules 기본 구조**
```css
/* src/components/Calendar/Calendar.module.css */
.calendarContainer {
  @apply w-full max-w-4xl mx-auto bg-card rounded-lg shadow-md;
}

.calendarHeader {
  @apply flex items-center justify-between p-6 border-b border-border;
}

.calendarGrid {
  @apply grid grid-cols-7 gap-px bg-muted;
}

.dayCell {
  @apply aspect-square bg-card border border-border flex items-center justify-center
         hover:bg-accent transition-colors duration-fast cursor-pointer;
}

.dayCell[data-selected="true"] {
  @apply bg-primary text-primary-foreground;
}

.dayCell[data-today="true"] {
  @apply ring-2 ring-primary ring-inset;
}

.dayCell[data-other-month="true"] {
  @apply text-muted-foreground;
}

.dayCell[data-disabled="true"] {
  @apply cursor-not-allowed opacity-50 hover:bg-card;
}

/* 반응형 스타일 */
@media (max-width: 768px) {
  .calendarContainer {
    @apply rounded-none;
  }
  
  .calendarHeader {
    @apply p-4;
  }
  
  .dayCell {
    @apply text-sm;
  }
}
```

#### **CSS Modules 사용 예시**
```typescript
// src/components/Calendar/Calendar.tsx
import React from 'react'
import styles from './Calendar.module.css'
import { cn } from '@/lib/utils'

interface CalendarProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  className?: string
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  className,
}) => {
  return (
    <div className={cn(styles.calendarContainer, className)}>
      <div className={styles.calendarHeader}>
        <h2 className="text-lg font-semibold">캘린더</h2>
      </div>
      
      <div className={styles.calendarGrid}>
        {days.map((day) => (
          <button
            key={day.id}
            className={styles.dayCell}
            data-selected={day.date.getTime() === selectedDate?.getTime()}
            data-today={isToday(day.date)}
            data-other-month={day.otherMonth}
            data-disabled={day.disabled}
            onClick={() => onDateSelect?.(day.date)}
          >
            {day.date.getDate()}
          </button>
        ))}
      </div>
    </div>
  )
}
```

### **5b.3 Styled Components 패턴**

#### **Emotion 기반 Styled Components**
```typescript
// src/components/ui/StyledComponents.tsx
import styled from '@emotion/styled'
import { css } from '@emotion/react'

// 기본 스타일드 컴포넌트
export const StyledButton = styled.button<{
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}>`
  /* 기본 스타일 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all var(--transition-fast);
  cursor: pointer;
  border: 1px solid transparent;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
  
  /* 크기 변형 */
  ${({ size = 'md' }) => {
    switch (size) {
      case 'sm':
        return css`
          height: 2rem;
          padding: 0 0.75rem;
          font-size: 0.875rem;
        `
      case 'lg':
        return css`
          height: 2.75rem;
          padding: 0 1.5rem;
          font-size: 1rem;
        `
      default:
        return css`
          height: 2.25rem;
          padding: 0 1rem;
          font-size: 0.875rem;
        `
    }
  }}
  
  /* 변형 스타일 */
  ${({ variant = 'primary' }) => {
    switch (variant) {
      case 'secondary':
        return css`
          background-color: var(--secondary);
          color: var(--secondary-foreground);
          
          &:hover:not(:disabled) {
            background-color: var(--accent);
          }
        `
      case 'outline':
        return css`
          background-color: transparent;
          border-color: var(--border);
          color: var(--foreground);
          
          &:hover:not(:disabled) {
            background-color: var(--accent);
          }
        `
      default:
        return css`
          background-color: var(--primary);
          color: var(--primary-foreground);
          
          &:hover:not(:disabled) {
            background-color: hsl(var(--primary) / 0.9);
          }
        `
    }
  }}
  
  /* 전체 너비 */
  ${({ fullWidth }) => fullWidth && css`
    width: 100%;
  `}
`

// 복합 스타일드 컴포넌트
export const StyledCard = styled.div<{
  elevation?: number
  padding?: 'sm' | 'md' | 'lg'
}>`
  background-color: var(--card);
  color: var(--card-foreground);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  
  ${({ elevation = 1 }) => css`
    box-shadow: var(--shadow-${elevation === 1 ? 'sm' : elevation === 2 ? 'md' : 'lg'});
  `}
  
  ${({ padding = 'md' }) => {
    switch (padding) {
      case 'sm':
        return css`padding: var(--spacing-sm);`
      case 'lg':
        return css`padding: var(--spacing-lg);`
      default:
        return css`padding: var(--spacing-md);`
    }
  }}
`

// 애니메이션 스타일드 컴포넌트
export const AnimatedContainer = styled.div<{
  animation?: 'fade' | 'slide' | 'scale'
  duration?: number
}>`
  ${({ animation = 'fade', duration = 300 }) => {
    const animations = {
      fade: css`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        animation: fadeIn ${duration}ms ease-in-out;
      `,
      slide: css`
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        animation: slideIn ${duration}ms ease-out;
      `,
      scale: css`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        animation: scaleIn ${duration}ms ease-out;
      `,
    }
    
    return animations[animation]
  }}
`
```

### **5b.4 Class Variance Authority (CVA) 패턴**

#### **CVA를 이용한 버튼 컴포넌트**
```typescript
// src/components/ui/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // 기본 클래스
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'div' : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
```

#### **CVA 복합 컴포넌트 예시**
```typescript
// src/components/ui/Card.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      variant: {
        default: 'border-border',
        outline: 'border-2 border-border',
        filled: 'border-0 bg-muted',
        elevated: 'border-0 shadow-md',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      size: 'full',
    },
  }
)

const cardHeaderVariants = cva(
  'flex flex-col space-y-1.5',
  {
    variants: {
      padding: {
        none: '',
        sm: 'p-4 pb-2',
        md: 'p-6 pb-2',
        lg: 'p-8 pb-2',
      },
    },
    defaultVariants: {
      padding: 'md',
    },
  }
)

const cardContentVariants = cva('', {
  variants: {
    padding: {
      none: '',
      sm: 'p-4 pt-0',
      md: 'p-6 pt-0',
      lg: 'p-8 pt-0',
    },
  },
  defaultVariants: {
    padding: 'md',
  },
})

// Card 컴포넌트 구현
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, size, className }))}
      {...props}
    />
  )
)

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardHeaderVariants>
>(({ className, padding, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(cardHeaderVariants({ padding, className }))}
    {...props}
  />
))

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardContentVariants>
>(({ className, padding, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(cardContentVariants({ padding, className }))}
    {...props}
  />
))
```

### **5b.5 조건부 스타일링 패턴**

#### **상태 기반 스타일링**
```typescript
// src/components/ui/ConditionalStyles.tsx
import { cn } from '@/lib/utils'

interface ConditionalButtonProps {
  children: React.ReactNode
  isLoading?: boolean
  isSuccess?: boolean
  isError?: boolean
  disabled?: boolean
  className?: string
  onClick?: () => void
}

export const ConditionalButton: React.FC<ConditionalButtonProps> = ({
  children,
  isLoading = false,
  isSuccess = false,
  isError = false,
  disabled = false,
  className,
  onClick,
}) => {
  return (
    <button
      className={cn(
        // 기본 스타일
        'px-4 py-2 rounded-md font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        
        // 상태별 조건부 스타일
        {
          // 로딩 상태
          'bg-gray-400 text-white cursor-not-allowed': isLoading,
          'animate-pulse': isLoading,
          
          // 성공 상태
          'bg-green-600 text-white': isSuccess && !isLoading,
          'hover:bg-green-700': isSuccess && !isLoading && !disabled,
          
          // 에러 상태
          'bg-red-600 text-white': isError && !isLoading,
          'hover:bg-red-700': isError && !isLoading && !disabled,
          
          // 기본 상태
          'bg-blue-600 text-white': !isLoading && !isSuccess && !isError && !disabled,
          'hover:bg-blue-700': !isLoading && !isSuccess && !isError && !disabled,
          
          // 비활성 상태
          'bg-gray-300 text-gray-500 cursor-not-allowed': disabled && !isLoading,
        },
        className
      )}
      disabled={disabled || isLoading}
      onClick={onClick}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
      )}
      {children}
    </button>
  )
}
```

#### **데이터 속성 기반 스타일링**
```typescript
// src/components/calendar/DateCell.tsx
interface DateCellProps {
  date: Date
  isSelected?: boolean
  isToday?: boolean
  isDisabled?: boolean
  isOtherMonth?: boolean
  onClick?: (date: Date) => void
}

export const DateCell: React.FC<DateCellProps> = ({
  date,
  isSelected = false,
  isToday = false,
  isDisabled = false,
  isOtherMonth = false,
  onClick,
}) => {
  return (
    <button
      className={cn(
        // 기본 스타일
        'aspect-square flex items-center justify-center text-sm font-medium',
        'transition-colors duration-150 ease-in-out',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        
        // 데이터 속성 기반 스타일
        'data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground',
        'data-[today=true]:bg-accent data-[today=true]:font-semibold',
        'data-[disabled=true]:text-muted-foreground data-[disabled=true]:cursor-not-allowed',
        'data-[other-month=true]:text-muted-foreground',
        'data-[disabled=true]:hover:bg-transparent'
      )}
      data-selected={isSelected}
      data-today={isToday}
      data-disabled={isDisabled}
      data-other-month={isOtherMonth}
      disabled={isDisabled}
      onClick={() => !isDisabled && onClick?.(date)}
    >
      {date.getDate()}
    </button>
  )
}
```

### **5b.6 CSS-in-JS 최적화 패턴**

#### **정적 vs 동적 스타일 분리**
```typescript
// src/lib/styles/optimized-styles.ts
import { css } from '@emotion/react'

// 정적 스타일 (컴파일 타임 최적화)
export const staticStyles = {
  flexCenter: css`
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  
  card: css`
    background-color: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    box-shadow: var(--shadow-sm);
  `,
  
  button: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: all var(--transition-fast);
    cursor: pointer;
    
    &:focus-visible {
      outline: 2px solid var(--ring);
      outline-offset: 2px;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
}

// 동적 스타일 생성 함수
export const createDynamicStyles = {
  spacing: (size: number) => css`
    padding: ${size * 0.25}rem;
  `,
  
  color: (color: string) => css`
    color: ${color};
  `,
  
  backgroundColor: (color: string, opacity = 1) => css`
    background-color: ${color};
    opacity: ${opacity};
  `,
  
  shadow: (level: number) => {
    const shadows = [
      'var(--shadow-sm)',
      'var(--shadow-md)',
      'var(--shadow-lg)',
      'var(--shadow-xl)'
    ]
    return css`
      box-shadow: ${shadows[Math.min(level, 3)]};
    `
  },
}

// 테마별 스타일 생성
export const createThemedStyles = (isDark: boolean) => css`
  background-color: ${isDark ? 'var(--background)' : 'var(--background)'};
  color: ${isDark ? 'var(--foreground)' : 'var(--foreground)'};
  
  .themed-border {
    border-color: ${isDark ? 'var(--border)' : 'var(--border)'};
  }
  
  .themed-accent {
    background-color: ${isDark ? 'var(--accent)' : 'var(--accent)'};
  }
`
```

#### **스타일 컴포지션 패턴**
```typescript
// src/components/ui/ComposedStyles.tsx
import { css } from '@emotion/react'
import { staticStyles, createDynamicStyles } from '@/lib/styles/optimized-styles'

// 기본 컴포넌트 스타일
const baseButtonStyles = css`
  ${staticStyles.button}
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
`

// 변형별 스타일
const buttonVariants = {
  primary: css`
    background-color: var(--primary);
    color: var(--primary-foreground);
    
    &:hover:not(:disabled) {
      background-color: hsl(var(--primary) / 0.9);
    }
  `,
  
  secondary: css`
    background-color: var(--secondary);
    color: var(--secondary-foreground);
    
    &:hover:not(:disabled) {
      background-color: var(--accent);
    }
  `,
  
  outline: css`
    background-color: transparent;
    border: 1px solid var(--border);
    color: var(--foreground);
    
    &:hover:not(:disabled) {
      background-color: var(--accent);
    }
  `,
}

// 크기별 스타일
const buttonSizes = {
  sm: css`
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    height: 2rem;
  `,
  
  md: css`
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    height: 2.25rem;
  `,
  
  lg: css`
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    height: 2.75rem;
  `,
}

// 컴포지션 함수
export const composeButtonStyles = (
  variant: keyof typeof buttonVariants = 'primary',
  size: keyof typeof buttonSizes = 'md',
  disabled = false
) => css`
  ${baseButtonStyles}
  ${buttonVariants[variant]}
  ${buttonSizes[size]}
  ${disabled && css`
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      background-color: initial;
    }
  `}
`
```

---

## 📚 **관련 문서**

- [**05a. Design System Foundations**](./05a-design-system-foundations.md) - 디자인 토큰 및 기초 시스템
- [**05c. Theme & Responsive Design**](./05c-theme-responsive-design.md) - 테마 커스터마이징 및 반응형 디자인
- [**03. Component Standards**](./03-component-standards.md) - 컴포넌트 표준 및 패턴

---

## 🎯 **요약**

이 문서는 바로캘린더의 컴포넌트 스타일링 패턴을 정의합니다:

1. **Tailwind CSS**: 유틸리티 퍼스트 CSS 프레임워크 설정
2. **CSS Modules**: 스코프된 CSS 클래스 패턴
3. **Styled Components**: CSS-in-JS 기반 동적 스타일링
4. **CVA**: Class Variance Authority를 이용한 변형 관리
5. **조건부 스타일링**: 상태 기반 동적 스타일링
6. **CSS-in-JS 최적화**: 성능을 고려한 스타일 최적화

**개발팀이 일관되고 효율적인 스타일링 패턴으로 작업할 수 있는 기반이 마련되었습니다!**