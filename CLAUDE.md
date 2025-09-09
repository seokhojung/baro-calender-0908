# CLAUDE.md

이 파일은 이 저장소에서 작업할 때 Claude Code (claude.ai/code)에 대한 지침을 제공합니다.

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
npm run docker:up      # Docker로 PostgreSQL & Redis 시작
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

### API 설계
- `/api/v1/` 하위의 RESTful 엔드포인트
- 24시간 만료 JWT 기반 인증
- ACL 기반 권한 부여 (Owner, Editor, Commenter, Viewer 역할)
- `/docs`에서 Swagger 문서 제공

### 데이터베이스 스키마
- Projects 테이블 - 핵심 프로젝트 엔티티
- Schedules 테이블 - 개별 일정 항목
- Users 테이블 - 사용자 계정 및 프로필  
- ProjectMembers 테이블 - 프로젝트 접근 제어
- RecurringPatterns 테이블 - 반복 일정 규칙
- Notifications 테이블 - 인앱 알림

## 현재 개발 중점 사항

**Story 2.2: 사용자 경험 및 성능 최적화**
- ShadCN UI 컴포넌트로 새로운 UI/UX 디자인 구현
- 고급 필터링 시스템 구축 (프로젝트/담당자/태그 필터)
- 일정 및 프로젝트 검색 기능 추가
- 성능 최적화 (가상 스크롤링, 지연 로딩)
- 모바일 터치 인터페이스 최적화

## 중요한 패턴

### API 통합
- 프론트엔드에서 GraphQL 쿼리를 위해 Apollo Client 사용
- 백엔드는 GraphQL이 아닌 RESTful API 제공 (Apollo Client 사용에도 불구하고)
- API 베이스 URL: `http://localhost:8000/api/v1`

### 상태 관리
- Zustand 스토어의 전역 앱 상태
- React 훅을 사용한 로컬 컴포넌트 상태
- Apollo Client로 캐시된 서버 상태

### 에러 처리
- 백엔드: 적절한 HTTP 상태 코드를 가진 Fastify 에러 핸들러
- 프론트엔드: 토스트 알림을 통한 사용자 친화적 에러 메시지와 Try-catch 블록

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

## 알아야 할 주요 파일

- `package.json` - 백엔드 의존성 및 스크립트
- `client/package.json` - 프론트엔드 의존성 및 스크립트  
- `client/tailwind.config.js` - 디자인 토큰 설정
- `src/server.js` - 백엔드 진입점
- `client/src/app/page.tsx` - 프론트엔드 홈 페이지
- `docs/architecture/` - 시스템 설계 문서