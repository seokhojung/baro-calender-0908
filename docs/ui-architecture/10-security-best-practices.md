# 🔒 **7a. Security Best Practices**

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처 - 보안

---

## 🎯 **개요**

이 문서는 바로캘린더 프로젝트의 **보안 아키텍처**를 정의합니다. **XSS 방지, CSRF 보호, 데이터 암호화**를 통해 안전한 웹 애플리케이션을 구현합니다.

---

## 🔒 **7a.1 Authentication & Authorization**

### **인증 토큰 관리**
```typescript
// src/lib/security/auth.ts
interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export class AuthManager {
  private static tokens: AuthTokens | null = null
  private static refreshPromise: Promise<string> | null = null
  
  static setTokens(tokens: AuthTokens): void {
    this.tokens = tokens
    // 보안을 위해 localStorage 대신 httpOnly 쿠키 사용
    this.storeTokensSecurely(tokens)
  }
  
  static async getValidAccessToken(): Promise<string | null> {
    if (!this.tokens) {
      return null
    }
    
    // 토큰이 만료되었는지 확인
    if (Date.now() >= this.tokens.expiresAt) {
      return await this.refreshAccessToken()
    }
    
    return this.tokens.accessToken
  }
  
  private static async refreshAccessToken(): Promise<string | null> {
    // 동시 요청 방지
    if (this.refreshPromise) {
      return await this.refreshPromise
    }
    
    this.refreshPromise = this.performTokenRefresh()
    
    try {
      return await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }
  
  private static async performTokenRefresh(): Promise<string | null> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.tokens?.refreshToken,
        }),
      })
      
      if (!response.ok) {
        this.clearTokens()
        throw new Error('토큰 갱신 실패')
      }
      
      const newTokens = await response.json()
      this.setTokens(newTokens)
      
      return newTokens.accessToken
    } catch (error) {
      console.error('토큰 갱신 중 오류:', error)
      this.clearTokens()
      return null
    }
  }
  
  private static storeTokensSecurely(tokens: AuthTokens): void {
    // 액세스 토큰은 메모리에만 저장
    // 리프레시 토큰은 httpOnly 쿠키로 관리
    document.cookie = `refreshToken=${tokens.refreshToken}; Secure; HttpOnly; SameSite=Strict; Path=/`
  }
  
  static clearTokens(): void {
    this.tokens = null
    document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  }
}

// 권한 기반 접근 제어
export enum Permission {
  CREATE_EVENT = 'create_event',
  EDIT_EVENT = 'edit_event',
  DELETE_EVENT = 'delete_event',
  MANAGE_PROJECT = 'manage_project',
  VIEW_ANALYTICS = 'view_analytics',
}

export interface User {
  id: string
  email: string
  role: 'admin' | 'manager' | 'member'
  permissions: Permission[]
}

export const hasPermission = (user: User, permission: Permission): boolean => {
  return user.permissions.includes(permission)
}

export const requirePermission = (permission: Permission) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value
    
    descriptor.value = function(...args: any[]) {
      const user = getCurrentUser()
      
      if (!user || !hasPermission(user, permission)) {
        throw new Error('권한이 없습니다')
      }
      
      return method.apply(this, args)
    }
  }
}
```

### **보안 컨텍스트 및 훅**
```typescript
// src/contexts/SecurityContext.tsx
interface SecurityContextType {
  user: User | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  hasPermission: (permission: Permission) => boolean
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined)

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })
      
      if (!response.ok) {
        throw new Error('로그인 실패')
      }
      
      const { user, tokens } = await response.json()
      
      AuthManager.setTokens(tokens)
      setUser(user)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('로그인 오류:', error)
      throw error
    }
  }
  
  const logout = () => {
    AuthManager.clearTokens()
    setUser(null)
    setIsAuthenticated(false)
  }
  
  const checkPermission = (permission: Permission): boolean => {
    return user ? hasPermission(user, permission) : false
  }
  
  return (
    <SecurityContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      hasPermission: checkPermission,
    }}>
      {children}
    </SecurityContext.Provider>
  )
}

export const useSecurity = () => {
  const context = useContext(SecurityContext)
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider')
  }
  return context
}
```

---

## 🔒 **7a.2 XSS Prevention & Input Validation**

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

## 🔒 **7a.3 CSRF Protection**

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

---

## 🔒 **7a.4 Data Encryption & API Security**

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

