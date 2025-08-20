# 바로캘린더 UI/UX 구현 계획서

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: UX Expert (Sally)
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Ready for Implementation
- **예상 완료일**: 2025년 10월 중순
- **총 소요 기간**: 8주 (56일)

---

## 🎯 **구현 전략 개요**

### **핵심 원칙**
**"기존 Next.js 환경 유지 + 구린 디자인 완전 제거 + ShadCN UI 기반 새 디자인 시스템 구축"**

### **구현 방식**
4주 단계별 체계적 진행으로 점진적 개선

### **성능 목표**
- **뷰 전환 시간**: 150ms 이하 ✅ (기존 달성)
- **초기 로딩 시간**: 모바일 3초, 데스크톱 2초 이하
- **터치 반응성**: 50ms 이하
- **애니메이션 성능**: 60fps 유지

---

## 🗑️ **Phase 1: 기존 코드 정리 및 새 디자인 준비 (Week 1)**

### **1.1 기존 코드 정리 (Day 1-2)**
```bash
# 구린 디자인 컴포넌트 완전 삭제
rm -rf src/components/layout/*
rm -rf src/components/calendar/*
rm -rf src/components/ui/*
rm -rf src/components/__tests__/*

# 폴더 구조는 유지 (비어있음)
mkdir -p src/components/layout
mkdir -p src/components/calendar
mkdir -p src/components/ui
mkdir -p src/components/__tests__
```

**목표**: 기존 구식 디자인 컴포넌트 완전 제거, 깨끗한 상태에서 새로 시작

### **1.2 MCP 서버 및 ShadCN UI 환경 설정 (Day 3-4)**
```bash
# MCP 서버 연결 확인
# list components 호출 성공
# list blocks 호출 성공
# get component demo 호출 성공

# ShadCN UI 블록 분석
# get block calendar-26 - 월/주 뷰 전환 분석
# get block sidebar-02 - 프로젝트 네비게이션 분석
# get block dashboard-01 - 전체 레이아웃 분석
```

**목표**: MCP 서버를 통한 체계적인 ShadCN UI 컴포넌트 및 블록 활용

### **1.3 필요한 ShadCN UI 컴포넌트 설치 (Day 5)**
```bash
# 기본 컴포넌트
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add tabs
npx shadcn@latest add dropdown-menu
npx shadcn@latest add badge
npx shadcn@latest add separator

# 고급 컴포넌트
npx shadcn@latest add calendar
npx shadcn@latest add card
npx shadcn@latest add sheet
npx shadcn@latest add dialog
npx shadcn@latest add scroll-area
npx shadcn@latest add form
```

**목표**: UI 구현에 필요한 모든 ShadCN UI 컴포넌트 준비

---

## 🏗️ **Phase 2: 기본 레이아웃 구현 (Week 1-2)**

### **2.1 디자인 시스템 기반 설정 (Day 6-7)**
```css
/* src/styles/design-tokens.css */
:root {
  /* 색상 팔레트 시스템 */
  --project-blue: #3B82F6;    /* #1: 블루 프로젝트 */
  --project-green: #10B981;   /* #2: 그린 프로젝트 */
  --project-purple: #8B5CF6;  /* #3: 퍼플 프로젝트 */
  --project-orange: #F59E0B;  /* #4: 오렌지 프로젝트 */
  --project-red: #EF4444;     /* #5: 레드 프로젝트 */
  --project-teal: #14B8A6;    /* #6: 틸 프로젝트 */
  --project-pink: #EC4899;    /* #7: 핑크 프로젝트 */
  --project-indigo: #6366F1;  /* #8: 인디고 프로젝트 */
  
  /* 간격 시스템 */
  --spacing-xs: 0.25rem;      /* 4px */
  --spacing-sm: 0.5rem;       /* 8px */
  --spacing-md: 1rem;         /* 16px */
  --spacing-lg: 1.5rem;       /* 24px */
  --spacing-xl: 2rem;         /* 32px */
  --spacing-2xl: 3rem;        /* 48px */
}
```

