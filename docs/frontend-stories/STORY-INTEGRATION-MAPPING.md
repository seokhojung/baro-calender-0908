# Story Integration & Mapping Table

**Purpose**: 스토리 통합, 번호 변경, 제거된 스토리들의 추적성 확보  
**Last Updated**: 2025-09-06  
**Updated By**: Documentation Cleanup Process

---

## 📋 **Story Integration Overview**

이 문서는 프로젝트 진행 중 발생한 스토리 통합, 번호 변경, 제거 사항들을 추적합니다.

---

## 🔄 **Integration & Changes Summary**

### **1. Number Remapping (번호 변경)**

| Original ID | Current ID | Title | Reason | Status |
|-------------|------------|-------|--------|---------|
| 2.10 | 2.8 | 보안 모범 사례 | 번호 체계 재정리 | ✅ Completed |

### **2. Story Mergers (스토리 통합)**

| Original Stories | Merged Into | Combined Title | Reason | Status |
|------------------|-------------|----------------|--------|---------|
| 2.11 (GraphQL API) | 2.9 | REST API 통합 시스템 | GraphQL → REST 아키텍처 결정 변경 | ✅ Completed |
| 2.19 (WebSocket) + 2.3 (실시간) | TBD | 통합 실시간 동기화 시스템 | 중복 기능 통합 | 🔄 In Progress |
| 1.2 + 2.1 | 1.2 | 통합 캘린더 시스템 | 캘린더 기능 통합 | ✅ Completed |

### **3. Story Splits (스토리 분할)**

| Original Story | Split Into | New Titles | Reason | Status |
|----------------|------------|------------|--------|---------|
| 1.1 | 1.1a, 1.1b, 1.1c | 프로젝트 초기화 세분화 | 복잡성 관리 | ✅ Completed |

---

## 📂 **Current File Mapping**

### **Existing Files (실제 존재하는 파일)**
```
✅ docs/frontend-stories/2.8.security-best-practices.md (원래 2.10)
✅ docs/frontend-stories/2.9.rest-api-integration.md (원래 2.11 GraphQL)
❌ docs/frontend-stories/2.10.*.md (존재하지 않음 - 2.8로 통합됨)
❌ docs/frontend-stories/2.11.*.md (존재하지 않음 - 2.9로 통합됨)
❌ docs/frontend-stories/2.19.*.md (존재하지 않음 - 2.3과 통합 예정)
```

### **Missing Integration Actions**
```
🔧 2.19 WebSocket + 2.3 실시간 동기화 통합 문서 필요
🔧 통합된 스토리들의 Definition of Done 업데이트 필요
🔧 STORY-STATUS.md와 STORY-BACKLOG-SUMMARY.md 번호 통일 필요
```

---

## 🗂️ **Complete Story List (통합 후 최종 목록)**

### **Epic 1: Foundation (1.x)**
```
1.1 → 1.1a, 1.1b, 1.1c (분할)
1.2 ← 1.2 + 2.1 통합 (캘린더)
1.3 (상태 관리)
1.4 (통합 캘린더 시스템)  
1.5 (프로젝트 CRUD)
1.6 (스케줄 CRUD)
1.7 (실시간 동기화)
1.8 (반복 일정)
1.9 (인증 보안)
1.10 (테마 구현)
```

### **Epic 2: Features (2.x)**
```
2.1 → 1.2로 통합됨
2.2 (모바일 PWA)
2.3 ← 2.3 + 2.19 통합 예정 (실시간)
2.4 (접근성)
2.5 (테스팅)
2.6 (에러 핸들링)
2.7 (CI/CD)
2.8 ← 2.10에서 번호 변경 (보안)
2.9 ← 2.11에서 변경 (API 통합)
2.12 (모니터링)
2.13 (Git 워크플로우)
...
2.20-2.26 (기타 스토리들)
```

---

## 🔍 **Documentation Cleanup Actions**

### **Immediate Actions Required**
1. ✅ Create this mapping document
2. 🔧 Update STORY-BACKLOG-SUMMARY.md numbering
3. 🔧 Update STORY-STATUS.md numbering  
4. 🔧 Create consolidated 2.3+2.19 document or merge notes
5. 🔧 Update dependency matrices

### **Verification Checklist**
- [ ] All existing files match current numbering scheme
- [ ] All references in planning docs use current numbers
- [ ] Integration rationale is documented
- [ ] No orphaned references to old story numbers

---

## 📊 **Impact Assessment**

### **✅ No Impact Areas**
- **Total Story Points**: Preserved through integration
- **Core Functionality**: All features maintained  
- **Critical Path**: Dependencies updated correctly
- **MVP Scope**: Unchanged

### **⚠️ Areas Requiring Attention**
- **Team Communication**: Ensure everyone uses current numbering
- **External References**: Update any external docs/tickets
- **Progress Tracking**: Map completion status of integrated stories

---

## 🔄 **Change Process**

**Future Story Changes Should:**
1. Update this mapping document first
2. Update all planning documents (STORY-STATUS.md, STORY-BACKLOG-SUMMARY.md)
3. Create migration notes for any file renames
4. Notify team of numbering changes
5. Update dependency references

---

**Document Maintained By**: Documentation Cleanup Process  
**Next Review Date**: When next story integration occurs  
**Version**: 1.0