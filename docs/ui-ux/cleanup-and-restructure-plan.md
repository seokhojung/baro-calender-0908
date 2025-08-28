# 바로캘린더 UI 구현을 위한 정리 및 재구성 계획표

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: PO Sarah
- **상태**: Ready for Implementation
- **목표**: 새로운 UI 아키텍처 기반으로 깨끗한 시작점 확보

---

## 🎯 **정리 목표**

**"기존 구린 디자인 완전 제거 + UI 아키텍처 문서 기반 + ShadCN UI + MCP 서버 활용 = 현대적 디자인 시스템 완성"**

---

## 🗑️ **Phase 1: client/ 폴더 완전 정리**

### **1.1 정리 원칙**
- **의존성 유지**: npm install 불필요하게 하지 않기
- **설정 파일 유지**: TypeScript, Next.js, Jest 설정 그대로
- **소스 코드 완전 정리**: 구린 디자인 + 기존 레이아웃 + 폴더 구조 모두 제거

### **1.2 유지할 파일들 (설정 및 의존성만)**
```
✅ package.json - 프로젝트 의존성
✅ package-lock.json - 의존성 잠금
✅ tsconfig.json - TypeScript 설정
✅ next.config.ts - Next.js 설정
✅ postcss.config.mjs - PostCSS 설정
✅ jest.config.js - Jest 테스트 설정
✅ jest.setup.js - Jest 환경 설정
✅ eslint.config.mjs - ESLint 설정
✅ components.json - shadcn/ui 설정
✅ .gitignore - Git 무시 파일
✅ next-env.d.ts - Next.js 타입 정의
✅ README.md - 프로젝트 설명 (업데이트 필요)
```

### **1.3 완전히 정리할 폴더들**
```
🗑️ .next/ - Next.js 빌드 결과물 (삭제)
🗑️ node_modules/ - 의존성 (삭제 후 재설치)
🗑️ src/ - 기존 소스 코드 + 레이아웃 + 폴더 구조 모두 완전 정리
```

### **1.4 정리 후 상태 (완전히 빈 상태)**
```
client/
├── 📁 src/ - 완전히 빈 폴더 (새로운 구조 대기)
├── package.json - 의존성 유지
├── tsconfig.json - 설정 유지
├── next.config.ts - 설정 유지
├── jest.config.js - 설정 유지
├── components.json - shadcn/ui 설정 유지
└── README.md - 새로운 계획 반영
```

### **1.5 새로운 구조는 나중에 결정**
- **새로운 스토리 작성 후**: SM이 UI 아키텍처 문서 기반으로 스토리 작성
- **아키텍처 구조 결정 후**: Dev가 새로운 폴더 구조 생성
- **현재는 완전히 빈 상태**: 새로운 계획에 맞춰 유연하게 대응

---

## 📚 **Phase 2: 문서 정리 및 파일 명칭 변경**

### **2.1 구린 디자인 내용이 들어있는 문서들 (삭제/정리 필요)**
```
❌ qa-checklist.md - 구린 디자인 기반 QA 결과
❌ epic-2-frontend-checklist.md - 구린 디자인 기반 진행도 추적
❌ 2.1.basic-calendar-view.story.md - 구린 디자인 구현 스토리
```

### **2.2 현재 관리 상태를 정리하는 문서들 (유지/명칭 변경)**
```
📋 ui-implementation-checklist.md → ui-development-checklist.md
📋 calendar-view-design.md - 캘린더 뷰 디자인 명세 (유지)
📋 implementation-plan.md → ui-design-system-plan.md (파일명 변경 + 링크 업데이트)
📋 epic-2-frontend-checklist.md → frontend-progress-tracker.md (파일명 변경 + 링크 업데이트)
📋 README.md - UI/UX 문서 개요 (유지)
📋 README.md - 프로젝트 전체 개요 (유지)
```

### **2.3 새로운 문서 구조**
```
📋 ui-design-system-plan.md - ShadCN UI 기반 디자인 시스템 계획 (기존 implementation-plan.md)
📝 ui-development-checklist.md - UI 개발 작업 체크리스트 (기존 ui-implementation-checklist.md)
📊 frontend-progress-tracker.md - 프론트엔드 진행도 추적 (기존 epic-2-frontend-checklist.md)
📋 calendar-view-design.md - 캘린더 뷰 디자인 명세 (유지)
📋 README.md - UI/UX 문서 개요 (유지)
📋 README.md - 프로젝트 전체 개요 (유지)
```

