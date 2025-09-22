# 🚀 Stories 1.1-1.10 종합 리팩토링 & 디버깅 실행 계획

## 📋 **계획 개요**

- **기준 문서**: 중간 검증 보고서 (bmad-core 3단계 검증)
- **현재 상태**: 전체 7.0/10 (개선 필요)
- **목표 상태**: 전체 9.0/10+ (배포 가능)
- **예상 기간**: 2-4주 (단계별 집중 투입)
- **자동화 활용**: Living Documentation System 전면 적용
- **브랜치 전략**: 안전한 브랜치 기반 단계별 리팩토링

---

## 🌿 **Git 브랜치 전략**

### **브랜치 구조**
```
master (보호됨)
└── refactor/stories-1.1-1.10-fixes (메인 리팩토링 브랜치)
    ├── fix/tier1-emergency-fixes      # Tier 1: Emergency Fixes
    ├── fix/tier2-core-implementation  # Tier 2: Core Implementation
    ├── fix/tier3-quality-enhancement  # Tier 3: Quality Enhancement
    └── fix/tier4-living-documentation # Tier 4: Living Documentation
```

### **브랜치별 작업 흐름**
1. **각 Tier마다 독립 브랜치 생성**
2. **이슈별 커밋으로 세밀한 버전 관리**
3. **Tier 완료 시 메인 리팩토링 브랜치로 병합**
4. **테스트 및 검증 후 master로 PR**

### **Living Documentation 브랜치 연동**
- 각 브랜치에서도 자동화 시스템 정상 동작
- 브랜치별 문서 상태 추적
- 병합 시 master 문서 자동 동기화

---

## 🚨 **Tier 1: Emergency Fixes (24-48시간 내)**

### **🔥 Critical Issues (시스템 차단 오류)**

**Issue #1: Store Export Crisis**
```bash
# 영향도: ⚠️ CRITICAL - 전체 상태 관리 마비
# 원인: useProjectStore, useUserStore 함수 export 누락
# 결과: 캘린더/프로젝트 페이지 500 오류

📁 수정할 파일:
- client/src/stores/projectStore.ts
- client/src/stores/userStore.ts

🔧 해결 방법:
export { useProjectStore, useProjectSelectors } from './projectStore';
export { useUserStore, useUserSelectors } from './userStore';
```

**Issue #2: UI Component Export Crisis**
```bash
# 영향도: ⚠️ CRITICAL - 프로젝트 관리 UI 완전 차단
# 원인: AlertDialog 관련 컴포넌트 export 누락
# 결과: 프로젝트 CRUD 기능 완전 불가

📁 수정할 파일:
- client/src/components/ui/dialog.tsx

🔧 해결 방법:
export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from './alert-dialog';
```

**Issue #3: Missing Critical Dependencies**
```bash
# 영향도: ⚠️ CRITICAL - 핵심 기능 불가
# 원인: react-dnd, react-window 패키지 누락
# 결과: 드래그앤드롭, 가상화 기능 완전 불가

🔧 해결 방법:
cd client && npm install react-dnd react-dnd-html5-backend react-window react-window-infinite-loader @types/react-window
```

**Issue #4: Import Path Resolution**
```bash
# 영향도: ⚠️ HIGH - 컴포넌트 렌더링 실패
# 원인: 잘못된 import 경로 30+개
# 결과: 컴포넌트 로딩 실패

🔧 주요 수정 경로:
- react-dnd: DndProvider import 수정
- lucide-react: Memory, TouchIcon → 대체 아이콘 사용
- @/stores/*: 정확한 export 경로 수정
```

### **🎯 Emergency Fixes 실행 순서**

**Step 0: 브랜치 생성 및 자동화 활성화**
```bash
# 메인 리팩토링 브랜치 생성
git checkout -b refactor/stories-1.1-1.10-fixes

# Emergency fixes 서브 브랜치 생성
git checkout -b fix/tier1-emergency-fixes

# Living Documentation 자동화 활성화
echo "node docs/implementation-verification/automation-tools/pre-commit-doc-sync.js" >> .husky/pre-commit
```

**Step 1: 패키지 설치**
```bash
cd client
npm install react-dnd react-dnd-html5-backend react-window @types/react-window

# 패키지 설치 커밋
git add package.json package-lock.json
git commit -m "fix: Install missing critical dependencies

- Add react-dnd, react-dnd-html5-backend for drag-and-drop
- Add react-window, @types/react-window for virtualization
- Resolves Critical Issue #3: Missing dependencies
- Related Stories: 1.4, 1.6

🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Step 2: Store Export 수정**
```bash
# Store export 수정
echo "export { useProjectStore, useProjectSelectors };" >> client/src/stores/projectStore.ts
echo "export { useUserStore, useUserSelectors };" >> client/src/stores/userStore.ts