**목표**: 8가지 프로젝트 색상과 4px 기본 단위 시스템 구축

### **2.2 Header 컴포넌트 구현 (Day 8-9)**
```tsx
// src/components/layout/Header.tsx
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b z-100">
      <div className="flex items-center justify-between h-full px-6">
        {/* 로고 영역 */}
        <div className="text-xl font-bold">바로캘린더</div>
        
        {/* 뷰 전환 탭 */}
        <Tabs defaultValue="month" className="mx-auto">
          <TabsList>
            <TabsTrigger value="month">월 뷰</TabsTrigger>
            <TabsTrigger value="week">주 뷰</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* 사용자 메뉴 */}
        <div className="flex items-center gap-4">
          <Badge variant="secondary">3</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger>사용자</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>프로필</DropdownMenuItem>
              <DropdownMenuItem>설정</DropdownMenuItem>
              <DropdownMenuItem>로그아웃</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
```

**목표**: 로고, 월/주 뷰 전환 탭, 사용자 메뉴가 포함된 헤더 완성

### **2.3 Sidebar 컴포넌트 구현 (Day 10-11)**
```tsx
// src/components/layout/Sidebar.tsx
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-16 bottom-0 w-70 bg-card border-r overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* 프로젝트 목록 */}
        <div className="space-y-3">
          <h3 className="font-semibold">프로젝트</h3>
          <div className="space-y-2">
            {projects.map(project => (
              <div key={project.id} className="flex items-center space-x-3">
                <Checkbox id={project.id} />
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <label htmlFor={project.id}>{project.name}</label>
              </div>
            ))}
          </div>
        </div>
        
        <Separator />
        
        {/* 담당자 필터 */}
        <div className="space-y-3">
          <h3 className="font-semibold">담당자</h3>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="담당자 선택" />
            </SelectTrigger>
            <SelectContent>
              {assignees.map(assignee => (
                <SelectItem key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Separator />
        
        {/* 빠른 액션 */}
        <div className="space-y-2">
          <Button className="w-full">프로젝트 추가</Button>
          <Button variant="outline" className="w-full">설정</Button>
        </div>
      </div>
    </aside>
  );
};
```

**목표**: 프로젝트 목록, 담당자 필터, 빠른 액션이 포함된 사이드바 완성

### **2.4 Layout 컴포넌트 구현 (Day 12)**
```tsx
// src/components/layout/Layout.tsx
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 ml-70 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
```

**목표**: Header + Sidebar + Main 영역이 조화롭게 배치된 레이아웃 완성

---

## 📅 **Phase 3: 캘린더 뷰 구현 (Week 2)**

### **3.1 MonthView 컴포넌트 구현 (Day 13-15)**
```tsx
// src/components/calendar/MonthView.tsx
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';

export const MonthView = () => {
  return (
    <div className="space-y-6">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm">이전 월</Button>
        <h2 className="text-2xl font-bold">2025년 8월</h2>
        <Button variant="outline" size="sm">다음 월</Button>
      </div>
      
      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {/* 요일 헤더 */}
        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
          <div key={day} className="bg-muted p-3 text-center font-medium">
            {day}
          </div>
        ))}
        
        {/* 날짜 셀 */}
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`bg-card p-2 min-h-30 ${
              day.isToday ? 'bg-primary text-primary-foreground' : ''
            }`}
          >
            <div className="text-sm font-medium">{day.date}</div>
            {/* 이벤트 표시 */}
            {day.events.map(event => (
              <Card key={event.id} className="mt-1">
                <CardContent className="p-2 text-xs">
                  {event.title}
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
```

**목표**: 7x6 그리드 레이아웃, 요일 헤더, 날짜 셀, 이벤트 표시가 포함된 월 뷰 완성

