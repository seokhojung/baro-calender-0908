# 📱 **8. Mobile & API Integration**

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처 - 모바일 및 API 통합

---

## 🎯 **개요**

이 문서는 바로캘린더 프로젝트의 **모바일 최적화 및 API 통합** 아키텍처를 정의합니다. **PWA 구현, 터치 제스처, GraphQL API, 실시간 동기화**를 통해 네이티브 앱과 같은 사용자 경험을 제공합니다.

---

## 📱 **8.1 Progressive Web App (PWA) 구현**

### **PWA 매니페스트 설정**
```json
// public/manifest.json
{
  "name": "바로캘린더",
  "short_name": "바로캘린더",
  "description": "프로젝트 일정 관리 및 팀 협업을 위한 캘린더 애플리케이션",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "ko",
  "categories": ["productivity", "business", "utilities"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "새 이벤트",
      "short_name": "새 이벤트",
      "description": "새로운 캘린더 이벤트를 생성합니다",
      "url": "/calendar/new",
      "icons": [
        {
          "src": "/icons/shortcut-new-event.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "오늘",
      "short_name": "오늘",
      "description": "오늘 날짜로 이동합니다",
      "url": "/calendar?date=today",
      "icons": [
        {
          "src": "/icons/shortcut-today.png",
          "sizes": "96x96"
        }
      ]
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/mobile.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

### **서비스 워커 구현**
```typescript
// public/sw.js
const CACHE_NAME = 'baro-calendar-v1'
const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'

// 정적 자원 캐싱
const STATIC_ASSETS = [
  '/',
  '/calendar',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
]

// 설치 시 정적 자원 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
})

// 네트워크 우선, 캐시 폴백 전략
self.addEventListener('fetch', (event) => {
  const { request } = event
  
  // API 요청은 네트워크 우선
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 성공한 응답을 동적 캐시에 저장
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // 네트워크 실패 시 캐시에서 응답
          return caches.match(request)
        })
    )
    return
  }
  
  // 정적 자원은 캐시 우선
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request)
    })
  )
})

// 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
})
```

---

## 📱 **8.2 모바일 터치 제스처 및 반응형 인터페이스**

### **터치 제스처 훅**
```typescript
// src/hooks/useTouchGestures.ts
interface TouchGestureConfig {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onPinch?: (scale: number) => void
  onRotate?: (angle: number) => void
  onTap?: () => void
  onDoubleTap?: () => void
  onLongPress?: () => void
  threshold?: number
  minSwipeDistance?: number
}

export const useTouchGestures = (config: TouchGestureConfig) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onRotate,
    onTap,
    onDoubleTap,
    onLongPress,
    threshold = 50,
    minSwipeDistance = 100,
  } = config
  
  const touchStart = useRef<Touch | null>(null)
  const touchEnd = useRef<Touch | null>(null)
  const touchStartTime = useRef<number>(0)
  const touchEndTime = useRef<number>(0)
  const lastTapTime = useRef<number>(0)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    touchStart.current = event.touches[0]
    touchStartTime.current = Date.now()
    
    // 롱프레스 타이머 시작
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress()
      }, 500)
    }
  }, [onLongPress])
  
  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    touchEnd.current = event.touches[0]
    
    // 롱프레스 타이머 취소
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])
  
  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    touchEnd.current = event.changedTouches[0]
    touchEndTime.current = Date.now()
    
    // 롱프레스 타이머 취소
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
    if (!touchStart.current || !touchEnd.current) return
    
    const distanceX = touchStart.current.clientX - touchEnd.current.clientX
    const distanceY = touchStart.current.clientY - touchEnd.current.clientY
    const duration = touchEndTime.current - touchStartTime.current
    
    // 스와이프 제스처 감지
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      // 가로 스와이프
      if (Math.abs(distanceX) > minSwipeDistance && duration < threshold) {
        if (distanceX > 0 && onSwipeLeft) {
          onSwipeLeft()
        } else if (distanceX < 0 && onSwipeRight) {
          onSwipeRight()
        }
      }
    } else {
      // 세로 스와이프
      if (Math.abs(distanceY) > minSwipeDistance && duration < threshold) {
        if (distanceY > 0 && onSwipeUp) {
          onSwipeUp()
        } else if (distanceY < 0 && onSwipeDown) {
          onSwipeDown()
        }
      }
    }
    
    // 탭 제스처 감지
    if (Math.abs(distanceX) < 10 && Math.abs(distanceY) < 10) {
      const currentTime = Date.now()
      const timeDiff = currentTime - lastTapTime.current
      
      if (timeDiff < 300 && timeDiff > 0) {
        // 더블 탭
        if (onDoubleTap) {
          onDoubleTap()
        }
      } else {
        // 싱글 탭
        if (onTap) {
          onTap()
        }
      }
      
      lastTapTime.current = currentTime
    }
    
    // 터치 상태 초기화
    touchStart.current = null
    touchEnd.current = null
  }, [
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    threshold,
    minSwipeDistance,
  ])
  
  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  }
}

