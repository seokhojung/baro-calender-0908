# 🔒 **7. Security & Accessibility**

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처 - 보안 및 접근성

---

## 🎯 **개요**

이 문서는 바로캘린더 프로젝트의 **보안 및 접근성** 아키텍처를 정의합니다. **XSS 방지, CSRF 보호, WCAG AA 기준 준수**를 통해 안전하고 모든 사용자가 사용할 수 있는 웹 애플리케이션을 구현합니다.

---

## 🔒 **7.1 XSS 방지 및 입력 검증**

### **DOMPurify를 활용한 XSS 방지**
```typescript
// src/lib/security/sanitize.ts
import DOMPurify from 'dompurify'

export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'div',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ],
    ALLOWED_ATTR: ['href', 'target', 'class', 'id'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    RETURN_TRUSTED_TYPE: false,
  })
}

export const sanitizeURL = (url: string): string => {
  return DOMPurify.sanitize(url, {
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
}

// 안전한 HTML 렌더링 컴포넌트
export const SafeHTML: React.FC<{ html: string; className?: string }> = ({
  html,
  className,
}) => {
  const sanitizedHTML = useMemo(() => sanitizeHTML(html), [html])
  
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  )
}
```

### **입력 검증 및 필터링**
```typescript
// src/lib/security/validation.ts
import { z } from 'zod'

// 이벤트 생성 스키마
export const CreateEventSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(100, '제목은 100자 이하여야 합니다')
    .regex(/^[^\<>\"\']*$/, '특수문자를 사용할 수 없습니다'),
  
  description: z
    .string()
    .max(1000, '설명은 1000자 이하여야 합니다')
    .optional(),
  
  startDate: z
    .date()
    .min(new Date(), '시작일은 오늘 이후여야 합니다'),
  
  endDate: z
    .date()
    .min(new Date(), '종료일은 오늘 이후여야 합니다'),
  
  projectId: z
    .string()
    .uuid('올바른 프로젝트 ID를 입력해주세요'),
  
  attendees: z
    .array(z.string().email('올바른 이메일을 입력해주세요'))
    .max(50, '참석자는 50명 이하여야 합니다')
    .optional(),
})

export type CreateEventDto = z.infer<typeof CreateEventSchema>

// 프로젝트 생성 스키마
export const CreateProjectSchema = z.object({
  name: z
    .string()
    .min(1, '프로젝트명을 입력해주세요')
    .max(100, '프로젝트명은 100자 이하여야 합니다')
    .regex(/^[^\<>\"\']*$/, '특수문자를 사용할 수 없습니다'),
  
  description: z
    .string()
    .max(500, '설명은 500자 이하여야 합니다')
    .optional(),
  
  color: z
    .enum(['blue', 'green', 'purple', 'orange', 'red', 'teal', 'pink', 'indigo'])
    .default('blue'),
  
  isPublic: z
    .boolean()
    .default(false),
})

export type CreateProjectDto = z.infer<typeof CreateProjectSchema>

// 검증 유틸리티
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join(', ')
      throw new Error(`입력 검증 실패: ${messages}`)
    }
    throw error
  }
}

// 실시간 검증 훅
export const useInputValidation = <T>(
  schema: z.ZodSchema<T>,
  initialData: Partial<T> = {}
) => {
  const [data, setData] = useState<Partial<T>>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isValid, setIsValid] = useState(false)
  
  const validate = useCallback((fieldData: Partial<T>) => {
    try {
      schema.parse(fieldData)
      setErrors({})
      setIsValid(true)
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach(e => {
          if (e.path.length > 0) {
            fieldErrors[e.path[0] as string] = e.message
          }
        })
        setErrors(fieldErrors)
        setIsValid(false)
      }
      return false
    }
  }, [schema])
  
  const updateField = useCallback((field: keyof T, value: T[keyof T]) => {
    const newData = { ...data, [field]: value }
    setData(newData)
    validate(newData)
  }, [data, validate])
  
  return {
    data,
    errors,
    isValid,
    updateField,
    validate: () => validate(data),
  }
}
```

---

## 🔒 **7.2 CSRF 보호 및 API 보안**

