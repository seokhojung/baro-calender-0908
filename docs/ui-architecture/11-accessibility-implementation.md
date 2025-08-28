# ♿ **7b. Accessibility Implementation**

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처 - 접근성

---

## 🎯 **개요**

이 문서는 바로캘린더 프로젝트의 **접근성 아키텍처**를 정의합니다. **WCAG AA 기준 준수, ARIA 속성, 키보드 네비게이션, 스크린 리더 지원**을 통해 모든 사용자가 사용할 수 있는 웹 애플리케이션을 구현합니다.

---

## ♿ **7b.1 WCAG Compliance**

### **WCAG AA 기준 준수**
```typescript
// src/lib/accessibility/wcag.ts
export const WCAG_GUIDELINES = {
  // 색상 대비 기준
  COLOR_CONTRAST: {
    NORMAL_TEXT: 4.5,
    LARGE_TEXT: 3.0,
    UI_COMPONENTS: 3.0,
  },
  
  // 텍스트 크기 기준
  TEXT_SIZE: {
    MIN_SIZE: 16,
    LARGE_TEXT_THRESHOLD: 18,
  },
  
  // 터치 영역 크기
  TOUCH_TARGET: {
    MIN_SIZE: 44,
    RECOMMENDED_SIZE: 48,
  },
}

// 색상 대비 계산 유틸리티
export const calculateColorContrast = (foreground: string, background: string): number => {
  const getLuminance = (color: string): number => {
    const rgb = hexToRgb(color)
    const sRGB = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2]
  }
  
  const foregroundLum = getLuminance(foreground)
  const backgroundLum = getLuminance(background)
  
  const lighter = Math.max(foregroundLum, backgroundLum)
  const darker = Math.min(foregroundLum, backgroundLum)
  
  return (lighter + 0.05) / (darker + 0.05)
}

// 색상 대비 검증
export const validateColorContrast = (
  foreground: string,
  background: string,
  textSize: number = 16
): boolean => {
  const contrast = calculateColorContrast(foreground, background)
  const threshold = textSize >= WCAG_GUIDELINES.TEXT_SIZE.LARGE_TEXT_THRESHOLD 
    ? WCAG_GUIDELINES.COLOR_CONTRAST.LARGE_TEXT 
    : WCAG_GUIDELINES.COLOR_CONTRAST.NORMAL_TEXT
  
  return contrast >= threshold
}

// 헬퍼 함수
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 }
}
```

### **접근성 컴포넌트 래퍼**
```typescript
// src/components/ui/AccessibleComponent.tsx
import { forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

interface AccessibleComponentProps {
  children: React.ReactNode
  className?: string
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-labelledby'?: string
  role?: string
  tabIndex?: number
  onKeyDown?: (event: React.KeyboardEvent) => void
}

export const AccessibleComponent = forwardRef<
  HTMLDivElement,
  AccessibleComponentProps
>(({
  children,
  className,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  'aria-labelledby': ariaLabelledby,
  role,
  tabIndex,
  onKeyDown,
  ...props
}, ref) => {
  const id = useId()
  
  return (
    <div
      ref={ref}
      id={id}
      className={cn('accessible-component', className)}
      role={role}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      aria-labelledby={ariaLabelledby}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      {...props}
    >
      {children}
    </div>
  )
})

AccessibleComponent.displayName = 'AccessibleComponent'

// 접근성 스타일
const accessibleStyles = `
  .accessible-component {
    /* 포커스 표시 */
    outline: none;
  }
  
  .accessible-component:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
  
  /* 고대비 모드 지원 */
  @media (prefers-contrast: high) {
    .accessible-component {
      border: 2px solid currentColor;
    }
  }
  
  /* 모션 감소 설정 지원 */
  @media (prefers-reduced-motion: reduce) {
    .accessible-component * {
      animation: none !important;
      transition: none !important;
    }
  }
`
```

---

## ♿ **7b.2 ARIA Implementation**