// 모바일 캘린더 뷰에 적용
export const MobileCalendarView = () => {
  const { currentView, setCurrentView } = useCalendarStore()
  
  const handleSwipeLeft = useCallback(() => {
    // 다음 뷰로 이동
    if (currentView === 'month') {
      setCurrentView('week')
    } else if (currentView === 'week') {
      setCurrentView('day')
    }
  }, [currentView, setCurrentView])
  
  const handleSwipeRight = useCallback(() => {
    // 이전 뷰로 이동
    if (currentView === 'day') {
      setCurrentView('week')
    } else if (currentView === 'week') {
      setCurrentView('month')
    }
  }, [currentView, setCurrentView])
  
  const { touchHandlers } = useTouchGestures({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    onDoubleTap: () => {
      // 빠른 이벤트 생성
      router.push('/calendar/new')
    },
  })
  
  return (
    <div className="mobile-calendar-view" {...touchHandlers}>
      {/* 캘린더 내용 */}
    </div>
  )
}
```

### **반응형 모바일 인터페이스**
```typescript
// src/components/mobile/MobileNavigation.tsx
import { useBreakpoint } from '@/hooks/useBreakpoint'

export const MobileNavigation = () => {
  const breakpoint = useBreakpoint()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // 모바일에서만 하단 네비게이션 표시
  if (breakpoint !== 'xs' && breakpoint !== 'sm') {
    return null
  }
  
  return (
    <>
      {/* 하단 네비게이션 바 */}
      <nav className="mobile-bottom-nav">
        <button
          className="nav-item"
          onClick={() => router.push('/calendar')}
          aria-label="캘린더"
        >
          <Calendar className="h-6 w-6" />
          <span>캘린더</span>
        </button>
        
        <button
          className="nav-item"
          onClick={() => router.push('/projects')}
          aria-label="프로젝트"
        >
          <Folder className="h-6 w-6" />
          <span>프로젝트</span>
        </button>
        
        <button
          className="nav-item"
          onClick={() => router.push('/calendar/new')}
          aria-label="새 이벤트"
          className="nav-item-primary"
        >
          <Plus className="h-6 w-6" />
          <span>새 이벤트</span>
        </button>
        
        <button
          className="nav-item"
          onClick={() => router.push('/notifications')}
          aria-label="알림"
        >
          <Bell className="h-6 w-6" />
          <span>알림</span>
        </button>
        
        <button
          className="nav-item"
          onClick={() => router.push('/settings')}
          aria-label="설정"
        >
          <Settings className="h-6 w-6" />
          <span>설정</span>
        </button>
      </nav>
      
      {/* 모바일 메뉴 오버레이 */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu">
            <div className="mobile-menu-header">
              <h2>메뉴</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                aria-label="메뉴 닫기"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mobile-menu-content">
              <button
                className="menu-item"
                onClick={() => {
                  router.push('/profile')
                  setIsMenuOpen(false)
                }}
              >
                <User className="h-4 w-4" />
                프로필
              </button>
              
              <button
                className="menu-item"
                onClick={() => {
                  router.push('/help')
                  setIsMenuOpen(false)
                }}
              >
                <HelpCircle className="h-4 w-4" />
                도움말
              </button>
              
              <button
                className="menu-item"
                onClick={() => {
                  // 로그아웃
                  setIsMenuOpen(false)
                }}
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// 모바일 전용 스타일
const mobileStyles = `
  .mobile-bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--background);
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 0.5rem 0;
    z-index: 1000;
  }
  
  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
    transition: all 0.2s;
    color: var(--muted-foreground);
  }
  
  .nav-item:hover,
  .nav-item:focus {
    color: var(--foreground);
    background: var(--accent);
  }
  
  .nav-item-primary {
    background: var(--primary);
    color: var(--primary-foreground);
    border-radius: 50%;
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translateY(-0.5rem);
  }
  
  .nav-item-primary:hover,
  .nav-item-primary:focus {
    background: var(--primary-foreground);
    color: var(--primary);
  }
  
  .mobile-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 2000;
    display: flex;
    align-items: flex-end;
  }
  
  .mobile-menu {
    background: var(--background);
    border-radius: 1rem 1rem 0 0;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .mobile-menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--border);
  }
  
  .mobile-menu-content {
    padding: 1rem;
  }
  
  .menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    width: 100%;
    border-radius: 0.5rem;
    transition: background 0.2s;
  }
  
  .menu-item:hover,
  .menu-item:focus {
    background: var(--accent);
  }
`
```

---

## 🔌 **8.3 GraphQL API 설계 및 최적화**

### **GraphQL 스키마 정의**
```typescript
// src/lib/graphql/schema.ts
import { gql } from '@apollo/client'

// 타입 정의
export const typeDefs = gql`
  scalar DateTime
  scalar JSON
  
  type User {
    id: ID!
    email: String!
    name: String!
    avatar: String
    timezone: String!
    language: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    projects: [Project!]!
    events: [Event!]!
  }
  
  type Project {
    id: ID!
    name: String!
    description: String
    color: String!
    isPublic: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    owner: User!
    members: [ProjectMember!]!
    events: [Event!]!
  }
  
  type ProjectMember {
    id: ID!
    project: Project!
    user: User!
    role: ProjectRole!
    joinedAt: DateTime!
  }
  
  enum ProjectRole {
    OWNER
    ADMIN
    MEMBER
    VIEWER
  }
  
  type Event {
    id: ID!
    title: String!
    description: String
    startDate: DateTime!
    endDate: DateTime!
    allDay: Boolean!
    location: String
    project: Project
    attendees: [EventAttendee!]!
    recurring: RecurringRule
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  type EventAttendee {
    id: ID!
    event: Event!
    user: User!
    status: AttendanceStatus!
    responseAt: DateTime
  }
  
  enum AttendanceStatus {
    PENDING
    ACCEPTED
    DECLINED
    TENTATIVE
  }
  
  type RecurringRule {
    id: ID!
    frequency: RecurringFrequency!
    interval: Int!
    endDate: DateTime
    count: Int
    daysOfWeek: [Int!]
    daysOfMonth: [Int!]
    monthsOfYear: [Int!]
  }
  
  enum RecurringFrequency {
    DAILY
    WEEKLY
    MONTHLY
    YEARLY
  }
  
  type Query {
    # 사용자 관련
    me: User
    user(id: ID!): User
    
    # 프로젝트 관련
    projects: [Project!]!
    project(id: ID!): Project
    myProjects: [Project!]!
    
    # 이벤트 관련
    events(
      startDate: DateTime!
      endDate: DateTime!
      projectIds: [ID!]
      userIds: [ID!]
    ): [Event!]!
    event(id: ID!): Event
    
    # 검색
    searchEvents(query: String!): [Event!]!
    searchProjects(query: String!): [Project!]!
  }
  
  type Mutation {
    # 사용자 관련
    updateProfile(input: UpdateProfileInput!): User!
    
    # 프로젝트 관련
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): Boolean!
    addProjectMember(projectId: ID!, input: AddMemberInput!): ProjectMember!
    removeProjectMember(projectId: ID!, userId: ID!): Boolean!
    
    # 이벤트 관련
    createEvent(input: CreateEventInput!): Event!
    updateEvent(id: ID!, input: UpdateEventInput!): Event!
    deleteEvent(id: ID!): Boolean!
    respondToEvent(eventId: ID!, status: AttendanceStatus!): EventAttendee!
  }
  
  type Subscription {
    # 실시간 업데이트
    eventUpdated(projectId: ID!): Event!
    projectUpdated: Project!
    userJoinedProject(projectId: ID!): ProjectMember!
  }
  
  # 입력 타입들
  input UpdateProfileInput {
    name: String
    timezone: String
    language: String
    avatar: String
  }
  
  input CreateProjectInput {
    name: String!
    description: String
    color: String!
    isPublic: Boolean!
  }
  
  input UpdateProjectInput {
    name: String
    description: String
    color: String
    isPublic: Boolean
  }
  
  input AddMemberInput {
    userId: ID!
    role: ProjectRole!
  }
  
  input CreateEventInput {
    title: String!
    description: String
    startDate: DateTime!
    endDate: DateTime!
    allDay: Boolean!
    location: String
    projectId: ID
    attendeeIds: [ID!]
    recurring: RecurringRuleInput
  }
  
  input UpdateEventInput {
    title: String
    description: String
    startDate: DateTime
    endDate: DateTime
    allDay: Boolean
    location: String
    projectId: ID
    attendeeIds: [ID!]
    recurring: RecurringRuleInput
  }
  
  input RecurringRuleInput {
    frequency: RecurringFrequency!
    interval: Int!
    endDate: DateTime
    count: Int
    daysOfWeek: [Int!]
    daysOfMonth: [Int!]
    monthsOfYear: [Int!]
  }
`
```

### **GraphQL 클라이언트 설정**
```typescript
// src/lib/graphql/client.ts
import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { RetryLink } from '@apollo/client/link/retry'
import { BatchHttpLink } from '@apollo/client/link/batch-http'

// HTTP 링크 설정
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
})

// 배치 HTTP 링크 (여러 요청을 하나로 묶어서 전송)
const batchHttpLink = new BatchHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
  batchMax: 5, // 최대 5개 요청을 묶음
  batchInterval: 20, // 20ms 대기
})