### **CSRF 토큰 관리**
```typescript
// src/lib/security/csrf.ts
export class CSRFProtection {
  private static token: string | null = null
  private static tokenExpiry: number = 0
  
  static async getToken(): Promise<string> {
    // 토큰이 유효한지 확인
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token
    }
    
    // 새 토큰 요청
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error('CSRF 토큰을 가져올 수 없습니다')
      }
      
      const { token, expiresIn } = await response.json()
      
      this.token = token
      this.tokenExpiry = Date.now() + (expiresIn * 1000)
      
      return token
    } catch (error) {
      console.error('CSRF 토큰 요청 실패:', error)
      throw error
    }
  }
  
  static async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('/api/csrf-validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token,
        },
        credentials: 'include',
      })
      
      return response.ok
    } catch (error) {
      console.error('CSRF 토큰 검증 실패:', error)
      return false
    }
  }
  
  static getStoredToken(): string | null {
    return this.token
  }
  
  static clearToken(): void {
    this.token = null
    this.tokenExpiry = 0
  }
}

// API 클라이언트에 CSRF 보호 적용
export const secureFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const csrfToken = await CSRFProtection.getToken()
  
  const secureOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': csrfToken,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  }
  
  return fetch(url, secureOptions)
}
```

### **API 요청 보안 미들웨어**
```typescript
// src/lib/security/apiSecurity.ts
interface SecurityHeaders {
  'X-Content-Type-Options': string
  'X-Frame-Options': string
  'X-XSS-Protection': string
  'Referrer-Policy': string
  'Content-Security-Policy': string
  'Strict-Transport-Security': string
}

export const SECURITY_HEADERS: SecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.barocalendar.com",
    "frame-ancestors 'none'",
  ].join('; '),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

// API 요청 보안 검사
export const validateAPIRequest = (request: Request): boolean => {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  
  // Origin 검증
  if (origin && !isValidOrigin(origin)) {
    console.warn('Invalid origin:', origin)
    return false
  }
  
  // Referer 검증
  if (referer && !isValidReferer(referer)) {
    console.warn('Invalid referer:', referer)
    return false
  }
  
  // User-Agent 검증
  const userAgent = request.headers.get('user-agent')
  if (userAgent && !isValidUserAgent(userAgent)) {
    console.warn('Invalid user-agent:', userAgent)
    return false
  }
  
  return true
}

// 보안 헤더 적용
export const applySecurityHeaders = (response: Response): Response => {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

// 보안 검증 유틸리티
const isValidOrigin = (origin: string): boolean => {
  const allowedOrigins = [
    'https://barocalendar.com',
    'https://www.barocalendar.com',
    'https://app.barocalendar.com',
  ]
  
  return allowedOrigins.includes(origin)
}

const isValidReferer = (referer: string): boolean => {
  try {
    const url = new URL(referer)
    return url.hostname === 'barocalendar.com' || url.hostname.endsWith('.barocalendar.com')
  } catch {
    return false
  }
}

const isValidUserAgent = (userAgent: string): boolean => {
  // 악성 User-Agent 패턴 차단
  const maliciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
  ]
  
  return !maliciousPatterns.some(pattern => pattern.test(userAgent))
}
```

---

## ♿ **7.3 WCAG AA 기준 접근성 준수**

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

---

## ♿ **7.4 스크린 리더 및 보조 기술 지원**

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

// 접근성 향상 컴포넌트
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

---

## 🧪 **7.5 접근성 테스트 및 검증**

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
```

---

## 📋 **요약**

이 문서는 바로캘린더의 보안 및 접근성 아키텍처를 정의합니다:

### **🔒 보안 기능**
- **XSS 방지**: DOMPurify를 활용한 HTML/URL 새니타이제이션
- **입력 검증**: Zod 스키마 기반 타입 안전한 검증
- **CSRF 보호**: 토큰 기반 CSRF 공격 방지
- **API 보안**: 보안 헤더, Origin/Referer 검증

### **♿ 접근성 기능**
- **WCAG AA 준수**: 색상 대비, 키보드 네비게이션, 스크린 리더 지원
- **ARIA 속성**: 적절한 라벨링 및 설명 제공
- **키보드 지원**: 모든 기능을 키보드로만 사용 가능
- **보조 기술**: 스크린 리더, 음성 인식 등 지원

### **🧪 품질 보증**
- **자동화된 테스트**: Jest + jest-axe를 활용한 접근성 테스트
- **지속적 검증**: CI/CD 파이프라인에서 접근성 검사 자동화
- **성능 모니터링**: 보안 및 접근성 지표 지속적 추적