### **3.2 WeekView 컴포넌트 구현 (Day 16-18)**
```tsx
// src/components/calendar/WeekView.tsx
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';

export const WeekView = () => {
  return (
    <div className="space-y-6">
      {/* 주 네비게이션 */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm">이전 주</Button>
        <h2 className="text-2xl font-bold">2025년 8월 3주차</h2>
        <Button variant="outline" size="sm">다음 주</Button>
      </div>
      
      {/* 타임라인 그리드 */}
      <ScrollArea className="h-96">
        <div className="grid grid-cols-8 gap-px bg-border rounded-lg overflow-hidden">
          {/* 시간 라벨 */}
          <div className="bg-muted p-2 text-center font-medium">시간</div>
          {weekDays.map(day => (
            <div key={day} className="bg-muted p-2 text-center font-medium">
              {day}
            </div>
          ))}
          
          {/* 시간대별 그리드 */}
          {timeSlots.map(timeSlot => (
            <>
              <div key={timeSlot} className="bg-muted p-2 text-center text-sm">
                {timeSlot}
              </div>
              {weekDays.map(day => (
                <div key={`${day}-${timeSlot}`} className="bg-card p-2 min-h-20 relative">
                  {/* 이벤트 블록 */}
                  {getEventsForTimeSlot(day, timeSlot).map(event => (
                    <Card
                      key={event.id}
                      className="absolute left-1 right-1"
                      style={{
                        top: `${event.startOffset}px`,
                        height: `${event.duration}px`,
                        backgroundColor: event.projectColor
                      }}
                    >
                      <CardContent className="p-1 text-xs text-white">
                        {event.title}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
            </>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
```

**목표**: 24시간 x 7일 타임라인, 시간대별 그리드, 이벤트 블록 배치가 포함된 주 뷰 완성

### **3.3 뷰 전환 기능 구현 (Day 19-21)**
```tsx
// src/contexts/CalendarContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface CalendarContextType {
  currentView: 'month' | 'week';
  selectedDate: Date;
  onViewChange: (view: 'month' | 'week') => void;
  onDateSelect: (date: Date) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  const [currentView, setCurrentView] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleViewChange = (view: 'month' | 'week') => {
    setCurrentView(view);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <CalendarContext.Provider
      value={{
        currentView,
        selectedDate,
        onViewChange: handleViewChange,
        onDateSelect: handleDateSelect,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};
```

**목표**: React Context API를 통한 뷰 전환 상태 관리, 150ms 이하 전환 시간 유지

---

## 🎨 **Phase 4: 스타일링 및 테마 시스템 (Week 3)**

### **4.1 색상 시스템 구현 (Day 22-24)**
```css
/* src/styles/project-colors.css */
.project-color-1 { background-color: var(--project-blue); }
.project-color-2 { background-color: var(--project-green); }
.project-color-3 { background-color: var(--project-purple); }
.project-color-4 { background-color: var(--project-orange); }
.project-color-5 { background-color: var(--project-red); }
.project-color-6 { background-color: var(--project-teal); }
.project-color-7 { background-color: var(--project-pink); }
.project-color-8 { background-color: var(--project-indigo); }

/* 프로젝트별 색상 할당 */
.project-item[data-color="1"] .color-indicator { @apply project-color-1; }
.project-item[data-color="2"] .color-indicator { @apply project-color-2; }
.project-item[data-color="3"] .color-indicator { @apply project-color-3; }
.project-item[data-color="4"] .color-indicator { @apply project-color-4; }
.project-item[data-color="5"] .color-indicator { @apply project-color-5; }
.project-item[data-color="6"] .color-indicator { @apply project-color-6; }
.project-item[data-color="7"] .color-indicator { @apply project-color-7; }
.project-item[data-color="8"] .color-indicator { @apply project-color-8; }
```

**목표**: 8가지 프로젝트 색상 시스템 완성, 프로젝트별 자동 색상 할당

