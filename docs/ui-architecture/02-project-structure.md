# Project Structure

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처

---

## 🏗️ **2. Project Structure**

### **2.1 폴더 구조**

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # 인증 관련 라우트 그룹
│   │   ├── login/
│   │   └── register/
│   ├── calendar/                 # 캘린더 메인 페이지
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── projects/                 # 프로젝트 관리
│   ├── settings/                 # 사용자 설정
│   ├── globals.css               # 전역 스타일
│   ├── layout.tsx                # 루트 레이아웃
│   └── page.tsx                  # 홈페이지
├── components/                    # 재사용 가능한 컴포넌트
│   ├── ui/                       # ShadCN UI 기본 컴포넌트
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── checkbox.tsx
│   │   ├── tabs.tsx
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx
│   │   ├── scroll-area.tsx
│   │   ├── badge.tsx
│   │   ├── separator.tsx
│   │   ├── form.tsx
│   │   ├── label.tsx
│   │   ├── textarea.tsx
│   │   └── index.ts
│   ├── calendar/                  # 캘린더 전용 컴포넌트
│   │   ├── CalendarContainer.tsx  # calendar-26.tsx 기반
│   │   ├── MonthView.tsx
│   │   ├── WeekView.tsx
│   │   ├── DayView.tsx
│   │   ├── EventCard.tsx
│   │   ├── EventForm.tsx
│   │   └── EventList.tsx
│   ├── layout/                    # 레이아웃 컴포넌트
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx           # sidebar-02.tsx 기반
│   │   ├── Layout.tsx            # dashboard-01.tsx 기반
│   │   ├── Navigation.tsx
│   │   └── Footer.tsx
│   ├── forms/                     # 폼 컴포넌트
│   │   ├── EventForm.tsx
│   │   ├── ProjectForm.tsx
│   │   └── UserForm.tsx
│   └── common/                    # 공통 컴포넌트
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       ├── ConfirmDialog.tsx
│       └── Toast.tsx
├── hooks/                         # 커스텀 훅
│   ├── useCalendar.ts
│   ├── useProjects.ts
│   ├── useAuth.ts
│   ├── useNotifications.ts
│   ├── useOffline.ts
│   └── usePerformance.ts
├── stores/                        # Zustand 상태 관리
│   ├── calendarStore.ts
│   ├── projectStore.ts
│   ├── userStore.ts
│   ├── uiStore.ts
│   └── index.ts
├── lib/                           # 유틸리티 및 설정
│   ├── api/                       # API 클라이언트
│   │   ├── client.ts
│   │   ├── calendar.ts
│   │   ├── projects.ts
│   │   └── users.ts
│   ├── graphql/                   # GraphQL 설정
│   │   ├── client.ts
│   │   ├── schema.ts
│   │   └── queries.ts
│   ├── utils/                     # 유틸리티 함수
│   │   ├── date.ts
│   │   ├── validation.ts
│   │   ├── security.ts
│   │   └── performance.ts
│   ├── constants/                  # 상수 정의
│   │   ├── colors.ts
│   │   ├── breakpoints.ts
│   │   └── config.ts
│   └── types/                     # TypeScript 타입 정의
│       ├── calendar.ts
│       ├── project.ts
│       ├── user.ts
│       └── api.ts
├── styles/                        # 스타일 파일
│   ├── globals.css                # 전역 스타일
│   ├── components.css             # 컴포넌트별 스타일
│   ├── utilities.css              # 유틸리티 클래스
│   └── themes/                    # 테마별 스타일
│       ├── light.css
│       ├── dark.css
│       └── custom.css
├── tests/                         # 테스트 파일
│   ├── unit/                      # 단위 테스트
│   ├── integration/               # 통합 테스트
│   ├── e2e/                       # E2E 테스트
│   └── fixtures/                  # 테스트 데이터
├── public/                        # 정적 파일
│   ├── icons/                     # 아이콘 파일
│   ├── images/                    # 이미지 파일
│   └── manifest.json              # PWA 매니페스트
└── service-worker.ts              # 서비스 워커
```

### **2.2 파일 명명 규칙**

**컴포넌트 파일**
- **PascalCase**: `CalendarContainer.tsx`, `EventCard.tsx`
- **기능별 접미사**: `EventForm.tsx`, `ProjectList.tsx`
- **컨테이너/프레젠테이션**: `CalendarContainer.tsx`, `CalendarView.tsx`

**훅 파일**
- **use 접두사**: `useCalendar.ts`, `useAuth.ts`
- **기능별 명명**: `useOffline.ts`, `usePerformance.ts`

**스토어 파일**
- **Store 접미사**: `calendarStore.ts`, `userStore.ts`
- **도메인별 분리**: `calendarStore.ts`, `projectStore.ts`

**API 파일**
- **도메인별 명명**: `calendar.ts`, `projects.ts`
- **클라이언트**: `client.ts`, `graphql.ts`

**타입 파일**
- **도메인별 명명**: `calendar.ts`, `project.ts`
- **공통 타입**: `common.ts`, `api.ts`

---

## 📚 **관련 문서**

- [**1. Frontend Tech Stack**](./01-frontend-tech-stack.md) - 기술 스택 및 선택 근거
- [**3. Component Standards**](./03-component-standards.md) - 컴포넌트 표준 및 패턴
- [**4. State Management**](./04-state-management.md) - 상태 관리 전략 및 구현

---

## 🎯 **다음 단계**

이 프로젝트 구조를 기반으로:

1. **컴포넌트 표준 정의**: 3번 섹션 참조
2. **상태 관리 전략**: 4번 섹션 참조
3. **스타일링 전략**: 5번 섹션 참조

**개발팀이 일관된 구조로 작업할 수 있는 기반이 마련되었습니다!** 🚀
