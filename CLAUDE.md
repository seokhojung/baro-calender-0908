# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

바로캘린더는 팀과 개인의 프로젝트 일정 관리를 위한 풀스택 웹 애플리케이션입니다. 백엔드(Epic 1)는 Node.js/Fastify/PostgreSQL을 사용하여 100% 완성되었고, 프론트엔드(Epic 2)는 Next.js 14.2.13으로 33% 완성되었으며 현재 ShadCN UI를 사용한 새로운 UI/UX 디자인 시스템을 구현 중입니다.

## 기술 스택

### 백엔드
- **런타임**: Node.js 20+
- **프레임워크**: Fastify (src/server.js)
- **데이터베이스**: PostgreSQL 15
- **캐시**: Redis
- **인증**: JWT (@fastify/jwt)
- **API 문서**: Swagger (@fastify/swagger)

### 프론트엔드  
- **프레임워크**: Next.js 14.2.13 (App Router)
- **UI 라이브러리**: React 18.2.0
- **스타일링**: Tailwind CSS + ShadCN UI
- **상태 관리**: React Context API + Zustand
- **API 클라이언트**: Apollo Client (GraphQL)

## 명령어

### 개발
```bash
# 모든 의존성 설치 (루트 + 클라이언트)
npm run install:all

# 개발 서버 시작
npm run dev:server     # 백엔드만 (포트 8000)
npm run dev:client     # 프론트엔드만 (포트 3000) 
npm run dev:full       # 두 서버 동시 실행

# 데이터베이스
npm run db:migrate     # 데이터베이스 마이그레이션 실행
node src/database/run-migrations.js run    # 마이그레이션 직접 실행
node src/database/run-migrations.js status # 마이그레이션 상태 확인
npm run docker:up      # Docker로 PostgreSQL & Redis 시작
docker-compose up -d postgres redis  # DB만 시작 (앱 제외)
```

### 테스트 & 품질
```bash
# 백엔드
npm test               # 백엔드 테스트 실행
npm run lint           # 백엔드 코드 린트
npm run lint:fix       # 린트 이슈 자동 수정

# 프론트엔드 (client/ 디렉토리에서)
cd client && npm test  # 프론트엔드 테스트 실행
cd client && npm run lint  # 프론트엔드 코드 린트
cd client && npm run type-check  # TypeScript 타입 체크
```

### 빌드 & 프로덕션
```bash
npm run build          # 프론트엔드 프로덕션 빌드
npm start              # 프로덕션 서버 시작

# API 계약 테스트
npm run test:contracts # API 엔드포인트 계약 테스트
npm run validate:api   # API 스키마 검증
```

## 아키텍처

### 백엔드 구조
- `src/server.js` - Fastify 서버 메인 진입점
- `src/api/v1/` - 버전별로 구성된 API 라우트 핸들러
- `src/database/` - 데이터베이스 마이그레이션 및 연결 관리
- `src/models/` - 데이터 모델 및 데이터베이스 쿼리
- `src/services/` - 비즈니스 로직 레이어
- `src/utils/` - 유틸리티 함수 및 헬퍼

### 프론트엔드 구조
- `client/src/app/` - Next.js App Router 페이지 및 레이아웃
- `client/src/components/` - React 컴포넌트 (현재 ShadCN UI로 재구성 중)
- `client/src/lib/` - 유틸리티 및 API 클라이언트 설정
- `client/src/hooks/` - 커스텀 React 훅
- `client/src/stores/` - Zustand 상태 스토어
- `client/src/types/` - TypeScript 타입 정의

### API 설계 & 인증 시스템
- `/api/v1/` 하위의 RESTful 엔드포인트 (auth, projects, members, events, timeline, oauth)
- **Multi-tenant Architecture**: 모든 데이터는 `tenant_id`로 격리됨
- **JWT Authentication**: 24시간 만료, 세션 DB 저장으로 토큰 무효화 지원
- **ACL 권한 계층**: Owner → Editor → Commenter → Viewer (계층적 권한 상속)
- **Security Features**: 세션 추적, 토큰 블랙리스팅, 활성 세션 관리
- Swagger 문서: `http://localhost:8000/docs`

