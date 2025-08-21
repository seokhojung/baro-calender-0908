# Frontend Tech Stack

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처

---

## 🚀 **1. Frontend Tech Stack**

### **1.1 핵심 기술 스택**

**프레임워크 & 런타임**
- **Next.js**: 15.4.6 (App Router, Server Components)
- **React**: 19.1.1 (Concurrent Features, Suspense)
- **TypeScript**: 5.3+ (Strict Mode, Advanced Types)

**UI 컴포넌트 & 스타일링**
- **ShadCN UI**: v4 (Radix UI 기반, 접근성 우선)
- **Tailwind CSS**: 3.4+ (Utility-First, CSS Variables)
- **Framer Motion**: 11.0+ (60fps 애니메이션, 성능 최적화)

**상태 관리 & 데이터**
- **Zustand**: 4.4+ (TypeScript 지원, 번들 크기 최적화)
- **React Query**: 5.0+ (서버 상태 관리, 캐싱)
- **GraphQL**: Apollo Client (타입 안전성, 실시간 업데이트)

**개발 도구 & 품질**
- **Turbopack**: Next.js 15 기본 번들러
- **ESLint**: 코드 품질 및 보안 검사
- **Jest + RTL**: 단위 테스트 및 통합 테스트
- **Playwright**: E2E 테스트, 크로스 브라우저 지원

### **1.2 기술 선택 근거**

**Next.js 15 선택 이유**
- **App Router**: 파일 기반 라우팅, 레이아웃 중첩
- **Server Components**: 초기 로딩 성능 향상
- **Streaming**: 점진적 페이지 렌더링
- **Turbopack**: 개발 환경 번들링 속도 향상

**ShadCN UI v4 선택 이유**
- **접근성 우선**: WCAG AA 기준 준수
- **커스터마이징**: Tweak CN 테마 시스템
- **타입 안전성**: TypeScript 완벽 지원
- **성능**: Tree-shaking, 번들 크기 최적화

**Zustand 선택 이유**
- **번들 크기**: Redux 대비 1/3 크기
- **TypeScript**: 완벽한 타입 추론
- **React 19**: Concurrent Features 호환
- **개발자 경험**: 보일러플레이트 최소화

---

## 📚 **관련 문서**

- [**2. Project Structure**](./02-project-structure.md) - 프로젝트 구조 및 명명 규칙
- [**3. Component Standards**](./03-component-standards.md) - 컴포넌트 표준 및 패턴
- [**4. State Management**](./04-state-management.md) - 상태 관리 전략 및 구현

---

## 🎯 **다음 단계**

이 기술 스택을 기반으로:

1. **프로젝트 구조 설계**: 2번 섹션 참조
2. **컴포넌트 표준 정의**: 3번 섹션 참조
3. **상태 관리 전략**: 4번 섹션 참조

**개발팀이 바로 작업을 시작할 수 있는 기술 기반이 마련되었습니다!** 🚀