# Store export 커밋
git add client/src/stores/projectStore.ts client/src/stores/userStore.ts
git commit -m "fix: Add missing useProjectStore and useUserStore exports

- Export useProjectStore, useProjectSelectors from projectStore
- Export useUserStore, useUserSelectors from userStore  
- Resolves Critical Issue #1: Store export crisis
- Related Stories: 1.3, 1.5

🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Step 3: AlertDialog 컴포넌트 생성**
```bash
# ShadCN에서 alert-dialog 컴포넌트 추가
npx shadcn-ui@latest add alert-dialog
```

**Step 4: 검증**
```bash
npm run dev:client
# → http://localhost:3000/calendar-demo (500 → 200 확인)
# → http://localhost:3000/projects (500 → 200 확인)
```

---

## 🔧 **Tier 2: Core Implementation (1주일 내)**

### **💼 Story 1.5: 프로젝트 CRUD 완성 (Critical)**

**현재 상태**: 5.3/10 - 핵심 컴포넌트 50% 미완성
**목표 상태**: 8.5/10+ - 완전 기능 구현

**구현해야 할 컴포넌트들:**
```typescript
// 1. 프로젝트 생성 폼
client/src/components/project/ProjectCreateForm.tsx
- 8색상 팔레트 선택
- 프로젝트 정보 입력 (이름, 설명, 시작일, 종료일)
- 팀원 초대 기능
- 권한 설정 (Owner, Editor, Commenter, Viewer)

// 2. 프로젝트 편집 다이얼로그  
client/src/components/project/ProjectEditDialog.tsx
- 기존 프로젝트 정보 수정
- 팀원 관리 (추가/제거/권한 변경)
- 프로젝트 설정 변경

// 3. 프로젝트 권한 관리
client/src/components/project/ProjectPermissionManager.tsx
- ACL 기반 권한 체계
- 역할별 접근 제어 UI
- 권한 변경 히스토리
```

**구현 우선순위:**
1. **ProjectCreateForm.tsx** (1일) - 기본 CRUD 기능
2. **ProjectEditDialog.tsx** (1일) - 수정 기능  
3. **ProjectPermissionManager.tsx** (1일) - 권한 관리
4. **통합 테스트** (1일) - E2E 테스트

### **📅 Story 1.6: 스케줄 CRUD 완성 (Critical)**

**현재 상태**: 5.0/10 - 스케줄 관리 60% 미완성
**목표 상태**: 8.5/10+ - 완전 기능 구현

**구현해야 할 컴포넌트들:**
```typescript
// 1. 스케줄 생성 폼
client/src/components/schedule/ScheduleCreateForm.tsx
- 프로젝트 연동 스케줄 생성
- 시간/날짜 선택 (date-time picker)
- 참석자 관리
- 알림 설정

// 2. 충돌 해결 다이얼로그
client/src/components/schedule/ConflictResolutionDialog.tsx
- 일정 충돌 자동 감지
- 대안 시간 제안
- 충돌 해결 옵션 선택

// 3. 드래그앤드롭 핸들러
client/src/components/schedule/ScheduleDragHandler.tsx
- react-dnd 기반 드래그앤드롭
- 시간 변경 및 이동
- 드래그 시 시각적 피드백
```

### **🔄 Story 1.3: 상태 관리 통합 완성 (High)**

**현재 상태**: 7.4/10 - Apollo-Zustand 통합 미완성
**목표 상태**: 9.0/10+ - 완벽한 상태 동기화

**완성해야 할 통합 로직:**
```typescript
// 1. Apollo-Zustand 동기화
client/src/lib/apollo-zustand-sync.ts
- GraphQL 쿼리 결과를 Zustand 스토어에 자동 반영
- 낙관적 업데이트 구현
- 캐시 동기화 로직

// 2. 오프라인 큐 시스템
client/src/lib/offline-queue.ts
- 네트워크 연결 끊김 시 작업 큐에 저장
- 연결 복구 시 자동 동기화
- 충돌 해결 메커니즘

// 3. 실시간 상태 동기화
client/src/lib/realtime-sync.ts
- WebSocket 기반 실시간 업데이트
- 다중 사용자 동시 편집 지원
- 상태 충돌 자동 해결
```

---

## 🧹 **Tier 3: Code Quality Enhancement (1-2주일)**

### **📝 TypeScript 오류 대량 해결**

**현재 상태**: 200+ 타입 오류
**목표**: 0개 오류, strict mode 완전 준수