// 인증 헤더 추가
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('auth-token')
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

// 에러 처리
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
      
      // 인증 에러 처리
      if (message.includes('Unauthorized') || message.includes('Forbidden')) {
        // 토큰 갱신 또는 로그아웃
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

// 재시도 링크
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 3000,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error, _operation) => {
      // 특정 에러만 재시도 (런타임 타입 가드 적용)
      return !!error && 'statusCode' in error && error.statusCode >= 500
    },
  },
})

// 캐시 설정
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
    Project: {
      keyFields: ['id'],
      fields: {
        members: {
          merge(existing = [], incoming) {
            return incoming
          },
        },
        events: {
          merge(existing = [], incoming) {
            return incoming
          },
        },
      },
    },
  },
})

// Apollo 클라이언트 생성
export const client = new ApolloClient({
  link: from([
    errorLink,
    retryLink,
    authLink,
    batchHttpLink,
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
  connectToDevTools: process.env.NODE_ENV === 'development',
})
```

---

## 🔄 **8.4 실시간 데이터 동기화 및 WebSocket 구현**

### **WebSocket 연결 관리**
```typescript
// src/lib/realtime/websocket.ts
interface WebSocketMessage {
  type: string
  payload: any
  timestamp: number
  id: string
}

interface WebSocketConfig {
  url: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

export class WebSocketManager {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private messageQueue: WebSocketMessage[] = []
  private isConnected = false
  
  constructor(private config: WebSocketConfig) {}
  
  connect() {
    try {
      this.ws = new WebSocket(this.config.url)
      
      this.ws.onopen = () => {
        this.isConnected = true
        this.reconnectAttempts = 0
        this.config.onConnect?.()
        
        // 큐에 있는 메시지들 전송
        this.flushMessageQueue()
      }
      
      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.config.onMessage?.(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
      
      this.ws.onclose = () => {
        this.isConnected = false
        this.config.onDisconnect?.()
        this.scheduleReconnect()
      }
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.config.onError?.(error)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.scheduleReconnect()
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
  
  send(message: Omit<WebSocketMessage, 'timestamp' | 'id'>) {
    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    }
    
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(fullMessage))
    } else {
      // 연결이 끊어진 경우 큐에 저장
      this.messageQueue.push(fullMessage)
    }
  }
  
  private scheduleReconnect() {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
      console.error('Max reconnection attempts reached')
      return
    }
    
    const interval = this.config.reconnectInterval || 1000
    const delay = interval * Math.pow(2, this.reconnectAttempts)
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }
  
  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message && this.ws) {
        this.ws.send(JSON.stringify(message))
      }
    }
  }
  
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
    }
  }
}

