# State Management 통합 가이드

## 📋 문서 정보
- **문서 버전**: 2.0 (통합 버전)
- **작성일**: 2025-08-27 (통합)
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처
- **통합 내용**: 클라이언트 상태 관리 (기존 04번) + 서버 상태 관리 (기존 19번)

---

## 🧠 **4. 상태 관리 전략 - 통합 가이드**

바로캘린더의 상태 관리는 **클라이언트 상태**와 **서버 상태**를 명확히 분리하여 관리합니다.

---

## 📱 **4.1 클라이언트 상태 관리 - Zustand**

### **4.1.1 Zustand 기반 상태 관리 전략**

**도메인별 상태 분리**
- **Calendar Store**: 캘린더 뷰, 이벤트, 날짜 상태
- **Project Store**: 프로젝트 목록, 선택된 프로젝트
- **User Store**: 사용자 정보, 인증 상태, 권한
- **UI Store**: 테마, 사이드바 상태, 모달 상태
- **Offline Store**: 오프라인 상태, 동기화 큐

### **4.1.2 클라이언트 상태 구현 예시**

```typescript
// src/stores/calendar-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CalendarView, CalendarEvent } from '@/types/calendar'

interface CalendarState {
  // 상태
  currentView: CalendarView
  selectedDate: Date
  events: CalendarEvent[]
  
  // 액션
  setCurrentView: (view: CalendarView) => void
  setSelectedDate: (date: Date) => void
  addEvent: (event: CalendarEvent) => void
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void
  removeEvent: (id: string) => void
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      currentView: 'month',
      selectedDate: new Date(),
      events: [],
      
      // 액션 구현
      setCurrentView: (view) => set({ currentView: view }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      addEvent: (event) => set((state) => ({ 
        events: [...state.events, event] 
      })),
      updateEvent: (id, updates) => set((state) => ({
        events: state.events.map(event => 
          event.id === id ? { ...event, ...updates } : event
        )
      })),
      removeEvent: (id) => set((state) => ({
        events: state.events.filter(event => event.id !== id)
      })),
    }),
    {
      name: 'calendar-store',
      partialize: (state) => ({ 
        currentView: state.currentView,
        selectedDate: state.selectedDate 
      })
    }
  )
)
```

### **4.1.3 상태 지속성 및 동기화**
- **localStorage**: 사용자 설정, 테마, UI 상태
- **IndexedDB**: 오프라인 데이터, 캐시된 이벤트
- **실시간 동기화**: WebSocket을 통한 다중 사용자 동기화

---

## 🌐 **4.2 서버 상태 관리 - Apollo Client**

### **4.2.1 표준 도구 및 아키텍처**

**서버 상태 관리 원칙**
- **표준 도구**: **Apollo Client** (GraphQL 중심 프로젝트)
- **이유**: 정규화 캐시/Subscription/프래그먼트 기반 업데이트 최적화, 바로캘린더의 복잡한 데이터 관계에 적합
- **REST 호출**: `fetch` 최소화, Apollo Link로 공통 어댑터/에러정규화
- **금지**: 컴포넌트에서 직접 fetch 호출. 모든 원격 호출은 service→api 레이어 경유

### **4.2.2 Apollo Client 설정 및 최적화**

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

// 인증 링크
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('auth-token')
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
})

// HTTP 링크
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || '/api/graphql',
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

### **4.2.3 GraphQL 쿼리 및 뮤테이션 구현**

```typescript
// src/lib/graphql/queries/calendar.ts
import { gql } from '@apollo/client'

export const GET_CALENDAR_EVENTS = gql`
  query GetCalendarEvents(
    $startDate: DateTime!
    $endDate: DateTime!
    $projectIds: [ID!]
    $userIds: [ID!]
  ) {
    events(
      startDate: $startDate
      endDate: $endDate
      projectIds: $projectIds
      userIds: $userIds
    ) {
      id
      title
      description
      startTime
      endTime
      allDay
      status
      project {
        id
        name
        color
      }
      attendees {
        id
        name
        email
        status
      }
    }
  }
`

export const CREATE_CALENDAR_EVENT = gql`
  mutation CreateCalendarEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
      title
      description
      startTime
      endTime
      allDay
      status
      project {
        id
        name
        color
      }
    }
  }
`

// 실시간 업데이트를 위한 Subscription
export const EVENT_UPDATES_SUBSCRIPTION = gql`
  subscription EventUpdates($projectIds: [ID!]!) {
    eventUpdates(projectIds: $projectIds) {
      type
      event {
        id
        title
        description
        startTime
        endTime
        allDay
        status
        project {
          id
          name
          color
        }
        attendees {
          id
          name
          email
          status
        }
      }
    }
  }
`
```

---

## 🔄 **4.3 클라이언트-서버 상태 통합 패턴**

### **4.3.1 상태 동기화 전략**

```typescript
// src/hooks/use-calendar-sync.ts
import { useEffect } from 'react'
import { useQuery, useSubscription, useMutation } from '@apollo/client'
import { useCalendarStore } from '@/stores/calendar-store'
import { GET_CALENDAR_EVENTS, EVENT_UPDATES_SUBSCRIPTION } from '@/lib/graphql/queries/calendar'

export function useCalendarSync() {
  const { selectedDate, setEvents, addEvent, updateEvent, removeEvent } = useCalendarStore()
  
  // 서버에서 이벤트 데이터 가져오기
  const { data, loading, error } = useQuery(GET_CALENDAR_EVENTS, {
    variables: {
      startDate: startOfMonth(selectedDate),
      endDate: endOfMonth(selectedDate),
    },
    fetchPolicy: 'cache-and-network',
  })
  
  // 실시간 업데이트 구독
  useSubscription(EVENT_UPDATES_SUBSCRIPTION, {
    variables: { projectIds: [] },
    onData: ({ data: subscriptionData }) => {
      const { type, event } = subscriptionData.data.eventUpdates
      
      switch (type) {
        case 'CREATED':
          addEvent(event)
          break
        case 'UPDATED':
          updateEvent(event.id, event)
          break
        case 'DELETED':
          removeEvent(event.id)
          break
      }
    },
  })
  
  // 서버 데이터를 클라이언트 상태에 동기화
  useEffect(() => {
    if (data?.events) {
      setEvents(data.events)
    }
  }, [data, setEvents])
  
  return { loading, error }
}
```