### **4.2 타이포그래피 시스템 구현 (Day 25-26)**
```css
/* src/styles/typography.css */
.text-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); }
.text-heading { font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); }
.text-subheading { font-size: var(--font-size-lg); font-weight: var(--font-weight-medium); }
.text-body { font-size: var(--font-size-base); font-weight: var(--font-weight-normal); }
.text-caption { font-size: var(--font-size-sm); font-weight: var(--font-weight-normal); }
.text-small { font-size: var(--font-size-xs); font-weight: var(--font-weight-normal); }
```

**목표**: Inter 폰트 기반의 일관된 타이포그래피 시스템 구축

### **4.3 간격 시스템 구현 (Day 27)**
```css
/* src/styles/spacing.css */
.space-xs { margin: var(--spacing-xs); padding: var(--spacing-xs); }
.space-sm { margin: var(--spacing-sm); padding: var(--spacing-sm); }
.space-md { margin: var(--spacing-md); padding: var(--spacing-md); }
.space-lg { margin: var(--spacing-lg); padding: var(--spacing-lg); }
.space-xl { margin: var(--spacing-xl); padding: var(--spacing-xl); }
.space-2xl { margin: var(--spacing-2xl); padding: var(--spacing-2xl); }

/* 컴포넌트 간격 */
.component-gap { gap: var(--spacing-md); }
.section-gap { gap: var(--spacing-lg); }
.page-gap { gap: var(--spacing-2xl); }
```

**목표**: 4px 기본 단위 시스템을 활용한 일관된 간격 시스템 구축

---

## 📱 **Phase 5: 반응형 디자인 구현 (Week 3)**

### **5.1 데스크톱 최적화 (Day 28-29)**
```css
/* src/styles/responsive/desktop.css */
@media (min-width: 1200px) {
  .desktop-layout {
    display: grid;
    grid-template-columns: 280px 1fr 320px;
    grid-template-rows: 64px 1fr;
    grid-template-areas:
      "header header header"
      "sidebar main right-panel";
  }
  
  .right-panel {
    display: block;
    position: sticky;
    top: 64px;
    height: calc(100vh - 64px);
    overflow-y: auto;
  }
}
```

**목표**: 1200px+ 화면에서 사이드바 고정, 우측 패널 표시

### **5.2 태블릿 최적화 (Day 30-31)**
```css
/* src/styles/responsive/tablet.css */
@media (min-width: 768px) and (max-width: 1199px) {
  .tablet-layout {
    display: grid;
    grid-template-columns: 240px 1fr;
    grid-template-rows: 64px 1fr;
    grid-template-areas:
      "header header"
      "sidebar main";
  }
  
  .right-panel {
    display: none;
  }
  
  .tablet-sidebar {
    width: 240px;
  }
}
```

**목표**: 768px~1199px 화면에서 사이드바 축소, 우측 패널 숨김

### **5.3 모바일 최적화 (Day 32-35)**
```css
/* src/styles/responsive/mobile.css */
@media (max-width: 767px) {
  .mobile-layout {
    display: flex;
    flex-direction: column;
  }
  
  .mobile-sidebar {
    position: fixed;
    top: 0;
    left: -100%;
    width: 100%;
    max-width: 320px;
    height: 100vh;
    z-index: 300;
    transition: left 300ms ease;
  }
  
  .mobile-sidebar.active {
    left: 0;
  }
  
  .mobile-main {
    margin-left: 0;
    padding: var(--spacing-md);
  }
}
```

**목표**: 320px~767px 화면에서 사이드바 Drawer, 우측 패널 Sheet로 변환

---

## 🔧 **Phase 6: 기능 및 API 연동 (Week 3-4)**

