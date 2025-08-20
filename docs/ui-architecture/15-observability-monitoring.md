# Observability 및 모니터링

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처

---

## 📊 **15. Observability 및 모니터링**

### **15.1 Error Tracking 및 로깅**

**Sentry SDK 통합**
```typescript
// src/lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs'

export const initializeSentry = () => {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: ['localhost', 'barocalendar.com'],
      }),
    ],
    beforeSend(event) {
      // 민감한 정보 필터링
      if (event.request?.headers) {
        delete event.request.headers['authorization']
      }
      return event
    },
  })
}

// GraphQL 에러 추적
export const trackGraphQLError = (error: any, operation: any) => {
  Sentry.captureException(error, {
    tags: {
      type: 'graphql',
      operation: operation.operationName,
    },
    extra: {
      variables: operation.variables,
      query: operation.query.loc?.source.body,
    },
  })
}

// 사용자 액션 추적
export const trackUserAction = (action: string, data?: any) => {
  Sentry.addBreadcrumb({
    category: 'user-action',
    message: action,
    data,
    level: 'info',
  })
}
```

### **15.2 성능 메트릭 수집**

**Core Web Vitals 및 커스텀 메트릭**
```typescript
// src/lib/monitoring/performance.ts
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map()
  
  static initialize() {
    // Core Web Vitals 모니터링
    this.observeLCP()
    this.observeFID()
    this.observeCLS()
    this.observeFCP()
    this.observeTTI()
    
    // 바로캘린더 특화 메트릭
    this.observeCalendarMetrics()
  }
  
  private static observeCalendarMetrics() {
    // 캘린더 뷰 전환 시간
    this.measureViewTransition()
    
    // 이벤트 로딩 시간
    this.measureEventLoading()
    
    // 프로젝트 필터링 시간
    this.measureProjectFiltering()
  }
  
  static recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    this.metrics.get(name)!.push({
      value,
      timestamp: Date.now(),
    })
    
    // 실시간 알림 체크
    this.checkThreshold(name, value)
    
    // Sentry로 메트릭 전송
    this.sendMetricToSentry(name, value)
  }
  
  private static checkThreshold(name: string, value: number) {
    const thresholds: Record<string, number> = {
      'lcp': 2500,
      'fid': 100,
      'cls': 0.1,
      'view-transition': 150,
      'event-loading': 1000,
      'project-filtering': 500,
    }
    
    const threshold = thresholds[name]
    if (threshold && value > threshold) {
      this.emitPerformanceWarning(name, value, threshold)
    }
  }
  
  private static emitPerformanceWarning(metric: string, value: number, threshold: number) {
    // Slack 알림 전송
    this.sendSlackAlert(metric, value, threshold)
    
    // 개발자 콘솔에 경고
    console.warn(
      `Performance threshold exceeded: ${metric} = ${value}ms > ${threshold}ms`
    )
  }
  
  private static async sendSlackAlert(metric: string, value: number, threshold: number) {
    try {
      await fetch('/api/alerts/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: '#alerts',
          text: `🚨 성능 임계치 초과: ${metric} = ${value}ms > ${threshold}ms`,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (error) {
      console.error('Failed to send Slack alert:', error)
    }
  }
}
```

### **15.3 사용자 이벤트 로깅**

**사용자 행동 분석 및 추적**
```typescript
// src/lib/monitoring/analytics.ts
export class UserAnalytics {
  static trackEvent(category: string, action: string, label?: string, value?: number) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      })
    }
    
    // Sentry Breadcrumb
    Sentry.addBreadcrumb({
      category: 'user-action',
      message: `${category}: ${action}`,
      data: { label, value },
      level: 'info',
    })
    
    // 내부 분석 서버
    this.sendToInternalAnalytics(category, action, label, value)
  }
  
  static trackCalendarAction(action: string, data?: any) {
    this.trackEvent('calendar', action, undefined, undefined)
    
    // 추가 컨텍스트 정보
    const context = {
      currentView: useCalendarStore.getState().currentView,
      currentDate: useCalendarStore.getState().currentDate,
      selectedProjects: useProjectStore.getState().selectedProjects,
      ...data,
    }
    
    Sentry.addBreadcrumb({
      category: 'calendar-action',
      message: action,
      data: context,
      level: 'info',
    })
  }
  
  static trackProjectAction(action: string, projectId?: string) {
    this.trackEvent('project', action, projectId)
    
    if (projectId) {
      Sentry.addBreadcrumb({
        category: 'project-action',
        message: action,
        data: { projectId },
        level: 'info',
      })
    }
  }
  
  private static async sendToInternalAnalytics(category: string, action: string, label?: string, value?: number) {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          action,
          label,
          value,
          timestamp: new Date().toISOString(),
          sessionId: this.getSessionId(),
          userId: this.getUserId(),
        }),
      })
    } catch (error) {
      console.error('Failed to send analytics event:', error)
    }
  }
}
```

---

## 📚 **관련 문서**

- [**9. Monitoring & Testing**](./09-monitoring-testing.md)
- [**14. 표준 에러 포맷 및 핸들링**](./14-error-handling.md)

---

## 📝 **문서 상태**

**15번 섹션 분할 완료** ✅
- 15.1 Error Tracking 및 로깅
- 15.2 성능 메트릭 수집
- 15.3 사용자 이벤트 로깅

---

## 🎯 **다음 단계**

이 모니터링 시스템을 기반으로:
1. **Sentry 설정**: 에러 추적 및 성능 모니터링 구성
2. **성능 메트릭**: Core Web Vitals 및 커스텀 메트릭 수집
3. **사용자 분석**: 사용자 행동 패턴 추적 및 분석
4. **알림 시스템**: 임계치 초과 시 자동 알림 설정