### **ARIA 라벨 및 설명**
```typescript
// src/components/ui/AccessibleForm.tsx
interface AccessibleFormProps {
  children: React.ReactNode
  onSubmit: (data: any) => void
  'aria-label'?: string
  'aria-describedby'?: string
}

export const AccessibleForm: React.FC<AccessibleFormProps> = ({
  children,
  onSubmit,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
}) => {
  const formId = useId()
  const descriptionId = useId()
  
  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby || descriptionId}
      noValidate
    >
      {children}
      
      {!ariaDescribedby && (
        <div id={descriptionId} className="sr-only">
          이 폼은 필수 필드를 포함하고 있습니다. 모든 필수 필드를 입력한 후 제출해주세요.
        </div>
      )}
    </form>
  )
}

// 접근성 향상 입력 필드
export const AccessibleInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label: string
    description?: string
    error?: string
    required?: boolean
  }
>(({
  label,
  description,
  error,
  required = false,
  id,
  ...props
}, ref) => {
  const inputId = useId()
  const descriptionId = useId()
  const errorId = useId()
  
  const finalId = id || inputId
  
  return (
    <div className="form-field">
      <label
        htmlFor={finalId}
        className="form-label"
        aria-required={required}
      >
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      
      <input
        ref={ref}
        id={finalId}
        aria-describedby={[
          description && descriptionId,
          error && errorId,
        ].filter(Boolean).join(' ')}
        aria-invalid={!!error}
        required={required}
        {...props}
      />
      
      {description && (
        <div id={descriptionId} className="form-description">
          {description}
        </div>
      )}
      
      {error && (
        <div id={errorId} className="form-error" role="alert">
          {error}
        </div>
      )}
    </div>
  )
})

AccessibleInput.displayName = 'AccessibleInput'
```

### **ARIA Live Regions**
```typescript
// src/components/ui/LiveRegion.tsx
interface LiveRegionProps {
  children: React.ReactNode
  politeness?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'all',
}) => {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only"
    >
      {children}
    </div>
  )
}

// 상태 변경 알림 컴포넌트
export const StatusAnnouncement: React.FC<{
  message: string
  priority?: 'polite' | 'assertive'
}> = ({ message, priority = 'polite' }) => {
  const [announcement, setAnnouncement] = useState('')
  
  useEffect(() => {
    if (message) {
      setAnnouncement(message)
      // 짧은 딜레이 후 클리어하여 재사용 가능하게 함
      const timer = setTimeout(() => setAnnouncement(''), 1000)
      return () => clearTimeout(timer)
    }
  }, [message])
  
  return (
    <LiveRegion politeness={priority}>
      {announcement}
    </LiveRegion>
  )
}

// 캘린더 접근성 향상
export const AccessibleCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [announcement, setAnnouncement] = useState('')
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setAnnouncement(
      `${format(date, 'yyyy년 M월 d일')}이 선택되었습니다`
    )
  }
  
  return (
    <div>
      <div
        role="grid"
        aria-label="캘린더"
        aria-describedby="calendar-instructions"
      >
        {/* 캘린더 구현 */}
      </div>
      
      <div id="calendar-instructions" className="sr-only">
        화살표 키로 날짜를 이동하고, 엔터키 또는 스페이스키로 선택할 수 있습니다.
      </div>
      
      <StatusAnnouncement message={announcement} />
    </div>
  )
}
```

---

## ♿ **7b.3 Keyboard Navigation**