### **6.1 필터링 시스템 구현 (Day 36-38)**
```tsx
// src/components/filters/ProjectFilter.tsx
export const ProjectFilter = () => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  
  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };
  
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">프로젝트 필터</h3>
      <div className="space-y-2">
        {projects.map(project => (
          <div key={project.id} className="flex items-center space-x-3">
            <Checkbox
              id={project.id}
              checked={selectedProjects.includes(project.id)}
              onCheckedChange={() => handleProjectToggle(project.id)}
            />
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <label htmlFor={project.id}>{project.name}</label>
          </div>
        ))}
      </div>
    </div>
  );
};
```

**목표**: 프로젝트별 체크박스 필터, 실시간 필터 적용

### **6.2 API 연동 구현 (Day 39-41)**
```tsx
// src/hooks/useCalendarData.ts
export const useCalendarData = (filters: CalendarFilters) => {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/timeline', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
```

**목표**: 백엔드 API 연동, 에러 처리 및 로딩 상태 관리

### **6.3 상태 관리 구현 (Day 42)**
```tsx
// src/contexts/FilterContext.tsx
interface FilterContextType {
  filters: CalendarFilters;
  updateFilters: (newFilters: Partial<CalendarFilters>) => void;
  resetFilters: () => void;
}

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<CalendarFilters>({
    projects: [],
    assignees: [],
    dateRange: { from: new Date(), to: new Date() },
  });

  const updateFilters = (newFilters: Partial<CalendarFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      projects: [],
      assignees: [],
      dateRange: { from: new Date(), to: new Date() },
    });
  };

  return (
    <FilterContext.Provider value={{ filters, updateFilters, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
};
```

**목표**: React Context API를 통한 필터 상태 관리

---

## 🧪 **Phase 7: 테스트 및 품질 검증 (Week 4)**

### **7.1 단위 테스트 (Day 43-45)**
```tsx
// src/components/__tests__/Header.test.tsx
describe('Header Component', () => {
  it('renders correctly', () => {
    render(<Header />);
    expect(screen.getByText('바로캘린더')).toBeInTheDocument();
    expect(screen.getByText('월 뷰')).toBeInTheDocument();
    expect(screen.getByText('주 뷰')).toBeInTheDocument();
  });

  it('handles view switching', () => {
    render(<Header />);
    const weekViewTab = screen.getByText('주 뷰');
    fireEvent.click(weekViewTab);
    expect(weekViewTab).toHaveAttribute('data-state', 'active');
  });
});
```

**목표**: 각 컴포넌트별 독립적 테스트, 렌더링 및 상호작용 검증

### **7.2 통합 테스트 (Day 46-48)**
```tsx
// src/components/__tests__/Calendar.integration.test.tsx
describe('Calendar Integration', () => {
  it('switches between month and week views', async () => {
    render(
      <CalendarProvider>
        <Calendar />
      </CalendarProvider>
    );
    
    const weekViewTab = screen.getByText('주 뷰');
    fireEvent.click(weekViewTab);
    
    await waitFor(() => {
      expect(screen.getByTestId('week-view')).toBeInTheDocument();
    });
  });
});
```

**목표**: 컴포넌트 간 상호작용, 뷰 전환 기능 검증

### **7.3 성능 테스트 (Day 49)**
```tsx
// src/tests/performance/view-transition.test.ts
describe('View Transition Performance', () => {
  it('completes view transition within 150ms', async () => {
    const startTime = performance.now();
    
    // 뷰 전환 실행
    fireEvent.click(screen.getByText('주 뷰'));
    
    await waitFor(() => {
      expect(screen.getByTestId('week-view')).toBeInTheDocument();
    });
    
    const endTime = performance.now();
    const transitionTime = endTime - startTime;
    
    expect(transitionTime).toBeLessThan(150);
  });
});
```

**목표**: 뷰 전환 시간 150ms 이하 달성 확인

---

## 🎯 **Phase 8: 최종 검증 및 배포 (Week 4)**

