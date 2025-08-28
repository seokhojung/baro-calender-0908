# 표준 에러 포맷 및 핸들링

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처

---

## 🚨 **14. 표준 에러 포맷 및 핸들링**

### **14.1 ApiError 타입 정의**

**표준 에러 포맷**
```typescript
// src/types/api.ts
export type ApiError = {
  code: string;          // ex) E401_UNAUTHORIZED, E422_VALIDATION
  message: string;       // 사용자 노출용 메시지(국문)
  details?: unknown;     // 필드 에러 등
  requestId?: string;    // 백엔드/게이트웨이 트레이스
  timestamp?: string;
};

// 에러 코드 상수
export const ERROR_CODES = {
  UNAUTHORIZED: 'E401_UNAUTHORIZED',
  FORBIDDEN: 'E403_FORBIDDEN',
  NOT_FOUND: 'E404_NOT_FOUND',
  VALIDATION: 'E422_VALIDATION',
  SERVER_ERROR: 'E500_SERVER',
  NETWORK_ERROR: 'E000_NETWORK',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
```

### **14.2 HTTP ↔ UI 에러 맵핑**

**에러 처리 매핑 표**
| HTTP | ApiError.code      | UI 처리       | 토스트/배너   |
| ---- | ------------------ | ----------- | -------- |
| 401  | E401_UNAUTHORIZED | 로그인 페이지 이동  | 배너 안내    |
| 403  | E403_FORBIDDEN    | 권한 안내 + 홈으로 | 배너       |
| 404  | E404_NOT_FOUND   | Empty 상태    | 토스트 없음   |
| 422  | E422_VALIDATION   | 필드 하이라이트    | 인라인 에러   |
| 5xx  | E500_SERVER       | 재시도 버튼      | 토스트 + 배너 |

### **14.3 전역 에러 핸들링**

**에러 바운더리 및 토스트 시스템**
```typescript
// src/components/common/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean
  error?: ApiError
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error: this.normalizeError(error) }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    
    // 에러 로깅 서비스로 전송
    this.logError(error, errorInfo)
  }

  private normalizeError(error: Error): ApiError {
    // GraphQL 에러를 ApiError로 정규화
    if (error.graphQLErrors) {
      const graphQLError = error.graphQLErrors[0]
      return {
        code: ERROR_CODES.VALIDATION,
        message: graphQLError.message,
        details: graphQLError.extensions,
        timestamp: new Date().toISOString(),
      }
    }
    
    // 네트워크 에러 처리
    if (error.networkError) {
      return {
        code: ERROR_CODES.NETWORK_ERROR,
        message: '네트워크 연결을 확인해주세요',
        timestamp: new Date().toISOString(),
      }
    }
    
    // 기본 에러
    return {
      code: ERROR_CODES.SERVER_ERROR,
      message: error.message || '알 수 없는 오류가 발생했습니다',
      timestamp: new Date().toISOString(),
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>문제가 발생했습니다</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            새로고침
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

---

## 📚 **관련 문서**

- [**13. 서버 상태 관리 원칙**](./13-server-state-management.md)
- [**15. Observability 및 모니터링**](./15-observability-monitoring.md)

---

## 📝 **문서 상태**

**14번 섹션 분할 완료** ✅
- 14.1 ApiError 타입 정의
- 14.2 HTTP ↔ UI 에러 맵핑
- 14.3 전역 에러 핸들링

---

## 🎯 **다음 단계**

이 에러 핸들링 시스템을 기반으로:
1. **에러 타입 정의**: 표준화된 에러 코드 및 메시지 체계
2. **에러 바운더리**: 전역 에러 캐치 및 처리
3. **사용자 경험**: 에러 상황에 대한 적절한 UI 피드백
4. **로깅 및 모니터링**: 에러 추적 및 분석 시스템
