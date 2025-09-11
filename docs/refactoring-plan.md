# 중간 검증 기반 리팩토링 계획

## 📋 **리팩토링 개요**

- **시작일**: 2025-09-11
- **예상 기간**: 2-4주 
- **목적**: 중간 검증에서 발견된 Critical Issues 해결 및 문서-구현 동기화
- **방법론**: bmad-core 기반 점진적 개선

---

## 🚨 **Critical Issues 우선순위**

### **Tier 1: Blocking Issues (24-48시간 내)**

**Issue #1: Store Export Crisis**
- **영향도**: ⚠️ Critical - 전체 시스템 마비
- **파일**: `src/stores/projectStore.ts`, `src/stores/userStore.ts`
- **문제**: useProjectStore, useUserStore 함수 export 누락
- **해결 방법**: 
  ```javascript
  // projectStore.ts 마지막에 추가
  export { useProjectStore, useProjectSelectors };
  
  // userStore.ts 마지막에 추가  
  export { useUserStore, useUserSelectors };
  ```

**Issue #2: UI Component Export Crisis**
- **영향도**: ⚠️ Critical - 프로젝트 관리 UI 차단
- **파일**: `src/components/ui/dialog.tsx`
- **문제**: AlertDialog 관련 컴포넌트 export 누락
- **해결 방법**: AlertDialog, AlertDialogContent 등 export 추가

**Issue #3: Missing Dependencies**
- **영향도**: ⚠️ Critical - 핵심 기능 불가
- **해결 방법**: 
  ```bash
  npm install react-dnd react-dnd-html5-backend react-window
  ```

### **Tier 2: High Priority Issues (1주일 내)**

**Issue #4: 미완성 핵심 컴포넌트**
- Story 1.5: 프로젝트 CRUD 컴포넌트 50% 미완성
- Story 1.6: 스케줄 관리 시스템 60% 미완성

**Issue #5: TypeScript/ESLint 대량 오류**
- 200+ TypeScript 오류
- 300+ ESLint 위반

---

## 📋 **문서-구현 동기화 전략**

### **Strategy 1: Status 재조정**
- "Completed" → "In Progress - Refactoring" 변경
- Critical Issues 발견된 스토리는 솔직하게 상태 조정

### **Strategy 2: Dev Agent Record 실시간 업데이트**
- 실제 구현 상태 반영
- 발견된 문제점 명시
- 해결 진행 상황 추적

### **Strategy 3: QA Results 강화**
- 중간 검증 결과 반영
- Critical Issues 명시
- 해결 계획 수립

---

## 🔄 **점진적 리팩토링 계획**

### **Week 1: Emergency Fixes**
- [ ] Critical Issues 3개 해결
- [ ] 문서 Status 업데이트
- [ ] 기본 기능 복구 확인

### **Week 2: Core Features Completion**
- [ ] Story 1.5, 1.6 완성
- [ ] Apollo-Zustand 통합 완료
- [ ] 에러 바운더리 구현

### **Week 3: Code Quality**
- [ ] TypeScript 오류 해결
- [ ] ESLint 규칙 준수
- [ ] 테스트 환경 구축

### **Week 4: Final Integration**
- [ ] 전체 시스템 통합 테스트
- [ ] 성능 최적화
- [ ] 문서 최종 동기화

---

**업데이트**: 2025-09-11  
**책임자**: Development Team  
**검토자**: bmad-core Verification Agent