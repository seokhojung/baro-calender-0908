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
- **스타일링**: Tailwind CSS
- **상태 관리**: React Context API / Zustand
- **애니메이션**: Framer Motion
- **접근성**: WCAG 2.2 AA 준수

## 🚀 빠른 시작

### 백엔드 개발
1. [개발 환경 설정 가이드](./development-setup-guide.md) 확인
2. [에픽 1 체크리스트](./checklist/epic-1-backend-completion.md) 참조

### 프론트엔드 개발
1. [프론트엔드 설정 가이드](./development-setup-guide.md#프론트엔드-개발-환경-설정-shadcnui--tweakcn) 확인
2. [에픽 2 체크리스트](./checklist/epic-2-frontend-checklist.md) 참조
3. [Story 2.1](./stories/2.1.basic-calendar-view.story.md) 개발 시작

## 📊 프로젝트 상태

- **에픽 1 (백엔드)**: 100% 완성 ✅
- **에픽 2 (프론트엔드)**: 0% 완성 (Story 2.1 개발 준비 완료) 🔄

## 🤝 기여하기

문서 개선이나 오류 수정을 위한 Pull Request를 환영합니다.