---

## 🔄 **Phase 3: 새로운 워크플로우 수립**

### **3.1 SM → Dev 워크플로우**
- **SM 단계**: UI 아키텍처 문서 기반으로 새로운 스토리 작성
- **Dev 단계**: 새로운 스토리 기반으로 새로운 폴더 구조 생성 및 구현

### **3.2 문서 동기화 규칙**
```
📋 ui-design-system-plan.md ← 메인 계획서
    ↓
📝 ui-development-checklist.md ← 작업 체크리스트
    ↓
📊 frontend-progress-tracker.md ← 진행도 추적
```

### **3.3 업데이트 주기**
- **주간**: 계획서 검토
- **일일**: 체크리스트 업데이트
- **실시간**: 진행도 반영

---

## 📅 **실행 일정**

### **Day 1: client/ 폴더 정리**
- [ ] 기존 소스 코드 백업 생성
- [ ] 소스 코드 완전 정리
- [ ] 새로운 빈 폴더 구조 생성
- [ ] README.md 업데이트

### **Day 2: 문서 정리 및 파일명 변경**
- [ ] 구린 디자인 문서 백업 생성
- [ ] 구린 디자인 문서 삭제
- [ ] 파일 명칭 변경 및 링크 업데이트
  - [ ] implementation-plan.md → ui-design-system-plan.md
  - [ ] epic-2-frontend-checklist.md → frontend-progress-tracker.md
  - [ ] ui-implementation-checklist.md → ui-development-checklist.md
- [ ] 모든 문서의 링크 참조 업데이트
- [ ] 링크 업데이트 검증 및 테스트
- [ ] 새로운 문서 구조 수립

### **Day 3: 워크플로우 수립**
- [ ] 새로운 워크플로우 문서 작성
- [ ] 문서 동기화 규칙 수립
- [ ] 개발팀 가이드라인 작성

---

## 🚨 **주의사항**

### **3.1 백업 필수**
- **client/ 폴더**: 기존 소스 코드 완전 백업
- **문서들**: 구린 디자인 문서들 백업 후 삭제
- **파일명 변경**: 기존 파일 백업 후 새 이름으로 복사
- **복구 가능성**: 필요시 백업에서 복구 가능

### **3.2 의존성 유지**
- **package.json**: 프로젝트 의존성 그대로 유지
- **설정 파일들**: TypeScript, Next.js, Jest 설정 유지
- **npm install 불필요**: 의존성 재설치 불필요

### **3.3 새로운 시작점**
- **완전히 빈 상태**: 새로운 계획에 맞춰 유연하게 대응
- **아키텍처 문서 기반**: UI 아키텍처 문서에서 새로운 구조 결정
- **ShadCN UI + MCP 서버**: 체계적인 컴포넌트 및 블록 활용

### **3.4 링크 업데이트 전략**
- **자동화 도구 활용**: grep + sed를 통한 일괄 링크 업데이트
- **단계별 진행**: 파일명 변경 → 링크 업데이트 → 검증
- **링크 깨짐 방지**: 모든 참조를 동시에 업데이트하여 일관성 확보

---

## 🎯 **최종 목표**

**"기존 구린 디자인 완전 제거 + UI 아키텍처 문서 기반 + ShadCN UI + MCP 서버 활용 = 현대적 디자인 시스템 완성"**

**"개발자 친화적인 직관적 파일명 + 체계적인 링크 관리 = 유지보수성 향상"**

---

## 📝 **Change Log**

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-19 | 1.0 | 초기 정리 및 재구성 계획표 작성 | PO Sarah |
| 2025-08-19 | 1.1 | 파일명 변경 및 링크 업데이트 전략 추가 | PO Sarah |

---

**이 문서는 새로운 UI 구현을 위한 정리 및 재구성 작업의 가이드라인입니다.**
**각 단계별로 체계적으로 진행하여 깨끗한 시작점을 확보하세요.**