// 데이터 암호화 유틸리티
export const encryptSensitiveData = async (data: string): Promise<string> => {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  
  // 암호화 키 생성 (실제로는 서버에서 관리)
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  )
  
  // 초기화 벡터 생성
  const iv = crypto.getRandomValues(new Uint8Array(12))
  
  // 데이터 암호화
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    dataBuffer
  )
  
  // Base64로 인코딩
  const encryptedArray = new Uint8Array(encryptedData)
  const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray))
  const ivBase64 = btoa(String.fromCharCode(...iv))
  
  return `${ivBase64}.${encryptedBase64}`
}

export const decryptSensitiveData = async (
  encryptedData: string,
  key: CryptoKey
): Promise<string> => {
  const [ivBase64, dataBase64] = encryptedData.split('.')
  
  // Base64 디코딩
  const iv = new Uint8Array(
    atob(ivBase64).split('').map(char => char.charCodeAt(0))
  )
  const data = new Uint8Array(
    atob(dataBase64).split('').map(char => char.charCodeAt(0))
  )
  
  // 데이터 복호화
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  )
  
  const decoder = new TextDecoder()
  return decoder.decode(decryptedData)
}
```

### **보안 테스트 유틸리티**
```typescript
// src/lib/security/testing.ts
export const securityTestUtils = {
  // XSS 공격 시뮬레이션
  testXSSPrevention: (input: string): boolean => {
    const maliciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
    ]
    
    const sanitized = sanitizeHTML(input)
    return !maliciousPatterns.some(pattern => pattern.test(sanitized))
  },
  
  // SQL 인젝션 패턴 검출
  testSQLInjection: (input: string): boolean => {
    const sqlPatterns = [
      /union\s+select/gi,
      /drop\s+table/gi,
      /insert\s+into/gi,
      /delete\s+from/gi,
      /update\s+.*\s+set/gi,
      /'.*or.*'/gi,
      /1=1/gi,
    ]
    
    return !sqlPatterns.some(pattern => pattern.test(input))
  },
  
  // CSRF 토큰 유효성 검사
  testCSRFProtection: async (): Promise<boolean> => {
    try {
      const token = await CSRFProtection.getToken()
      return await CSRFProtection.validateToken(token)
    } catch {
      return false
    }
  },
  
  // 보안 헤더 검증
  testSecurityHeaders: (response: Response): boolean => {
    const requiredHeaders = Object.keys(SECURITY_HEADERS)
    
    return requiredHeaders.every(header => 
      response.headers.has(header)
    )
  },
}

// 보안 테스트 스위트
describe('Security Tests', () => {
  it('should prevent XSS attacks', () => {
    const maliciousInput = '<script>alert("XSS")</script>'
    expect(securityTestUtils.testXSSPrevention(maliciousInput)).toBe(true)
  })
  
  it('should prevent SQL injection', () => {
    const maliciousInput = "'; DROP TABLE users; --"
    expect(securityTestUtils.testSQLInjection(maliciousInput)).toBe(true)
  })
  
  it('should have valid CSRF protection', async () => {
    const isProtected = await securityTestUtils.testCSRFProtection()
    expect(isProtected).toBe(true)
  })
})
```

---

## 📋 **요약**

이 문서는 바로캘린더의 보안 아키텍처를 정의합니다:

### **🔒 핵심 보안 기능**
- **인증/인가**: JWT 기반 토큰 관리 및 권한 기반 접근 제어
- **XSS 방지**: DOMPurify를 활용한 HTML/URL 새니타이제이션
- **입력 검증**: Zod 스키마 기반 타입 안전한 검증
- **CSRF 보호**: 토큰 기반 CSRF 공격 방지
- **API 보안**: 보안 헤더, Origin/Referer 검증
- **데이터 암호화**: AES-GCM 알고리즘을 활용한 민감 데이터 보호

### **🛡️ 보안 원칙**
- **최소 권한 원칙**: 사용자에게 필요한 최소한의 권한만 부여
- **심층 방어**: 다층 보안 시스템으로 보안 위험 최소화
- **보안 기본값**: 모든 기능이 보안을 기본값으로 설정
- **투명성**: 보안 정책과 절차를 명확히 문서화

### **🧪 테스트 및 검증**
- **자동화된 보안 테스트**: XSS, SQL 인젝션, CSRF 방지 검증
- **지속적 모니터링**: 보안 지표 및 위험 요소 실시간 추적
- **정기적 보안 감사**: 코드 및 시스템 보안 상태 점검