### **키보드 네비게이션 지원**
```typescript
// src/hooks/useKeyboardNavigation.ts
export const useKeyboardNavigation = (
  items: any[],
  onSelect: (item: any) => void
) => {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setFocusedIndex(prev => 
          prev < items.length - 1 ? prev + 1 : 0
        )
        break
        
      case 'ArrowUp':
        event.preventDefault()
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : items.length - 1
        )
        break
        
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < items.length) {
          onSelect(items[focusedIndex])
        }
        break
        
      case 'Home':
        event.preventDefault()
        setFocusedIndex(0)
        break
        
      case 'End':
        event.preventDefault()
        setFocusedIndex(items.length - 1)
        break
        
      case 'Escape':
        event.preventDefault()
        setFocusedIndex(-1)
        break
    }
  }, [items, focusedIndex, onSelect])
  
  const focusItem = useCallback((index: number) => {
    setFocusedIndex(index)
  }, [])
  
  return {
    focusedIndex,
    handleKeyDown,
    focusItem,
  }
}

// 접근성 드롭다운 예시
export const AccessibleDropdown = <T,>({
  items,
  onSelect,
  renderItem,
}: {
  items: T[]
  onSelect: (item: T) => void
  renderItem: (item: T, isFocused: boolean) => React.ReactNode
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { focusedIndex, handleKeyDown, focusItem } = useKeyboardNavigation(
    items,
    onSelect
  )
  
  const handleToggle = () => setIsOpen(!isOpen)
  
  return (
    <div className="dropdown">
      <button
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="dropdown-trigger"
      >
        선택하세요
      </button>
      
      {isOpen && (
        <ul
          role="listbox"
          className="dropdown-menu"
          onKeyDown={handleKeyDown}
        >
          {items.map((item, index) => (
            <li
              key={index}
              role="option"
              aria-selected={index === focusedIndex}
              className={cn(
                'dropdown-item',
                index === focusedIndex && 'focused'
              )}
              onClick={() => {
                onSelect(item)
                setIsOpen(false)
              }}
              onMouseEnter={() => focusItem(index)}
            >
              {renderItem(item, index === focusedIndex)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### **포커스 관리**
```typescript
// src/hooks/useFocusManagement.ts
export const useFocusManagement = () => {
  const [focusHistory, setFocusHistory] = useState<HTMLElement[]>([])
  
  const pushFocus = (element: HTMLElement) => {
    setFocusHistory(prev => [...prev, element])
  }
  
  const popFocus = () => {
    setFocusHistory(prev => {
      const newHistory = [...prev]
      const previousElement = newHistory.pop()
      
      if (previousElement) {
        previousElement.focus()
      }
      
      return newHistory
    })
  }
  
  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }
    }
    
    container.addEventListener('keydown', handleTabKey)
    
    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }
  
  return {
    pushFocus,
    popFocus,
    trapFocus,
  }
}

// 모달 접근성 향상
export const AccessibleModal = ({ 
  isOpen, 
  onClose, 
  children, 
  title 
}: {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title: string
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const { trapFocus, pushFocus, popFocus } = useFocusManagement()
  
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // 현재 포커스된 요소 저장
      const currentFocused = document.activeElement as HTMLElement
      if (currentFocused) {
        pushFocus(currentFocused)
      }
      
      // 모달 내부에 포커스 트랩 설정
      const cleanup = trapFocus(modalRef.current)
      
      // 모달 첫 번째 요소로 포커스 이동
      const firstFocusable = modalRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      
      if (firstFocusable) {
        firstFocusable.focus()
      }
      
      return () => {
        cleanup()
        popFocus()
      }
    }
  }, [isOpen])
  
  const handleEscapeKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="modal-content"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleEscapeKey}
      >
        <h2 id="modal-title" className="sr-only">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
```

---

## ♿ **7b.4 Screen Reader Support**

### **스크린 리더 전용 콘텐츠**
```typescript
// src/components/ui/ScreenReaderOnly.tsx
interface ScreenReaderOnlyProps {
  children: React.ReactNode
  className?: string
}

export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({
  children,
  className,
}) => {
  return (
    <span
      className={cn('sr-only', className)}
      aria-hidden="false"
    >
      {children}
    </span>
  )
}

// 스크린 리더 전용 스타일
const srOnlyStyles = `
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
  
  /* 스크린 리더에서만 표시 */
  .sr-only:not(:focus):not(:active) {
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px;
  }
`