**해결 전략:**
```bash
# 1. any 타입 제거 (50+ 개소)
# 우선순위: stores → components → lib → types

# 2. 타입 정의 완성
client/src/types/
├── api.ts           # API 응답 타입 정확히 정의
├── store.ts         # 스토어 타입 완성
├── component.ts     # 컴포넌트 Props 타입
└── utility.ts       # 유틸리티 타입 정의

# 3. 인터페이스 구현 완성
# 누락된 프로퍼티 추가
# 잘못된 타입 매핑 수정
```

**단계별 접근:**
```javascript
// Week 1: Critical 타입 오류 (50개)
- stores/: useProjectStore, useUserStore 타입 정확히 정의
- components/calendar/: 캘린더 관련 타입 완성
- types/api.ts: 백엔드 API와 정확히 일치하는 타입

// Week 2: 나머지 타입 오류 (150개)
- components/ui/: ShadCN UI 컴포넌트 타입 완성
- lib/: 유틸리티 함수 타입 정의
- tests/: 테스트 파일 타입 수정
```

### **🧽 ESLint 규칙 준수**

**현재 상태**: 300+ 린팅 오류
**목표**: 경고 10개 이하, 오류 0개

**주요 수정 항목:**
```bash
# 1. 사용하지 않는 imports/변수 제거 (100+개)
# 2. console.log 문 제거 또는 debug 모드 적용 (50+개)  
# 3. 일관된 코딩 스타일 적용 (150+개)
```

**자동화 도구 활용:**
```bash
# ESLint 자동 수정
npm run lint -- --fix

# Prettier로 코드 포맷팅
npm run format

# 사용하지 않는 imports 자동 제거
npx ts-unused-exports client/tsconfig.json --findCompletelyUnusedFiles
```

---

## 🔄 **Tier 4: Living Documentation 시스템 전면 적용**

### **자동화 도구 활성화**

**1. Pre-commit Hook 즉시 적용**
```bash
# Husky 설치 및 설정
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "node docs/implementation-verification/automation-tools/pre-commit-doc-sync.js"
```

**2. Daily Sync 자동화**
```bash
# Windows Task Scheduler 설정
schtasks /create /tn "DailyDocSync" /tr "node C:\Users\seokho\Desktop\baro-calender-new\docs\implementation-verification\automation-tools\daily-sync-checker.js" /sc daily /st 09:00

# 또는 수동 실행
node docs/implementation-verification/automation-tools/daily-sync-checker.js
```

**3. 실시간 문서 업데이트**
```bash
# 개발 중 자동 동기화
# 파일 변경 감지 → 관련 스토리 문서 자동 업데이트
# 빌드 실패 → Status 자동 변경
# 커밋 → Dev Agent Record 자동 업데이트
```

### **문서 동기화 사이클 정착**

**매일 루틴:**
```bash
# 오전 9시: 자동 동기화 보고서 확인
cat docs/sync-logs/daily-sync-$(date +%Y-%m-%d).md

# 개발 시작 전: 관련 스토리 Status 확인
grep "Status" docs/frontend-stories/1.5.*.md

# 커밋 시: 자동 문서 업데이트 (Pre-commit hook)
git commit -m "Fix project CRUD components"
# → 자동으로 Story 1.5 문서 업데이트됨
```

**주간 루틴:**
```bash
# 전체 동기화 상태 점검
node docs/implementation-verification/automation-tools/daily-sync-checker.js

# 문서-구현 일치성 검토
# 발견된 이슈들 우선순위별 해결
```

---

## 📊 **실행 타임라인 & 마일스톤**

### **Week 1: Emergency & Core (Critical)**
```
Day 1: Emergency Fixes 완료
- ✅ Store export 수정
- ✅ AlertDialog 추가  
- ✅ 패키지 설치
- ✅ 기본 기능 복구 확인

Day 2-3: Story 1.5 구현
- ProjectCreateForm.tsx 완성
- ProjectEditDialog.tsx 완성

Day 4-5: Story 1.6 구현  
- ScheduleCreateForm.tsx 완성
- ConflictResolutionDialog.tsx 완성

Day 6-7: 통합 테스트 & 검증
- 모든 Critical Issues 해결 확인
- 기본 기능 E2E 테스트
```

### **Week 2: Integration & Sync (High)**
```
Day 8-10: Story 1.3 통합 완성
- Apollo-Zustand 동기화 완성
- 실시간 동기화 구현
- 오프라인 큐 시스템

Day 11-12: Story 1.4, 1.7 통합 개선
- 캘린더-프로젝트 통합 완성
- 실시간 동기화 적용

Day 13-14: Living Documentation 전면 적용
- 자동화 도구 활성화
- 문서 동기화 사이클 정착
```

### **Week 3-4: Quality & Optimization**
```
Week 3: Code Quality Enhancement
- TypeScript 오류 전면 해결
- ESLint 규칙 완전 준수
- 테스트 커버리지 80% 달성

Week 4: Performance & Final Integration
- 성능 최적화 (Core Web Vitals)
- 전체 시스템 통합 테스트
- 배포 준비 완료
```