### **8.1 UI/UX 검증 (Day 50-51)**
```tsx
// src/tests/accessibility/accessibility.test.ts
describe('Accessibility', () => {
  it('meets WCAG AA standards', async () => {
    const { container } = render(<Calendar />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('supports keyboard navigation', () => {
    render(<Calendar />);
    
    // Tab 순서 테스트
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    for (let i = 0; i < focusableElements.length; i++) {
      const element = focusableElements[i] as HTMLElement;
      element.focus();
      expect(document.activeElement).toBe(element);
    }
  });
});
```

**목표**: 접근성 기준 충족, 키보드 네비게이션 지원 확인

### **8.2 크로스 브라우저 테스트 (Day 52)**
```bash
# 브라우저 호환성 테스트
npm run test:browser

# 지원 브라우저
- Chrome (최신 2개 버전)
- Firefox (최신 2개 버전)
- Safari (최신 2개 버전)
- Edge (최신 2개 버전)
```

**목표**: 모든 지원 브라우저에서 정상 작동 확인

### **8.3 최종 배포 준비 (Day 53-56)**
```bash
# 빌드 최적화
npm run build

# 번들 분석
npm run analyze

# 성능 검증
npm run lighthouse

# 최종 테스트
npm run test:all
```

**목표**: 빌드 최적화, 번들 크기 최적화, 모든 테스트 통과

---

## 📊 **구현 일정 요약**

| Phase | 기간 | 주요 작업 | 완성 목표 |
|-------|------|-----------|-----------|
| **Phase 1** | Week 1 | 기존 코드 정리 + 환경 설정 | 깨끗한 개발 환경 |
| **Phase 2** | Week 1-2 | 기본 레이아웃 구현 | Header + Sidebar + Layout |
| **Phase 3** | Week 2 | 캘린더 뷰 구현 | MonthView + WeekView + 전환 |
| **Phase 4** | Week 3 | 스타일링 시스템 | 색상 + 타이포그래피 + 간격 |
| **Phase 5** | Week 3 | 반응형 디자인 | 데스크톱/태블릿/모바일 |
| **Phase 6** | Week 3-4 | 기능 및 API 연동 | 필터링 + API + 상태 관리 |
| **Phase 7** | Week 4 | 테스트 및 품질 검증 | 단위/통합/성능 테스트 |
| **Phase 8** | Week 4 | 최종 검증 및 배포 | 접근성 + 브라우저 + 배포 |

**총 소요 기간**: 8주 (56일)  
**예상 완료일**: 2025년 10월 중순  
**핵심 마일스톤**: 150ms 이하 뷰 전환, 100% 반응형 지원, WCAG AA 기준 준수

---

## 🚀 **즉시 실행 가능한 다음 단계**

### **1단계: 기존 코드 정리 시작**
```bash
# 구린 디자인 컴포넌트 삭제
rm -rf src/components/layout/*
rm -rf src/components/calendar/*
rm -rf src/components/ui/*
rm -rf src/components/__tests__/*
```

### **2단계: ShadCN UI 컴포넌트 설치**
```bash
npx shadcn@latest add button input select checkbox tabs
npx shadcn@latest add calendar card sheet dialog scroll-area
```

### **3단계: 디자인 토큰 시스템 구축**
```bash
# src/styles/design-tokens.css 파일 생성
# 색상, 타이포그래피, 간격 시스템 정의
```

---

## 📝 **Change Log**

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-19 | 1.0 | 초기 구현 계획서 작성 완성 | UX Expert (Sally) |

---

## 🎯 **다음 단계**

이 구현 계획서가 완성되었습니다. 다음 단계는:

1. **기존 코드 정리 시작** - 구린 디자인 컴포넌트 삭제
2. **ShadCN UI 환경 설정** - 필요한 컴포넌트 설치
3. **Phase 1 실행** - 기존 코드 정리 및 환경 설정
4. **Phase 2 실행** - 기본 레이아웃 구현

---

**문서 상태**: ✅ **완성 (Ready for Implementation)**  
**다음 검토일**: 구현 시작 후 Phase 1 완료 시