// 접근성 향상 버튼
export const AccessibleButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode
    description?: string
    loading?: boolean
  }
>(({ children, description, loading, ...props }, ref) => {
  return (
    <button
      ref={ref}
      {...props}
      aria-busy={loading}
      aria-describedby={description ? 'button-description' : undefined}
    >
      {children}
      {description && (
        <ScreenReaderOnly id="button-description">
          {description}
        </ScreenReaderOnly>
      )}
      {loading && (
        <ScreenReaderOnly>
          로딩 중입니다
        </ScreenReaderOnly>
      )}
    </button>
  )
})

AccessibleButton.displayName = 'AccessibleButton'
```

### **스크린 리더 네비게이션 지원**
```typescript
// src/components/ui/SkipLinks.tsx
export const SkipLinks: React.FC = () => {
  return (
    <nav className="skip-links">
      <a href="#main-content" className="skip-link">
        본문으로 건너뛰기
      </a>
      <a href="#navigation" className="skip-link">
        네비게이션으로 건너뛰기
      </a>
      <a href="#calendar" className="skip-link">
        캘린더로 건너뛰기
      </a>
    </nav>
  )
}

// 랜드마크 역할 정의
export const AccessibleLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-layout">
      <SkipLinks />
      
      <header role="banner">
        <nav role="navigation" aria-label="주 네비게이션">
          {/* 네비게이션 내용 */}
        </nav>
      </header>
      
      <main role="main" id="main-content" tabIndex={-1}>
        {children}
      </main>
      
      <aside role="complementary" aria-label="사이드바">
        {/* 사이드바 내용 */}
      </aside>
      
      <footer role="contentinfo">
        {/* 푸터 내용 */}
      </footer>
    </div>
  )
}

