# 📋 스토리 작성 필수 룰 가이드

## 📖 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-20
- **작성자**: Scrum Master Bob
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 개발 프로세스 및 룰

---

## 🚨 **절대 금지 사항 (CRITICAL RULES)**

### **1. 문서 생략 금지**
- ❌ **절대 금지**: UI Architecture 문서를 생략하거나 건너뛰기
- ❌ **절대 금지**: 빠르게 작업하기 위해 문서 내용 생략
- ❌ **절대 금지**: 아무리 코드가 길어도 생략하고 스토리 작성
- ✅ **필수**: 모든 문서를 빠짐없이 읽고 분석하여 스토리에 반영

### **2. 백업 문서 사용 금지**
- ❌ **절대 금지**: `docs-backup-20250819/` 폴더의 문서 사용
- ❌ **절대 금지**: 백업이라고 명시된 폴더의 문서 참조
- ✅ **필수**: 활성 `docs/` 폴더의 문서만 사용
- ✅ **우선순위**: `docs/ui-ux/` 폴더 우선 참조

---

## 📚 **필수 참조 문서 목록**

### **1. UI Architecture 문서 (절대 생략 금지)**
```
docs/ui-architecture/
├── 01-frontend-tech-stack.md (77줄) ✅ 완벽 반영 필수
├── 02-project-structure.md (171줄) ✅ 완벽 반영 필수
├── 03-component-standards.md (357줄) ✅ 완벽 반영 필수
├── 04-state-management.md (48줄) ✅ 완벽 반영 필수
├── 05-styling-strategy.md (994줄) ✅ 완벽 반영 필수
├── 06-performance-optimization.md (710줄) ✅ 완벽 반영 필수
├── 07-security-accessibility.md (921줄) ✅ 완벽 반영 필수
├── 08-mobile-api-integration.md (1259줄) ✅ 완벽 반영 필수
├── 09-monitoring-testing.md (293줄) ✅ 완벽 반영 필수
├── 10-project-setup-guide.md ✅ 완벽 반영 필수
├── 11-mvp-roadmap.md ✅ 완벽 반영 필수
├── 12-development-checklist.md ✅ 완벽 반영 필수
├── 13-server-state-management.md ✅ 완벽 반영 필수
├── 14-error-handling.md ✅ 완벽 반영 필수
├── 15-observability-monitoring.md ✅ 완벽 반영 필수
└── 16-ci-pipeline-performance.md ✅ 완벽 반영 필수
```

**총 6,222줄의 모든 내용을 생략 없이 완벽하게 반영해야 함!**

### **2. BMad 워크플로우 문서**
```
.bmad-core/
├── agents/sm.md ✅ Scrum Master 역할 및 룰
├── tasks/create-next-story.md ✅ 스토리 생성 태스크
├── templates/story-tmpl.yaml ✅ 스토리 템플릿
├── checklists/story-draft-checklist.md ✅ 스토리 검증 체크리스트
└── workflows/greenfield-ui.yaml ✅ UI 개발 워크플로우
```

### **3. ShadCN UI 워크플로우 문서**
```
docs/architecture/shadcn-ui-workflow-rules.md ✅ ShadCN UI 룰
```

---

## 🎯 **BMad 워크플로우 룰**

### **Scrum Master 역할 (절대 준수)**
- ✅ **허용**: 스토리 작성, 에픽 관리, 애자일 프로세스 가이드
- ❌ **금지**: 코드 구현, 코드 수정, 직접 개발 작업
- 🎯 **목표**: 개발자 핸드오프를 위한 명확하고 상세한 스토리 작성

### **스토리 작성 프로세스**
1. **코어 설정 확인**: `.bmad-core/core-config.yaml` 로드
2. **다음 스토리 식별**: Epic 파일 및 기존 스토리 검토
3. **요구사항 수집**: Epic 파일에서 스토리 요구사항 추출
4. **아키텍처 컨텍스트**: UI Architecture 문서 완벽 읽기
5. **프로젝트 구조 검증**: 파일 경로 및 구조 정렬 확인
6. **스토리 템플릿 작성**: 모든 섹션 완벽 작성
7. **체크리스트 실행**: 스토리 검증 및 품질 확인

---

## 🎨 **ShadCN UI 워크플로우 룰**

### **MCP 서버 우선 활용**
```
1. list components - 사용 가능한 컴포넌트 목록
2. list blocks - 사용 가능한 블록 목록  
3. get component demo [component-name] - 특정 컴포넌트 예시 코드
4. get block [block-name] - 특정 블록 소스 코드
```

### **ShadCN UI Blocks 우선 사용**
- **우선순위 1**: `calendar-26.tsx` (월/주 뷰 전환 캘린더)
- **우선순위 2**: `sidebar-02.tsx` (프로젝트 네비게이션 사이드바)
- **우선순위 3**: `dashboard-01.tsx` (전체 레이아웃 구조)

### **컴포넌트 표준**
- **ShadCN UI v4**: Radix UI 기반, 접근성 우선
- **테마 시스템**: Tweak CN 테마 시스템 통합
- **컴포넌트 패턴**: Compound Component, Render Props, Custom Hook

---

## 📝 **스토리 작성 필수 요소**

### **1. 기본 구조 (Story Template 준수)**
- **Status**: Draft/Approved/InProgress/Review/Done
- **Story**: As a... I want... so that... 형식
- **Acceptance Criteria**: Epic에서 추출한 AC 목록
- **Tasks/Subtasks**: 기술적 태스크 및 서브태스크
- **Dev Notes**: 모든 기술적 세부사항 및 아키텍처 참조
- **Testing**: 단위/통합/E2E/접근성/성능 테스트
- **Change Log**: 변경 이력 추적

