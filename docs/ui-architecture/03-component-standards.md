# Component Standards

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처

---

## 🧩 **3. Component Standards**

### **3.1 ShadCN UI 기반 컴포넌트 전략**

**MCP 서버 우선 사용 원칙**
- **컴포넌트 목록**: `mcp_shadcn-ui-mcp_list_components`
- **블록 목록**: `mcp_shadcn-ui-mcp_list_blocks`
- **데모 코드**: `mcp_shadcn-ui-mcp_get_component_demo`
- **블록 소스**: `mcp_shadcn-ui-mcp_get_block`

**사용 가능한 ShadCN UI 컴포넌트 (46개)**
```typescript
// 기본 UI 컴포넌트
const shadcnComponents = [
  'button', 'input', 'select', 'checkbox', 'tabs',
  'calendar', 'card', 'dialog', 'sheet', 'scroll-area',
  'badge', 'separator', 'form', 'label', 'textarea'
]
```

**우선 사용할 ShadCN UI Blocks**
- **Calendar**: `calendar-26.tsx` (4,362 bytes) - 월/주 뷰 전환
- **Sidebar**: `sidebar-02.tsx` - 네비게이션 사이드바
- **Dashboard**: `dashboard-01.tsx` - 메인 레이아웃

### **3.2 컴포넌트 생성 패턴**

**1. Compound Component Pattern**
```typescript
// src/components/ui/tabs.tsx
interface TabsProps {
  children: React.ReactNode
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  disabled?: boolean
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
}

export const Tabs: React.FC<TabsProps> & {
  List: React.FC<TabsListProps>
  Trigger: React.FC<TabsTriggerProps>
  Content: React.FC<TabsContentProps>
} = ({ children, ...props }) => {
  // 구현 생략
}

Tabs.List = TabsList
Tabs.Trigger = TabsTrigger
Tabs.Content = TabsContent
```

**2. Render Props Pattern**
```typescript
// src/components/common/DataFetcher.tsx
interface DataFetcherProps<T> {
  url: string
  children: (data: T[], loading: boolean, error: string | null) => React.ReactNode
}

export const DataFetcher = <T,>({ url, children }: DataFetcherProps<T>) => {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [url])

  return <>{children(data, loading, error)}</>
}
```

**3. Custom Hook Pattern**
```typescript
// src/hooks/useCalendar.ts
export const useCalendar = () => {
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])

  const goToDate = useCallback((date: Date) => {
    setCurrentDate(date)
  }, [])

  const addEvent = useCallback(async (event: CreateEventDto) => {
    // 이벤트 추가 로직
  }, [])

  return {
    currentView,
    setCurrentView,
    currentDate,
    goToDate,
    events,
    addEvent
  }
}
```

**4. Higher-Order Component (HOC) Pattern**
```typescript
// src/components/common/withPerformance.tsx
interface WithPerformanceProps {
  componentName: string
}

export const withPerformance = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  return (props: P) => {
    const startTime = useRef(performance.now())
    
    useEffect(() => {
      const endTime = performance.now()
      const renderTime = endTime - startTime.current
      
      if (renderTime > 16.67) { // 60fps 기준
        console.warn(`${componentName} 렌더링 시간: ${renderTime.toFixed(2)}ms`)
      }
    })

    return <WrappedComponent {...props} />
  }
}
```

**5. Error Boundary Pattern**
```typescript
// src/components/common/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
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
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    
    // 에러 로깅 서비스로 전송
    this.logError(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>문제가 발생했습니다</h2>
          <p>페이지를 새로고침해주세요</p>
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

### **3.3 컴포넌트 성능 최적화**

**React.memo를 활용한 불필요한 리렌더링 방지**
```typescript
// src/components/calendar/EventCard.tsx
interface EventCardProps {
  event: CalendarEvent
  onEdit: (event: CalendarEvent) => void
  onDelete: (eventId: string) => void
}

export const EventCard = React.memo<EventCardProps>(({ event, onEdit, onDelete }) => {
  const handleEdit = useCallback(() => {
    onEdit(event)
  }, [event, onEdit])

  const handleDelete = useCallback(() => {
    onDelete(event.id)
  }, [event.id, onDelete])

  return (
    <div className="event-card">
      <h3>{event.title}</h3>
      <p>{event.description}</p>
      <div className="event-actions">
        <button onClick={handleEdit}>편집</button>
        <button onClick={handleDelete}>삭제</button>
      </div>
    </div>
  )
})

EventCard.displayName = 'EventCard'
```

**useMemo를 활용한 계산 최적화**
```typescript
// src/components/calendar/CalendarGrid.tsx
export const CalendarGrid: React.FC<CalendarGridProps> = ({ events, currentDate }) => {
  const calendarDays = useMemo(() => {
    return generateCalendarDays(currentDate)
  }, [currentDate])

  const filteredEvents = useMemo(() => {
    return filterEventsByDate(events, currentDate)
  }, [events, currentDate])

  const eventGroups = useMemo(() => {
    return groupEventsByDate(filteredEvents)
  }, [filteredEvents])

  return (
    <div className="calendar-grid">
      {calendarDays.map(day => (
        <CalendarDay
          key={day.toISOString()}
          day={day}
          events={eventGroups[day.toISOString()] || []}
        />
      ))}
    </div>
  )
}
```

### **3.4 컴포넌트 접근성**

**ARIA 속성 및 키보드 네비게이션**
```typescript
// src/components/ui/AccessibleButton.tsx
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    children, 
    variant = 'default', 
    size = 'default', 
    loading = false,
    leftIcon,
    rightIcon,
    className,
    disabled,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading
    
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          // variant 및 size 스타일 클래스들
          className
        )}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <span className="mr-2" aria-hidden="true">
            <LoadingSpinner size="sm" />
          </span>
        )}
        
        {leftIcon && (
          <span className="mr-2" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        <span className={loading ? 'sr-only' : ''}>
          {children}
        </span>
        
        {rightIcon && (
          <span className="ml-2" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    )
  }
)

AccessibleButton.displayName = 'AccessibleButton'
```

---

## 📚 **관련 문서**

- [**2. Project Structure**](./02-project-structure.md) - 프로젝트 구조 및 명명 규칙
- [**4. State Management**](./04-state-management.md) - 상태 관리 전략 및 구현
- [**5. Styling Strategy**](./05-styling-strategy.md) - 스타일링 전략 및 테마 시스템

---

## 🎯 **다음 단계**

이 컴포넌트 표준을 기반으로:

1. **상태 관리 전략**: 4번 섹션 참조
2. **스타일링 전략**: 5번 섹션 참조
3. **성능 최적화**: 6번 섹션 참조

**개발팀이 일관된 컴포넌트 패턴으로 작업할 수 있는 기반이 마련되었습니다!** 🚀