// 스크린 리더를 위한 테이블 접근성
export const AccessibleTable = <T,>({
  data,
  columns,
  caption,
}: {
  data: T[]
  columns: Array<{
    key: keyof T
    header: string
    render?: (item: T) => React.ReactNode
  }>
  caption: string
}) => {
  return (
    <table role="table" aria-label={caption}>
      <caption className="sr-only">{caption}</caption>
      
      <thead>
        <tr role="row">
          {columns.map(column => (
            <th key={String(column.key)} scope="col" role="columnheader">
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      
      <tbody>
        {data.map((item, index) => (
          <tr key={index} role="row">
            {columns.map(column => (
              <td key={String(column.key)} role="gridcell">
                {column.render ? column.render(item) : String(item[column.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

---

## ♿ **7b.5 Accessibility Testing**

### **접근성 테스트 유틸리티**
```typescript
// src/lib/accessibility/testing.ts
import { axe, toHaveNoViolations } from 'jest-axe'

// Jest 설정에 axe 추가
expect.extend(toHaveNoViolations)

// 접근성 테스트 헬퍼
export const testAccessibility = async (
  component: React.ReactElement,
  options: {
    rules?: Record<string, any>
    impact?: 'minor' | 'moderate' | 'serious' | 'critical'
  } = {}
) => {
  const { rules, impact } = options
  
  const axeOptions = {
    rules: rules || {},
    impact: impact || 'serious',
  }
  
  const results = await axe(component, axeOptions)
  
  expect(results).toHaveNoViolations()
  
  return results
}

// 접근성 스냅샷 테스트
export const createAccessibilitySnapshot = async (
  component: React.ReactElement
) => {
  const results = await axe(component)
  
  return {
    violations: results.violations,
    passes: results.passes,
    incomplete: results.incomplete,
    timestamp: new Date().toISOString(),
  }
}

// 접근성 테스트 스위트
export const accessibilityTestSuite = {
  // 색상 대비 테스트
  testColorContrast: async (component: React.ReactElement) => {
    const results = await axe(component, {
      rules: {
        'color-contrast': { enabled: true },
      },
    })
    
    const colorViolations = results.violations.filter(
      v => v.id === 'color-contrast'
    )
    
    expect(colorViolations).toHaveLength(0)
  },
  
  // 키보드 네비게이션 테스트
  testKeyboardNavigation: async (component: React.ReactElement) => {
    const results = await axe(component, {
      rules: {
        'focus-order-semantics': { enabled: true },
        'focus-visible': { enabled: true },
      },
    })
    
    const focusViolations = results.violations.filter(
      v => ['focus-order-semantics', 'focus-visible'].includes(v.id)
    )
    
    expect(focusViolations).toHaveLength(0)
  },
  
  // 스크린 리더 지원 테스트
  testScreenReaderSupport: async (component: React.ReactElement) => {
    const results = await axe(component, {
      rules: {
        'button-name': { enabled: true },
        'image-alt': { enabled: true },
        'label': { enabled: true },
        'link-name': { enabled: true },
      },
    })
    
    const labelViolations = results.violations.filter(
      v => ['button-name', 'image-alt', 'label', 'link-name'].includes(v.id)
    )
    
    expect(labelViolations).toHaveLength(0)
  },
}

// 접근성 테스트 예시
describe('Calendar Component Accessibility', () => {
  it('should meet WCAG AA standards', async () => {
    const component = <CalendarView />
    await testAccessibility(component)
  })
  
  it('should have proper color contrast', async () => {
    const component = <CalendarView />
    await accessibilityTestSuite.testColorContrast(component)
  })
  
  it('should support keyboard navigation', async () => {
    const component = <CalendarView />
    await accessibilityTestSuite.testKeyboardNavigation(component)
  })
  
  it('should support screen readers', async () => {
    const component = <CalendarView />
    await accessibilityTestSuite.testScreenReaderSupport(component)
  })
})

// 사용자 경험 테스트
export const userExperienceTests = {
  // 키보드만으로 완전한 사용 가능 여부 테스트
  testKeyboardOnlyUsability: async (component: React.ReactElement) => {
    // 모든 인터랙티브 요소가 키보드로 접근 가능한지 확인
    const results = await axe(component, {
      rules: {
        'keyboard': { enabled: true },
        'focus-order-semantics': { enabled: true },
      },
    })
    
    expect(results.violations).toHaveLength(0)
  },
  
  // 스크린 리더 사용자를 위한 의미론적 구조 테스트
  testSemanticStructure: async (component: React.ReactElement) => {
    const results = await axe(component, {
      rules: {
        'page-has-heading-one': { enabled: true },
        'heading-order': { enabled: true },
        'landmark-one-main': { enabled: true },
        'region': { enabled: true },
      },
    })
    
    expect(results.violations).toHaveLength(0)
  },
  
  // 고대비 모드 지원 테스트
  testHighContrastSupport: async (component: React.ReactElement) => {
    // 고대비 모드에서도 모든 요소가 구분 가능한지 확인
    const results = await axe(component, {
      rules: {
        'color-contrast-enhanced': { enabled: true },
      },
    })
    
    expect(results.violations).toHaveLength(0)
  },
}
```

### **자동화된 접근성 체크**
```typescript
// src/lib/accessibility/automation.ts
export class AccessibilityChecker {
  private static violations: any[] = []
  
  static async runFullAccessibilityAudit(
    container: HTMLElement
  ): Promise<{
    passed: boolean
    violations: any[]
    recommendations: string[]
  }> {
    try {
      const results = await axe(container, {
        rules: {
          // WCAG 2.1 AA 규칙 활성화
          'color-contrast': { enabled: true },
          'keyboard': { enabled: true },
          'focus-order-semantics': { enabled: true },
          'button-name': { enabled: true },
          'image-alt': { enabled: true },
          'label': { enabled: true },
          'link-name': { enabled: true },
          'page-has-heading-one': { enabled: true },
          'heading-order': { enabled: true },
          'landmark-one-main': { enabled: true },
        },
      })
      
      this.violations = results.violations
      
      const recommendations = this.generateRecommendations(results.violations)
      
      return {
        passed: results.violations.length === 0,
        violations: results.violations,
        recommendations,
      }
    } catch (error) {
      console.error('접근성 감사 실행 중 오류:', error)
      return {
        passed: false,
        violations: [],
        recommendations: ['접근성 감사를 다시 실행해주세요.'],
      }
    }
  }
  
  private static generateRecommendations(violations: any[]): string[] {
    const recommendations: string[] = []
    
    violations.forEach(violation => {
      switch (violation.id) {
        case 'color-contrast':
          recommendations.push(
            '색상 대비를 WCAG AA 기준(4.5:1) 이상으로 개선해주세요.'
          )
          break
        case 'button-name':
          recommendations.push(
            '모든 버튼에 접근 가능한 이름을 제공해주세요.'
          )
          break
        case 'image-alt':
          recommendations.push(
            '모든 이미지에 적절한 대체 텍스트를 제공해주세요.'
          )
          break
        case 'keyboard':
          recommendations.push(
            '모든 인터랙티브 요소를 키보드로 접근 가능하게 만들어주세요.'
          )
          break
        case 'heading-order':
          recommendations.push(
            '제목 태그(h1-h6)의 순서를 논리적으로 구성해주세요.'
          )
          break
        default:
          recommendations.push(
            `${violation.id} 규칙을 준수해주세요: ${violation.description}`
          )
      }
    })
    
    return [...new Set(recommendations)] // 중복 제거
  }
  
  static getViolationSummary(): {
    total: number
    bySeverity: Record<string, number>
    byRule: Record<string, number>
  } {
    const bySeverity: Record<string, number> = {}
    const byRule: Record<string, number> = {}
    
    this.violations.forEach(violation => {
      // 심각도별 집계
      const impact = violation.impact || 'unknown'
      bySeverity[impact] = (bySeverity[impact] || 0) + 1
      
      // 규칙별 집계
      byRule[violation.id] = (byRule[violation.id] || 0) + 1
    })
    
    return {
      total: this.violations.length,
      bySeverity,
      byRule,
    }
  }
}

// CI/CD 통합을 위한 접근성 리포터
export const generateAccessibilityReport = async (
  testResults: any[]
): Promise<string> => {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: testResults.length,
      passed: testResults.filter(r => r.passed).length,
      failed: testResults.filter(r => !r.passed).length,
    },
    details: testResults,
  }
  
  return JSON.stringify(report, null, 2)
}
```

---

## 📋 **요약**

이 문서는 바로캘린더의 접근성 아키텍처를 정의합니다:

### **♿ 핵심 접근성 기능**
- **WCAG AA 준수**: 색상 대비 4.5:1 이상, 키보드 네비게이션, 적절한 터치 영역 크기
- **ARIA 속성**: 적절한 라벨링, 설명, Live Region을 통한 동적 콘텐츠 알림
- **키보드 지원**: 모든 기능을 키보드로만 사용 가능, 논리적 포커스 순서
- **스크린 리더**: 의미론적 HTML, 건너뛰기 링크, 랜드마크 역할

### **🧪 접근성 테스트**
- **자동화된 테스트**: Jest + jest-axe를 활용한 접근성 검증
- **지속적 모니터링**: CI/CD 파이프라인에서 접근성 검사 자동화
- **사용자 테스트**: 실제 보조 기술 사용자를 통한 사용성 검증

### **📱 반응형 접근성**
- **모바일 접근성**: 터치 영역 최소 44px, 확대/축소 지원
- **다크 모드**: 고대비 모드 지원, 사용자 환경 설정 반영
- **모션 감소**: 애니메이션 및 전환 효과 선택적 비활성화

### **🌍 다국어 지원**
- **국제화**: 다양한 언어의 텍스트 방향성 지원
- **현지화**: 문화적 차이를 고려한 접근성 구현
- **보조 기술**: 다양한 언어의 스크린 리더 지원