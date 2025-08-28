# 📱 **8a. PWA & Mobile Responsive Design**

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처 - PWA 및 모바일 반응형 디자인

---

## 🎯 **개요**

이 문서는 바로캘린더 프로젝트의 **Progressive Web App (PWA) 구현 및 모바일 반응형 디자인** 아키텍처를 정의합니다. 네이티브 앱과 같은 사용자 경험을 제공하고 모든 디바이스에서 최적화된 인터페이스를 구현합니다.

---

## 📱 **PWA 구현**

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

## 📱 **모바일 터치 제스처**

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
```

---

## 📱 **반응형 모바일 인터페이스**

### **모바일 네비게이션 컴포넌트**
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
```

### **모바일 캘린더 뷰 적용**
```typescript
// src/components/mobile/MobileCalendarView.tsx
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

---

## 📋 **요약**

이 문서는 바로캘린더의 PWA 구현 및 모바일 반응형 디자인을 정의합니다:

### **📱 PWA 기능**
- **오프라인 지원**: 서비스 워커를 통한 캐싱 전략
- **앱 설치**: 홈 화면 추가 및 앱 스토어 같은 경험
- **푸시 알림**: 실시간 알림 지원

### **🎯 터치 제스처**
- **스와이프**: 뷰 전환 및 탐색
- **탭/더블탭**: 빠른 액션 실행
- **롱프레스**: 컨텍스트 메뉴 표시

### **📐 반응형 디자인**
- **모바일 우선**: 작은 화면 최적화
- **하단 네비게이션**: 엄지 손가락 도달 영역 고려
- **적응형 레이아웃**: 화면 크기에 따른 자동 조정