// 실시간 이벤트 동기화
export class RealtimeEventSync {
  private wsManager: WebSocketManager
  
  constructor() {
    this.wsManager = new WebSocketManager({
      url: process.env.NEXT_PUBLIC_WS_ENDPOINT || 'ws://localhost:4000',
      onMessage: this.handleMessage.bind(this),
      onConnect: this.handleConnect.bind(this),
      onDisconnect: this.handleDisconnect.bind(this),
    })
  }
  
  connect() {
    this.wsManager.connect()
  }
  
  disconnect() {
    this.wsManager.disconnect()
  }
  
  subscribeToProject(projectId: string) {
    this.wsManager.send({
      type: 'SUBSCRIBE_PROJECT',
      payload: { projectId },
    })
  }
  
  unsubscribeFromProject(projectId: string) {
    this.wsManager.send({
      type: 'UNSUBSCRIBE_PROJECT',
      payload: { projectId },
    })
  }
  
  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'EVENT_CREATED':
        this.handleEventCreated(message.payload)
        break
      case 'EVENT_UPDATED':
        this.handleEventUpdated(message.payload)
        break
      case 'EVENT_DELETED':
        this.handleEventDeleted(message.payload)
        break
      case 'PROJECT_UPDATED':
        this.handleProjectUpdated(message.payload)
        break
      case 'USER_JOINED_PROJECT':
        this.handleUserJoinedProject(message.payload)
        break
      default:
        console.warn('Unknown message type:', message.type)
    }
  }
  
  private handleConnect() {
    console.log('Realtime connection established')
    
    // 현재 프로젝트에 구독
    const currentProject = useProjectStore.getState().selectedProject
    if (currentProject) {
      this.subscribeToProject(currentProject.id)
    }
  }
  
  private handleDisconnect() {
    console.log('Realtime connection lost')
  }
  
  private handleEventCreated(event: any) {
    // Zustand 스토어 업데이트
    useCalendarStore.getState().addEvent(event)
    
    // 사용자에게 알림
    toast.success('새로운 이벤트가 생성되었습니다')
  }
  
  private handleEventUpdated(event: any) {
    // Zustand 스토어 업데이트
    useCalendarStore.getState().updateEvent(event.id, event)
    
    // 사용자에게 알림
    toast.info('이벤트가 업데이트되었습니다')
  }
  
  private handleEventDeleted(eventId: string) {
    // Zustand 스토어 업데이트
    useCalendarStore.getState().deleteEvent(eventId)
    
    // 사용자에게 알림
    toast.warning('이벤트가 삭제되었습니다')
  }
  
  private handleProjectUpdated(project: any) {
    // Zustand 스토어 업데이트
    useProjectStore.getState().updateProject(project.id, project)
  }
  
  private handleUserJoinedProject(data: any) {
    // Zustand 스토어 업데이트
    useProjectStore.getState().fetchMembers(data.projectId)
    
    // 사용자에게 알림
    toast.success(`${data.user.name}님이 프로젝트에 참여했습니다`)
  }
}