### **4.3.2 낙관적 업데이트 구현**

```typescript
// src/hooks/use-calendar-mutations.ts
import { useMutation } from '@apollo/client'
import { useCalendarStore } from '@/stores/calendar-store'
import { CREATE_CALENDAR_EVENT, UPDATE_CALENDAR_EVENT, DELETE_CALENDAR_EVENT } from '@/lib/graphql/queries/calendar'

export function useCalendarMutations() {
  const { addEvent, updateEvent, removeEvent } = useCalendarStore()
  
  const [createEventMutation] = useMutation(CREATE_CALENDAR_EVENT, {
    onError: (error, { variables }) => {
      // 실패 시 낙관적 업데이트 롤백
      removeEvent(variables.input.tempId)
      console.error('Failed to create event:', error)
    },
  })
  
  const createEvent = async (eventData: CreateEventInput) => {
    const tempId = `temp-${Date.now()}`
    const optimisticEvent = {
      ...eventData,
      id: tempId,
      status: 'pending',
    }
    
    // 낙관적 업데이트
    addEvent(optimisticEvent)
    
    try {
      const { data } = await createEventMutation({
        variables: { input: { ...eventData, tempId } },
      })
      
      // 성공 시 임시 이벤트를 실제 데이터로 교체
      updateEvent(tempId, data.createEvent)
    } catch (error) {
      // 에러는 mutation의 onError에서 처리됨
    }
  }
  
  return { createEvent }
}
```

---

## 🎯 **4.4 성능 최적화 패턴**

### **4.4.1 메모이제이션 및 선택적 구독**

```typescript
// src/hooks/use-optimized-calendar.ts
import { useMemo } from 'react'
import { useCalendarStore } from '@/stores/calendar-store'

export function useOptimizedCalendar() {
  const { events, selectedDate, currentView } = useCalendarStore()
  
  // 메모이제이션을 통한 필터링 성능 최적화
  const filteredEvents = useMemo(() => {
    const viewStart = getViewStart(selectedDate, currentView)
    const viewEnd = getViewEnd(selectedDate, currentView)
    
    return events.filter(event => 
      isWithinInterval(new Date(event.startTime), { 
        start: viewStart, 
        end: viewEnd 
      })
    )
  }, [events, selectedDate, currentView])
  
  // 날짜별로 그룹핑된 이벤트
  const eventsByDate = useMemo(() => {
    return filteredEvents.reduce((acc, event) => {
      const dateKey = format(new Date(event.startTime), 'yyyy-MM-dd')
      return {
        ...acc,
        [dateKey]: [...(acc[dateKey] || []), event]
      }
    }, {} as Record<string, CalendarEvent[]>)
  }, [filteredEvents])
  
  return { filteredEvents, eventsByDate }
}
```

### **4.4.2 상태 분할 및 지연 로딩**

```typescript
// src/stores/ui-store.ts - UI 상태 분할
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'auto'
  modals: {
    eventDetails: boolean
    eventCreate: boolean
    settings: boolean
  }
  
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'auto') => void
  openModal: (modal: keyof UIState['modals']) => void
  closeModal: (modal: keyof UIState['modals']) => void
}

export const useUIStore = create<UIState>()(
  subscribeWithSelector((set) => ({
    sidebarOpen: true,
    theme: 'auto',
    modals: {
      eventDetails: false,
      eventCreate: false,
      settings: false,
    },
    
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setTheme: (theme) => set({ theme }),
    openModal: (modal) => set((state) => ({
      modals: { ...state.modals, [modal]: true }
    })),
    closeModal: (modal) => set((state) => ({
      modals: { ...state.modals, [modal]: false }
    })),
  }))
)
```

---

## 📚 **관련 문서**

- [**3. Component Standards**](./03-component-standards.md) - 컴포넌트 표준 및 패턴
- [**5. Design System Foundations**](./05-design-system-foundations.md) - 디자인 시스템 및 테마
- [**14. GraphQL API Integration**](./14-graphql-api-integration.md) - API 통합 전략
- [**15. 실시간 WebSocket 동기화**](./15-realtime-websocket-sync.md) - 실시간 동기화

---

## 📝 **문서 상태**

**4번 섹션 통합 완료** ✅
- 4.1 클라이언트 상태 관리 (Zustand)
- 4.2 서버 상태 관리 (Apollo Client)  
- 4.3 클라이언트-서버 상태 통합 패턴
- 4.4 성능 최적화 패턴

**통합으로 인한 변경사항**
- 기존 19번 문서 내용을 4번으로 통합
- 클라이언트-서버 상태 동기화 패턴 추가
- 성능 최적화 및 낙관적 업데이트 패턴 보강

---

## 🎯 **다음 단계**

이 통합된 상태 관리 전략을 기반으로:

1. **디자인 시스템 적용**: 5번 섹션 참조
2. **성능 최적화**: 8-9번 섹션 참조  
3. **API 통합**: 14번 섹션 참조
4. **실시간 동기화**: 15번 섹션 참조

**개발팀이 체계적이고 효율적인 상태 관리로 작업할 수 있는 통합 기반이 마련되었습니다!** 🚀