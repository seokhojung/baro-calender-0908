# 바로캘린더 문서

바로캘린더 프로젝트의 모든 문서를 포함합니다.

## 📚 문서 구조

### 제품 요구사항 (PRD)
- [PRD 메인 문서](./prd.md) - 제품 요구사항 및 기술 스택
- [PRD 분할 문서](./prd/) - 섹션별 상세 요구사항

### 아키텍처
- [아키텍처 개요](./architecture/README.md) - 시스템 설계 및 기술 스택
- [상세 아키텍처](./architecture/) - 각 영역별 상세 설계

### 개발 가이드
- [개발 환경 설정](./development-setup-guide.md) - 백엔드 및 프론트엔드 개발 환경
- [프론트엔드 설정 (shadcn/ui + tweakcn)](./development-setup-guide.md#프론트엔드-개발-환경-설정-shadcnui--tweakcn)

### UI/UX 디자인 (신규)
- [캘린더 뷰 디자인 명세서](./ui-ux/components/calendar-view-design.md) - 첫 화면 UI/UX 상세 설계
- [UI 구현 체크리스트](./ui-ux/checklists/ui-implementation-checklist.md) - 4주 단계별 구현 계획
- [UI/UX 문서 개요](./ui-ux/README.md) - UI/UX 문서 구조 및 가이드

### 체크리스트
- [에픽 1 체크리스트](./checklist/) - 백엔드 완성 체크리스트
- [에픽 2 체크리스트](./checklist/) - 프론트엔드 진행도 추적

### 사용자 스토리
- [에픽 1 스토리](./stories/) - 백엔드 시스템 구현 스토리
- [에픽 2 스토리](./stories/) - 프론트엔드 캘린더 시스템 스토리

## 🛠️ 기술 스택

### 백엔드
- **프레임워크**: Fastify
- **데이터베이스**: PostgreSQL
- **인증**: JWT + ACL
- **로깅**: Winston
- **API 문서**: Swagger/OpenAPI

### 프론트엔드
- **프레임워크**: Next.js 15.4.6
- **언어**: TypeScript
- **UI 라이브러리**: shadcn/ui + tweakcn
- **MCP 서버**: ShadCN UI 컴포넌트 및 블록 관리
- **스타일링**: Tailwind CSS
- **상태 관리**: React Context API / Zustand
- **애니메이션**: Framer Motion
- **접근성**: WCAG 2.2 AA 준수
- **성능**: 뷰 전환 150ms 이하, 초기 로딩 3초 이하

## 🚀 빠른 시작

### 백엔드 개발
1. [개발 환경 설정 가이드](./development-setup-guide.md) 확인
2. [에픽 1 체크리스트](./checklist/epic-1-backend-completion.md) 참조

### 프론트엔드 개발
1. [프론트엔드 설정 가이드](./development-setup-guide.md#프론트엔드-개발-환경-설정-shadcnui--tweakcn) 확인
2. [UI/UX 디자인 명세서](./ui-ux/components/calendar-view-design.md) 참조
3. [UI 구현 체크리스트](./ui-ux/checklists/ui-implementation-checklist.md)로 4주 단계별 진행
4. [Story 2.1](./stories/2.1.basic-calendar-view.story.md) 요구사항 구현

### 🎨 **새로운 UI/UX 구현 전략**
- **기존 Next.js 환경 유지**: 프로젝트 구조, 의존성, 설정 그대로
- **구린 디자인 완전 제거**: 기존 components 폴더 내용 삭제
- **ShadCN UI + MCP 서버**: 체계적인 컴포넌트 및 블록 활용
- **4주 단계별 구현**: Header → Sidebar → Layout → Calendar Views → 최적화

## 📊 프로젝트 상태

- **에픽 1 (백엔드)**: 100% 완성 ✅
  - PostgreSQL + Redis 데이터베이스 구축 완료
  - Fastify API 서버 구동 완료
  - JWT 인증 + ACL 권한 시스템 완성
  - 데이터베이스 마이그레이션 완료

- **에픽 2 (프론트엔드)**: 33% 완성 (Story 2.1 완료 + 새 디자인 구현 준비) 🔄
  - ✅ **Story 2.1: 기본 캘린더 뷰 완성**
    - Next.js 15.4.6 기반 프로젝트 구조 완성
    - Header, Sidebar, Layout 컴포넌트 구현 완료
    - MonthView, WeekView 캘린더 뷰 구현 완료
    - React Context 기반 상태 관리 구현 완료
    - 백엔드 API 연동 완료
    - 성능 목표 달성 (뷰 전환 < 150ms)
  - 🔄 **Story 2.2: 사용자 경험 및 성능 최적화** (다음 단계)
  - ⏳ **Story 2.3: 고급 기능 및 MVP 완성** (대기)
  - **UI/UX 문서 및 체크리스트 준비 완료** ✅

## 🎯 **현재 개발 중인 기능**

### **Story 2.2: 사용자 경험 및 성능 최적화**
- **목표**: 기본 캘린더 뷰의 사용자 경험 개선 및 성능 KPI 달성
- **핵심 요구사항**: 
  - 고급 필터링 시스템 구현
  - 검색 기능 구현
  - 성능 최적화 (150ms 이하 유지)
  - 모바일 최적화 및 접근성 개선

### **구현 계획**
- **Week 1**: 필터링 및 검색 기능
- **Week 2**: 성능 최적화
- **Week 3**: 모바일 최적화 및 테스트

## 🚀 **새로운 UI/UX 구현 시작**

### **현재 상황**
- Story 2.1의 기본 기능은 완성되었지만, UI/UX 디자인이 구식
- 새로운 디자인 시스템 적용 필요
- ShadCN UI + MCP 서버 기반 체계적 구현 준비 완료

### **다음 단계**
1. **기존 components 폴더 정리** (구린 디자인 제거)
2. **UI 구현 체크리스트 1단계 시작** (Header + Sidebar + Layout)
3. **ShadCN UI 블록 분석 및 적용**
4. **4주 단계별 체계적 구현 진행**

## 🤝 기여하기

문서 개선이나 오류 수정을 위한 Pull Request를 환영합니다.

### **개발 참여 방법**
1. [UI 구현 체크리스트](./ui-ux/checklists/ui-implementation-checklist.md) 확인
2. 담당할 단계 및 항목 선택
3. ShadCN UI + MCP 서버 워크플로우 준수
4. 진행 상황 체크리스트 업데이트

### **현재 개발 참여 가능한 영역**
- **UI/UX 디자인 개선**: 새로운 디자인 시스템 적용
- **성능 최적화**: 뷰 전환 시간 최적화
- **모바일 최적화**: 반응형 디자인 및 터치 인터페이스
- **접근성 개선**: WCAG 2.2 AA 준수


