# Performance Optimization

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처

---

## ⚡ **6. Performance Optimization**

### **6.1 Core Web Vitals 목표**

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

### **6.2 번들 최적화 및 코드 스플리팅**

#### **Next.js 번들 최적화**
```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // 번들 분석
      config.plugins.push(
        new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      )
      
      // 코드 스플리팅 최적화
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'initial',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'async',
            priority: 5,
            reuseExistingChunk: true,
          },
          calendar: {
            name: 'calendar',
            test: /[\\/]src[\\/]components[\\/]calendar[\\/]/,
            chunks: 'async',
            priority: 20,
          },
          projects: {
            name: 'projects',
            test: /[\\/]src[\\/]components[\\/]projects[\\/]/,
            chunks: 'async',
            priority: 20,
          },
        },
      }
    }
    return config
  },
  // 이미지 최적화
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}

export default nextConfig
```

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

### **6.3 가상 스크롤링 및 메모리 최적화**

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

### **6.4 이미지 및 미디어 최적화**

#### **Next.js Image 컴포넌트 최적화**
```typescript
// src/components/ui/OptimizedImage.tsx
import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  
  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground',
          className
        )}
        style={{ width, height }}
      >
        <span className="text-sm">이미지를 불러올 수 없습니다</span>
      </div>
    )
  }
  
  return (
    <div className="relative">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={() => setIsLoading(false)}
        onError={() => setError(true)}
      />
      
      {isLoading && (
        <div
          className="absolute inset-0 bg-muted animate-pulse"
          style={{ width, height }}
        />
      )}
    </div>
  )
}
```

#### **미디어 지연 로딩**
```typescript
// src/hooks/useIntersectionObserver.ts
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [ref, setRef] = useState<HTMLElement | null>(null)
  
  useEffect(() => {
    if (!ref) return
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)
    
    observer.observe(ref)
    
    return () => observer.disconnect()
  }, [ref, options])
  
  return { ref: setRef, isIntersecting }
}

// 이미지 지연 로딩에 적용
export const LazyImage = ({ src, alt, ...props }: OptimizedImageProps) => {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  })
  
  if (!isIntersecting) {
    return (
      <div
        ref={ref}
        className="bg-muted animate-pulse"
        style={{ width: props.width, height: props.height }}
      />
    )
  }
  
  return <OptimizedImage ref={ref} src={src} alt={alt} {...props} />
}
```

### **6.5 서비스 워커 및 오프라인 최적화**

#### **서비스 워커 설정**
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

#### **오프라인 상태 관리**
```typescript
// src/hooks/useOfflineStatus.ts
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [offlineQueue, setOfflineQueue] = useState<any[]>([])
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // 오프라인 큐 처리
      processOfflineQueue()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  const addToOfflineQueue = useCallback((action: any) => {
    setOfflineQueue(prev => [...prev, action])
  }, [])
  
  const processOfflineQueue = useCallback(async () => {
    if (offlineQueue.length === 0) return
    
    for (const action of offlineQueue) {
      try {
        await executeAction(action)
      } catch (error) {
        console.error('Failed to process offline action:', error)
      }
    }
    
    setOfflineQueue([])
  }, [offlineQueue])
  
  return {
    isOnline,
    offlineQueue,
    addToOfflineQueue,
    processOfflineQueue,
  }
}
```

### **6.6 성능 모니터링 및 분석**

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

---

## 📚 **관련 문서**

- [**5. Styling Strategy**](./05-styling-strategy.md) - 스타일링 전략 및 테마 시스템
- [**7. Security & Accessibility**](./07-security-accessibility.md) - 보안 및 접근성 구현
- [**9. Monitoring & Testing**](./09-monitoring-testing.md) - 성능 모니터링 및 분석

---

## 🎯 **다음 단계**

이 성능 최적화 전략을 기반으로:

1. **보안 및 접근성**: 7번 섹션 참조
2. **모바일 및 API**: 8번 섹션 참조
3. **모니터링 및 테스트**: 9번 섹션 참조

**개발팀이 고성능 애플리케이션을 구현할 수 있는 기반이 마련되었습니다!** 🚀