### **2. Dev Notes 섹션 필수 내용**
```
Dev Notes 섹션 (CRITICAL):
- 이 섹션은 반드시 UI Architecture 문서에서 추출한 정보만 포함
- 절대 새로운 기술적 세부사항을 발명하거나 가정하지 말 것
- 모든 기술적 세부사항은 반드시 소스 참조 포함
- 소스 참조 형식: [Source: architecture/{filename}.md#{section}]
```

### **3. 기술적 세부사항 카테고리**
- **이전 스토리 인사이트**: 주요 학습 내용 및 교훈
- **데이터 모델**: 스키마, 검증 규칙, 관계
- **API 명세**: 엔드포인트 세부사항, 요청/응답 형식
- **컴포넌트 명세**: UI 컴포넌트 세부사항, props, 상태 관리
- **파일 위치**: 프로젝트 구조 기반 정확한 경로
- **테스트 요구사항**: 테스트 전략에서 추출한 구체적 요구사항
- **기술적 제약**: 버전 요구사항, 성능 고려사항, 보안 규칙

---

## 🔍 **문서 읽기 전략**

### **1. 전체 문서 읽기 (절대 생략 금지)**
```typescript
// ❌ 잘못된 방법 (100줄까지만 읽기)
read_file(target_file, should_read_entire_file: false, start_line: 1, end_line: 100)

// ✅ 올바른 방법 (전체 문서 읽기)
read_file(target_file, should_read_entire_file: true, start_line: 1, end_line: 200)
```

### **2. 문서 읽기 순서**
1. **UI Architecture 문서**: 모든 16개 문서 완벽 읽기
2. **BMad 워크플로우**: `.bmad-core/` 폴더 모든 문서 읽기
3. **ShadCN UI 룰**: `shadcn-ui-workflow-rules.md` 완벽 읽기
4. **PRD 및 Epic**: 스토리 요구사항 및 수용 기준 추출

### **3. 내용 분석 및 정리**
- **기술 스택**: 모든 기술 선택 근거 및 버전 정보
- **프로젝트 구조**: 폴더 구조, 명명 규칙, 파일 경로
- **컴포넌트 표준**: 컴포넌트 패턴, 재사용 전략
- **상태 관리**: 상태 관리 전략, 도구 선택 근거
- **성능 최적화**: Core Web Vitals 목표, 최적화 전략
- **보안 및 접근성**: 보안 기준, WCAG 준수 요구사항

---

## ✅ **스토리 검증 체크리스트**

### **1. 문서 참조 완성도**
- [ ] UI Architecture 모든 16개 문서 완벽 반영
- [ ] BMad 워크플로우 룰 완벽 준수
- [ ] ShadCN UI 워크플로우 룰 완벽 반영
- [ ] 모든 기술적 세부사항에 소스 참조 포함
- [ ] 백업 문서 사용하지 않음

### **2. 기술적 완성도**
- [ ] 모든 Acceptance Criteria에 대응하는 태스크 포함
- [ ] 구체적인 파일 경로 및 컴포넌트 구조 명시
- [ ] 성능 목표 및 KPI 명확히 정의
- [ ] 테스트 전략 및 요구사항 상세 포함
- [ ] 보안 및 접근성 기준 명시

### **3. 개발자 핸드오프 준비도**
- [ ] 개발자가 추가 연구 없이 바로 구현 가능
- [ ] 모든 기술적 제약 및 요구사항 명확히 정의
- [ ] UI Architecture 문서 재참조 불필요
- [ ] 명확한 태스크 순서 및 우선순위 제시

---

## 🚀 **성공적인 스토리 작성 예시**

### **Story 2.1 완성 사례**
- **UI Architecture 문서**: 6,222줄 모든 내용 완벽 반영 ✅
- **BMad 워크플로우**: Scrum Master 역할 완벽 준수 ✅
- **ShadCN UI 룰**: MCP 서버 및 블록 우선 활용 ✅
- **기술적 세부사항**: 모든 카테고리 완벽 포함 ✅
- **소스 참조**: 모든 기술적 내용에 정확한 참조 포함 ✅

---

## ⚠️ **경고 및 주의사항**

### **1. 자주 발생하는 실수**
- ❌ **문서 부분 읽기**: 100줄까지만 읽고 생략
- ❌ **백업 문서 사용**: `docs-backup-` 폴더 참조
- ❌ **기술적 내용 발명**: 아키텍처 문서에 없는 내용 추가
- ❌ **소스 참조 누락**: 기술적 세부사항에 참조 없음

### **2. 품질 검증 방법**
- **자체 검증**: 스토리 작성 후 체크리스트 실행
- **동료 검토**: 다른 팀원의 스토리 검토 요청
- **PO 검증**: Product Owner의 스토리 검증 요청
- **개발자 피드백**: 개발자 관점에서 명확성 확인

---

## 📋 **체크리스트 실행 명령어**

```bash
# 스토리 작성 후 체크리스트 실행
.bmad-core/tasks/execute-checklist .bmad-core/checklists/story-draft-checklist

# 스토리 검증 (PO 권장)
.bmad-core/tasks/validate-next-story
```

---

## 🎯 **최종 목표**

**"UI Architecture 문서의 모든 6,222줄 내용을 생략 없이 완벽하게 반영하고, BMad 워크플로우와 ShadCN 룰을 완벽하게 준수한 모범적인 스토리 작성"**

---

## 📝 **변경 이력**

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-20 | 1.0 | 스토리 작성 필수 룰 가이드 초기 생성 | Scrum Master Bob |

---

**이 문서는 스토리 작성 시 절대적으로 준수해야 할 모든 룰을 포함하고 있습니다. 이 룰을 위반하면 스토리 품질이 크게 저하되므로 반드시 준수하세요!** 🚨✨
