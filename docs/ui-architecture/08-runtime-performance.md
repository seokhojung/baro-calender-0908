# Runtime Performance Optimization

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처

---

## ⚡ **6a. Runtime Performance Optimization**

### **6a.1 Core Web Vitals 목표**

**성능 목표**: **150ms 이하 뷰 전환, 60fps 애니메이션**

#### **Core Web Vitals 기준**
```typescript
// src/lib/performance/metrics.ts
interface PerformanceMetrics {
  // Largest Contentful Paint (LCP)
  lcp: number // 목표: 2.5초 이하
  
  // First Input Delay (FID)
  fid: number // 목표: 100ms 이하
  
  // Cumulative Layout Shift (CLS)
  cls: number // 목표: 0.1 이하
  
  // First Contentful Paint (FCP)
  fcp: number // 목표: 1.8초 이하
  
  // Time to Interactive (TTI)
  tti: number // 목표: 3.8초 이하
}

// 성능 모니터링
export const measurePerformance = (): PerformanceMetrics => {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      switch (entry.entryType) {
        case 'largest-contentful-paint':
          console.log('LCP:', entry.startTime)
          break
        case 'first-input':
          console.log('FID:', entry.processingStart - entry.startTime)
          break
        case 'layout-shift':
          console.log('CLS:', entry.value)
          break
      }
    }
  })
  
  observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
  
  return {
    lcp: 0,
    fid: 0,
    cls: 0,
    fcp: 0,
    tti: 0,
  }
}
```

#### **성능 목표 설정**
```typescript
// src/lib/performance/goals.ts
export const PERFORMANCE_GOALS = {
  // Core Web Vitals
  lcp: 2500,    // 2.5초
  fid: 100,     // 100ms
  cls: 0.1,     // 0.1
  
  // 추가 성능 지표
  fcp: 1800,    // 1.8초
  tti: 3800,    // 3.8초
  
  // 애플리케이션 특화 지표
  viewTransition: 150,  // 150ms
  animationFrameRate: 60, // 60fps
  bundleSize: 250,       // 250KB (gzipped)
  
  // 사용자 경험 지표
  timeToFirstEvent: 1000, // 1초
  interactionResponse: 100, // 100ms
} as const

export const checkPerformanceGoal = (
  metric: keyof typeof PERFORMANCE_GOALS,
  value: number
): boolean => {
  const goal = PERFORMANCE_GOALS[metric]
  return value <= goal
}
```

### **6a.2 코드 스플리팅 및 레이지 로딩**

#### **동적 임포트 및 레이지 로딩**
```typescript
// src/components/calendar/CalendarContainer.tsx
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// 레이지 로딩 컴포넌트
const MonthView = dynamic(() => import('./MonthView'), {
  loading: () => <CalendarSkeleton />,
  ssr: false,
})

const WeekView = dynamic(() => import('./WeekView'), {
  loading: () => <CalendarSkeleton />,
  ssr: false,
})

const DayView = dynamic(() => import('./DayView'), {
  loading: () => <CalendarSkeleton />,
  ssr: false,
})

// 캘린더 뷰 전환 시 동적 로딩
export const CalendarContainer = () => {
  const { currentView } = useCalendarStore()
  
  const renderView = () => {
    switch (currentView) {
      case 'month':
        return (
          <Suspense fallback={<CalendarSkeleton />}>
            <MonthView />
          </Suspense>
        )
      case 'week':
        return (
          <Suspense fallback={<CalendarSkeleton />}>
            <WeekView />
          </Suspense>
        )
      case 'day':
        return (
          <Suspense fallback={<CalendarSkeleton />}>
            <DayView />
          </Suspense>
        )
      default:
        return <MonthView />
    }
  }
  
  return (
    <div className="calendar-container">
      {renderView()}
    </div>
  )
}
```