// 실시간 동기화 훅
export const useRealtimeSync = () => {
  const [isConnected, setIsConnected] = useState(false)
  const realtimeSync = useRef<RealtimeEventSync | null>(null)
  
  useEffect(() => {
    realtimeSync.current = new RealtimeEventSync()
    realtimeSync.current.connect()
    
    return () => {
      realtimeSync.current?.disconnect()
    }
  }, [])
  
  const subscribeToProject = useCallback((projectId: string) => {
    realtimeSync.current?.subscribeToProject(projectId)
  }, [])
  
  const unsubscribeFromProject = useCallback((projectId: string) => {
    realtimeSync.current?.unsubscribeFromProject(projectId)
  }, [])
  
  return {
    isConnected,
    subscribeToProject,
    unsubscribeFromProject,
  }
}
```

---

## 📋 **요약**

이 문서는 바로캘린더의 모바일 및 API 통합 아키텍처를 정의합니다:

### **📱 모바일 최적화**
- **PWA 구현**: 네이티브 앱과 같은 사용자 경험
- **터치 제스처**: 스와이프, 탭, 롱프레스 등 직관적인 제스처
- **반응형 인터페이스**: 모바일 우선 디자인 및 하단 네비게이션

### **🔌 API 통합**
- **GraphQL**: 타입 안전한 API 설계 및 최적화
- **배치 요청**: 여러 요청을 하나로 묶어 성능 향상
- **에러 처리**: 재시도 로직 및 사용자 친화적 에러 메시지

### **🔄 실시간 동기화**
- **WebSocket**: 실시간 이벤트 업데이트 및 프로젝트 동기화
- **자동 재연결**: 네트워크 불안정 시 자동 재연결 및 메시지 큐
- **상태 동기화**: Zustand 스토어와 실시간 데이터 연동
