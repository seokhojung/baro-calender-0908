# 서버 상태 관리 원칙

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처

---

## 🔒 **13. 서버 상태 관리 원칙**

### **13.1 표준 도구 및 아키텍처**

**서버 상태 관리 원칙**
- **표준 도구**: **Apollo Client** (GraphQL 중심 프로젝트)
- **이유**: 정규화 캐시/Subscription/프래그먼트 기반 업데이트 최적화, 바로캘린더의 복잡한 데이터 관계에 적합
- **REST 호출**: `fetch` 최소화, Apollo Link로 공통 어댑터/에러정규화
- **금지**: 컴포넌트에서 직접 fetch 호출. 모든 원격 호출은 service→api 레이어 경유

### **13.2 호출 수명주기 규칙**

**Apollo Client 설정 및 최적화**
```typescript
// src/lib/graphql/client.ts
import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { RetryLink } from '@apollo/client/link/retry'

// 캐시 정책 설정
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        events: {
          keyArgs: ['startDate', 'endDate', 'projectIds', 'userIds'],
          merge(existing = [], incoming) {
            return [...existing, ...incoming]
          },
        },
        projects: {
          keyArgs: false,
          merge(existing = [], incoming) {
            return [...existing, ...incoming]
          },
        },
      },
    },
    Event: {
      keyFields: ['id'],
      fields: {
        attendees: {
          merge(existing = [], incoming) {
            return incoming
          },
        },
      },
    },
  },
})

// 에러 처리 및 재시도 설정
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
      
      // 인증 에러 처리
      if (message.includes('Unauthorized') || message.includes('Forbidden')) {
        localStorage.removeItem('auth-token')
        window.location.href = '/login'
      }
    })
  }
  
  if (networkError) {
    console.error('Network error:', networkError)
    
    // 네트워크 에러 시 재시도 (런타임 타입 가드 적용)
    if ('statusCode' in networkError && networkError.statusCode === 500) {
      return forward(operation)
    }
  }
})

// 재시도 링크 (지수 백오프)
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 3000,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error, _operation) => {
      // 런타임 타입 가드 적용
      return !!error && 'statusCode' in error && error.statusCode >= 500
    },
  },
})

// Apollo 클라이언트 생성
export const client = new ApolloClient({
  link: from([
    errorLink,
    retryLink,
    authLink,
    httpLink,
  ]),
  cache,
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-first',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
})
```

---

## 📚 **관련 문서**

- [**4. State Management**](./04-state-management.md)
- [**8. Mobile & API Integration**](./08-mobile-api-integration.md)

---

## 📝 **문서 상태**

**13번 섹션 분할 완료** ✅
- 13.1 표준 도구 및 아키텍처
- 13.2 호출 수명주기 규칙

---

## 🎯 **다음 단계**

이 서버 상태 관리 원칙을 기반으로:
1. **Apollo Client 설정**: GraphQL 클라이언트 구성
2. **캐시 정책**: 타입별 캐시 정책 설정
3. **에러 처리**: 통합된 에러 처리 및 재시도 로직
4. **성능 최적화**: 캐시 병합 및 업데이트 최적화