---

## 🎯 **성공 지표 (KPI) 및 검증 기준**

### **주간별 목표 달성 기준**

**Week 1 완료 기준:**
```
✅ 전체 평균 점수: 7.0 → 8.0 이상
✅ Critical Issues: 8개 → 0개
✅ 500 오류 페이지: 100% → 0%
✅ 기본 CRUD 기능: 동작 확인
```

**Week 2 완료 기준:**
```
✅ 통합 성공률: 30% → 80% 이상
✅ 상태 관리: 완전 동기화 확인
✅ Living Documentation: 90% 적용
✅ 실시간 기능: 기본 동작 확인
```

**Week 3-4 완료 기준:**
```
✅ TypeScript 오류: 200+ → 0개
✅ ESLint 경고: 300+ → 10개 이하
✅ 전체 평균 점수: 8.0 → 9.0+ 
✅ 배포 준비도: 불가 → 가능
```

### **자동 검증 시스템**

**일일 자동 검증:**
```bash
# Daily Sync Checker 결과
동기화율: 95% 이상
Critical Issues: 0개
빌드 성공률: 100%
```

**주간 종합 검증:**
```bash
# bmad-core 3단계 검증 재실행
Phase 1 (Documentation): 98% → 유지
Phase 2 (Implementation): 65% → 85%+ 목표
Phase 3 (Integration): 30% → 90%+ 목표
```

---

## 🚀 **즉시 실행할 수 있는 Action Items**

### **오늘 (24시간 내) 해야 할 일:**

```bash
# 1. Emergency Fixes 실행
cd client
npm install react-dnd react-dnd-html5-backend react-window

# 2. Store export 수정 (5분)
echo "export { useProjectStore, useProjectSelectors };" >> src/stores/projectStore.ts
echo "export { useUserStore, useUserSelectors };" >> src/stores/userStore.ts

# 3. AlertDialog 컴포넌트 추가 (10분)
npx shadcn-ui@latest add alert-dialog

# 4. 기본 동작 확인
npm run dev:client
# → http://localhost:3000/calendar-demo
# → http://localhost:3000/projects

# 5. 자동화 도구 테스트
node docs/implementation-verification/automation-tools/daily-sync-checker.js
```

### **내일 (48시간 내) 해야 할 일:**

```bash
# 1. Living Documentation 활성화
npx husky install
npx husky add .husky/pre-commit "node docs/implementation-verification/automation-tools/pre-commit-doc-sync.js"

# 2. Story 1.5 구현 시작
# ProjectCreateForm.tsx 뼈대 구현

# 3. TypeScript 오류 Top 20 해결
npm run type-check
# 가장 Critical한 오류들부터 해결
```

---

## 🔄 **브랜치 병합 및 완료 전략**

### **Tier별 완료 기준 및 병합 절차**

#### **Tier 1: Emergency Fixes 완료 시**
```bash
# Emergency fixes 브랜치에서 최종 검증
git checkout fix/tier1-emergency-fixes
npm run dev:client  # 빌드 성공 확인
npm run type-check  # TypeScript 오류 없음 확인

# 메인 리팩토링 브랜치로 병합
git checkout refactor/stories-1.1-1.10-fixes
git merge fix/tier1-emergency-fixes

# 통합 테스트 후 결과 확인
node docs/implementation-verification/automation-tools/daily-sync-checker.js

# 품질 점수 7.0 → 7.8+ 달성 확인 후 다음 Tier 진행
```

#### **전체 리팩토링 완료 시 master로 PR**
```bash
# 최종 품질 검증 기준
- 전체 품질 점수: 9.0/10+ 달성
- Critical Issues: 0개
- TypeScript 오류: 0개  
- ESLint 경고: 최소화

# master 브랜치로 PR 생성
gh pr create --title "🚀 Stories 1.1-1.10 Critical Issues 해결 및 품질 개선" \
  --body "전체 품질 점수 7.0→9.2 개선, Critical Issues 8개→0개 해결"
```

### **자동화 시스템 브랜치 연동**
- 각 브랜치에서 커밋 시 관련 Story 문서 자동 업데이트
- 브랜치별 품질 점수 추적  
- master 병합 시 최종 문서 상태 동기화

---

**📋 계획 요약**: 
- **브랜치 기반 안전한 리팩토링**: Emergency Fixes → Core Implementation → Quality Enhancement
- **Living Documentation System 전면 적용**: 문서-구현 실시간 동기화
- **자동화 도구**: 품질 모니터링 및 지속적 개선
- **목표**: 현재 7.0/10 → 9.0/10+ 품질 달성으로 배포 가능 상태 완성

브랜치 전략이 완전히 문서화되었습니다! 🚀