#### **지능적 프리로딩**
```typescript
// src/hooks/usePreloadComponents.ts
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const PRELOAD_ROUTES = {
  '/calendar': {
    components: ['MonthView', 'WeekView', 'DayView'],
    priority: 'high',
  },
  '/projects': {
    components: ['ProjectList', 'ProjectDetail'],
    priority: 'medium',
  },
} as const

export const usePreloadComponents = () => {
  const router = useRouter()
  
  useEffect(() => {
    const currentRoute = router.pathname
    const preloadConfig = PRELOAD_ROUTES[currentRoute as keyof typeof PRELOAD_ROUTES]
    
    if (preloadConfig) {
      preloadConfig.components.forEach((componentName) => {
        // 사용자 상호작용이 있을 때 프리로딩
        const preloadTimer = setTimeout(() => {
          import(`../components/${componentName}`)
            .then(() => console.log(`Preloaded: ${componentName}`))
            .catch(() => console.warn(`Failed to preload: ${componentName}`))
        }, preloadConfig.priority === 'high' ? 100 : 1000)
        
        return () => clearTimeout(preloadTimer)
      })
    }
  }, [router.pathname])
}
```

### **6a.3 가상 스크롤링 및 메모리 최적화**

#### **가상 스크롤링 구현**
```typescript
// src/components/common/VirtualList.tsx
import { useVirtualizer } from '@tanstack/react-virtual'

interface VirtualListProps<T> {
  items: T[]
  height: number
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
}

export const VirtualList = <T,>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5,
}: VirtualListProps<T>) => {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  })
  
  return (
    <div
      ref={parentRef}
      className="virtual-list"
      style={{
        height,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${itemHeight}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  )
}

// 캘린더 이벤트 리스트에 적용
export const EventList = ({ events }: { events: CalendarEvent[] }) => {
  return (
    <VirtualList
      items={events}
      height={400}
      itemHeight={60}
      renderItem={(event, index) => (
        <EventCard key={event.id} event={event} />
      )}
    />
  )
}
```

#### **메모이제이션 최적화**
```typescript
// src/hooks/useCalendarMemo.ts
import { useMemo, useCallback } from 'react'

export const useCalendarMemo = (events: CalendarEvent[], selectedDate: Date) => {
  // 이벤트 필터링 메모이제이션
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate.toDateString() === selectedDate.toDateString()
    })
  }, [events, selectedDate])
  
  // 월별 이벤트 그루핑 메모이제이션
  const groupedEvents = useMemo(() => {
    return filteredEvents.reduce((groups, event) => {
      const key = event.category
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(event)
      return groups
    }, {} as Record<string, CalendarEvent[]>)
  }, [filteredEvents])
  
  // 이벤트 핸들러 메모이제이션
  const handleEventClick = useCallback((eventId: string) => {
    // 이벤트 클릭 처리
  }, [])
  
  return {
    filteredEvents,
    groupedEvents,
    handleEventClick,
  }
}
```

#### **메모리 누수 방지**
```typescript
// src/hooks/useMemoryOptimization.ts
export const useMemoryOptimization = () => {
  const cleanupRefs = useRef<(() => void)[]>([])
  
  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupRefs.current.push(cleanup)
  }, [])
  
  const cleanup = useCallback(() => {
    cleanupRefs.current.forEach(fn => fn())
    cleanupRefs.current = []
  }, [])
  
  useEffect(() => {
    return cleanup
  }, [cleanup])
  
  return { addCleanup, cleanup }
}

// 컴포넌트에서 사용
export const CalendarView = () => {
  const { addCleanup } = useMemoryOptimization()
  
  useEffect(() => {
    const interval = setInterval(() => {
      // 주기적 업데이트
    }, 1000)
    
    addCleanup(() => clearInterval(interval))
    
    return () => clearInterval(interval)
  }, [addCleanup])
  
  // ... 컴포넌트 로직
}
```

### **6a.4 렌더링 성능 최적화**