### 데이터베이스 스키마 & 관계
```sql
-- Multi-tenant 구조
tenants (id, name, domain, settings)
  ↓ 1:N
projects (id, tenant_id, owner_id, name, color, settings)
  ↓ 1:N
members (id, tenant_id, project_id, user_id, role, invited_at, accepted_at)

-- 사용자 & 세션 관리
users (id, email, password_hash, first_name, last_name, role, tenant_id)
user_sessions (user_id, jwt_token_id, expires_at, is_active, last_accessed_at)

-- 이벤트 & 스케줄
events (id, project_id, title, start_date, end_date, all_day, location)
recurring_patterns (id, event_id, rrule, timezone)
notifications (id, user_id, event_id, type, message, read_at)
```

## 현재 개발 중점 사항

**Story 2.2: 사용자 경험 및 성능 최적화**
- ShadCN UI 컴포넌트로 새로운 UI/UX 디자인 구현
- 고급 필터링 시스템 구축 (프로젝트/담당자/태그 필터)
- 일정 및 프로젝트 검색 기능 추가
- 성능 최적화 (가상 스크롤링, 지연 로딩)
- 모바일 터치 인터페이스 최적화

## 중요한 아키텍처 패턴

### Authentication & Authorization Flow
```typescript
// JWT + Session 하이브리드 전략
1. JWT 토큰 발급 (24시간) → sessionStorage 저장
2. 세션 DB 저장 (토큰 무효화 지원)
3. ACL 미들웨어로 경로별 권한 검증
4. 자동 토큰 갱신 (만료 10분 전)
```

### API 통합 패턴
- **Backend**: Fastify RESTful APIs (`/api/v1/*`)
- **Frontend**: Apollo Client configured for REST (not GraphQL)
- **Base URL**: `http://localhost:8000/api/v1`
- **Error Handling**: Centralized with toast notifications

### Frontend State Architecture
```typescript
// Zustand Store 구조 (client/src/stores/)
useStores() = {
  calendar: useCalendarStore(),    // 캘린더 뷰 상태
  project: useProjectStore(),      // 프로젝트 관리 상태
  user: useUserStore(),           // 사용자 프로필 & 설정
  ui: useUIStore()                // UI 상태 & 알림
}
// + React Context for theme/auth + Apollo Client cache
```

### Component Architecture Patterns
- **Atomic Design**: `ui/` → `calendar/` → `layout/` hierarchy
- **Performance First**: Virtual scrolling, memoization, lazy loading
- **ShadCN Integration**: Design token system with 8-color palette
- **Mobile Optimized**: Touch interfaces with safe-area support

### Key Middleware & Security
```typescript
// ACL 권한 시스템 (src/middleware/acl.js)
authenticateUser()          // JWT 검증
requireProjectMembership()  // 프로젝트 접근 권한
requireOwner()             // 소유자 전용 작업
requireEditorOrHigher()    // 편집자 이상 권한
```

### 성능 요구사항
- 뷰 전환: < 150ms
- API 응답: < 200ms  
- 초기 페이지 로드: < 3초

## 환경 설정

1. `env.example`을 `.env`로 복사하고 설정:
   - 데이터베이스 자격 증명 (PostgreSQL)
   - JWT_SECRET (32자 이상)
   - Redis 연결 URL
   
2. PostgreSQL과 Redis를 위해 Docker가 실행 중인지 확인

3. 개발 시작 전에 데이터베이스 마이그레이션 실행

## 핵심 설정 파일

### Backend Configuration
- `src/server.js` - Fastify 서버 진입점 & 플러그인 설정
- `src/middleware/acl.js` - 인증 & 권한 미들웨어 시스템
- `src/database/run-migrations.js` - DB 마이그레이션 실행기
- `src/utils/envValidator.js` - 환경 변수 검증 시스템

### Frontend Configuration
- `client/src/lib/auth/tokenManager.ts` - JWT 토큰 관리 (하이브리드 전략)
- `client/src/stores/` - Zustand 상태 관리 스토어들
- `client/tailwind.config.js` - 디자인 토큰 & 8색상 팔레트
- `client/src/app/layout.tsx` - 루트 레이아웃 & 테마 프로바이더

### Environment & Docker
- `.env` (from `env.example`) - 환경 설정
- `docker-compose.yml` - 프로덕션 Docker 설정
- `docker-compose.dev.yml` - 개발용 Docker 설정