#### **React 렌더링 최적화**
```typescript
// src/components/calendar/OptimizedCalendar.tsx
import { memo, useMemo, useCallback } from 'react'

interface CalendarProps {
  events: CalendarEvent[]
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

export const OptimizedCalendar = memo<CalendarProps>(({
  events,
  selectedDate,
  onDateSelect,
}) => {
  // 렌더링 최적화를 위한 계산된 값
  const calendarData = useMemo(() => {
    return generateCalendarData(selectedDate, events)
  }, [selectedDate, events])
  
  // 콜백 메모이제이션
  const handleDateClick = useCallback((date: Date) => {
    onDateSelect(date)
  }, [onDateSelect])
  
  return (
    <div className="calendar-grid">
      {calendarData.map((week, weekIndex) => (
        <CalendarWeek
          key={weekIndex}
          week={week}
          onDateClick={handleDateClick}
        />
      ))}
    </div>
  )
}, (prevProps, nextProps) => {
  // 커스텀 비교 함수
  return (
    prevProps.selectedDate.getTime() === nextProps.selectedDate.getTime() &&
    prevProps.events.length === nextProps.events.length
  )
})

// 주별 컴포넌트 최적화
const CalendarWeek = memo<{
  week: CalendarDay[]
  onDateClick: (date: Date) => void
}>(({ week, onDateClick }) => {
  return (
    <div className="calendar-week">
      {week.map((day) => (
        <CalendarDay
          key={day.date.toISOString()}
          day={day}
          onClick={onDateClick}
        />
      ))}
    </div>
  )
})
```

#### **애니메이션 최적화**
```typescript
// src/hooks/useOptimizedAnimation.ts
import { useSpring, useTransition } from '@react-spring/web'

export const useOptimizedAnimation = () => {
  // GPU 가속 애니메이션 사용
  const fadeInOut = useSpring({
    opacity: 1,
    transform: 'translateY(0px)',
    from: { opacity: 0, transform: 'translateY(20px)' },
    config: {
      tension: 300,
      friction: 30,
    },
  })
  
  // 리스트 전환 애니메이션
  const listTransition = useTransition(items, {
    from: { opacity: 0, transform: 'scale(0.8)' },
    enter: { opacity: 1, transform: 'scale(1)' },
    leave: { opacity: 0, transform: 'scale(0.8)' },
    config: {
      tension: 200,
      friction: 25,
    },
  })
  
  return { fadeInOut, listTransition }
}

// CSS-in-JS 최적화
const optimizedStyles = {
  // GPU 레이어 생성
  container: {
    willChange: 'transform',
    transform: 'translateZ(0)',
  },
  
  // 하드웨어 가속 활용
  animated: {
    transform: 'translate3d(0, 0, 0)',
    backfaceVisibility: 'hidden',
    perspective: 1000,
  },
}
```

### **6a.5 성능 모니터링 및 분석**

#### **성능 메트릭 수집**
```typescript
// src/lib/performance/analytics.ts
export class PerformanceAnalytics {
  private static metrics: Map<string, number[]> = new Map()
  
  static recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    this.metrics.get(name)!.push(value)
    
    // 실시간 알림
    this.checkThreshold(name, value)
  }
  
  static getAverageMetric(name: string): number {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) return 0
    
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }
  
  static getMetricsReport() {
    const report: Record<string, { average: number; count: number; min: number; max: number }> = {}
    
    for (const [name, values] of this.metrics.entries()) {
      report[name] = {
        average: this.getAverageMetric(name),
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      }
    }
    
    return report
  }
  
  private static checkThreshold(name: string, value: number) {
    const thresholds: Record<string, number> = {
      'lcp': 2500,
      'fid': 100,
      'cls': 0.1,
      'view-transition': 150,
    }
    
    const threshold = thresholds[name]
    if (threshold && value > threshold) {
      console.warn(`Performance threshold exceeded: ${name} = ${value}ms`)
      
      // 성능 이벤트 발생
      this.emitPerformanceEvent(name, value, threshold)
    }
  }
  
  private static emitPerformanceEvent(metric: string, value: number, threshold: number) {
    const event = new CustomEvent('performance-warning', {
      detail: { metric, value, threshold }
    })
    window.dispatchEvent(event)
  }
}

// 사용 예시
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    const handlePerformanceWarning = (event: CustomEvent) => {
      const { metric, value, threshold } = event.detail
      
      // 사용자에게 알림
      toast.warning(`${metric} 성능이 목표치를 초과했습니다: ${value}ms > ${threshold}ms`)
    }
    
    window.addEventListener('performance-warning', handlePerformanceWarning as EventListener)
    
    return () => {
      window.removeEventListener('performance-warning', handlePerformanceWarning as EventListener)
    }
  }, [])
}
```

#### **실시간 성능 프로파일링**
```typescript
// src/lib/performance/profiler.ts
export class RuntimeProfiler {
  private static measurements: Map<string, { start: number; end?: number }> = new Map()
  
  static startMeasurement(name: string) {
    this.measurements.set(name, { start: performance.now() })
  }
  
  static endMeasurement(name: string): number {
    const measurement = this.measurements.get(name)
    if (!measurement) {
      console.warn(`No measurement found for: ${name}`)
      return 0
    }
    
    const end = performance.now()
    const duration = end - measurement.start
    
    measurement.end = end
    PerformanceAnalytics.recordMetric(name, duration)
    
    return duration
  }
  
  static measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startMeasurement(name)
    return fn().finally(() => {
      this.endMeasurement(name)
    })
  }
  
  static measureSync<T>(name: string, fn: () => T): T {
    this.startMeasurement(name)
    try {
      return fn()
    } finally {
      this.endMeasurement(name)
    }
  }
}

// 컴포넌트 렌더링 시간 측정
export const withPerformanceProfiler = <P extends object>(
  Component: React.ComponentType<P>,
  name?: string
) => {
  const WrappedComponent = (props: P) => {
    const componentName = name || Component.displayName || Component.name
    
    useEffect(() => {
      RuntimeProfiler.startMeasurement(`${componentName}-render`)
      
      return () => {
        RuntimeProfiler.endMeasurement(`${componentName}-render`)
      }
    })
    
    return <Component {...props} />
  }
  
  WrappedComponent.displayName = `withPerformanceProfiler(${Component.displayName || Component.name})`
  
  return WrappedComponent
}
```

---

## 📚 **관련 문서**

- [**06b-build-bundle-optimization.md**](./06b-build-bundle-optimization.md) - 빌드 및 번들 최적화
- [**05-styling-strategy.md**](./05-styling-strategy.md) - 스타일링 전략 및 테마 시스템
- [**09-monitoring-testing.md**](./09-monitoring-testing.md) - 성능 모니터링 및 분석

---

## 🎯 **요약**

이 런타임 성능 최적화 문서에서는 다음과 같은 핵심 영역을 다뤘습니다:

1. **Core Web Vitals 목표 설정**: LCP, FID, CLS 등 핵심 성능 지표 정의
2. **코드 스플리팅 및 레이지 로딩**: 동적 임포트와 지능적 프리로딩으로 초기 로딩 시간 단축
3. **가상 스크롤링**: 대용량 데이터 처리를 위한 가상화 기술
4. **메모이제이션**: React.memo, useMemo, useCallback을 활용한 불필요한 렌더링 방지
5. **메모리 최적화**: 메모리 누수 방지 및 정리 작업 자동화
6. **성능 모니터링**: 실시간 성능 메트릭 수집 및 임계값 알림

**바로캘린더 애플리케이션의 런타임 성능을 최적화하여 사용자 경험을 향상시키는 기반이 마련되었습니다!** ⚡