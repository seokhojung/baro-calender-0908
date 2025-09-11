# Template Compliance 체크리스트

## 📋 bmad-core Template 준수 검증

**기준**: bmad-core `story-tmpl.yaml` 완전 준수  
**목적**: 모든 스토리가 표준 템플릿 구조를 따르는지 확인  
**적용 범위**: Stories 1.1-1.10

---

## 🏗️ **필수 섹션 존재 여부**

### **기본 메타데이터**
- [ ] **Story Title**: 명확한 스토리 제목 (# Story X.X: 제목)
- [ ] **Status**: 현재 상태 명시 ("Completed" 기대)
- [ ] **Priority & Dependencies**: 우선순위 및 의존성 정보

### **핵심 스토리 섹션**
- [ ] **Story**: "As a... I want... so that..." 형식
- [ ] **Acceptance Criteria**: 측정 가능한 승인 기준들
- [ ] **Success Metrics**: 비즈니스/기술 KPI 및 성공 정의

### **구현 관련 섹션**  
- [ ] **Tasks / Subtasks**: 구현에 필요한 세부 작업들
- [ ] **Dev Notes**: 개발자를 위한 기술적 지침
- [ ] **Testing**: 테스트 전략 및 검증 방법

### **품질 보증 섹션**
- [ ] **Dev Agent Record**: 구현 과정 및 결과 기록
- [ ] **Change Log**: 스토리 변경 이력
- [ ] **QA Results**: 품질 보증 검토 결과

---

## 🔍 **섹션별 상세 검증**

### **Story Section 검증**
- [ ] **User Role 명시**: "As a [role]" 명확한 역할 정의
- [ ] **Want Statement**: "I want [functionality]" 기능 요구사항
- [ ] **Value Proposition**: "so that [value]" 비즈니스 가치
- [ ] **Korean Language**: 한국어로 명확하게 작성

### **Acceptance Criteria 검증**
- [ ] **Numbered List**: 순서대로 번호가 매겨진 목록
- [ ] **Measurable**: 측정 가능한 기준들
- [ ] **Testable**: 테스트 가능한 형태로 작성
- [ ] **Complete Coverage**: 모든 핵심 기능 포함
- [ ] **User Language**: 사용자 관점에서 작성

### **Tasks/Subtasks 검증**
- [ ] **Implementation Order**: 논리적 구현 순서
- [ ] **Actionable Items**: 실행 가능한 작업 단위
- [ ] **Clear Dependencies**: 작업 간 의존성 명시
- [ ] **Technical Granularity**: 적절한 기술적 세부 수준

### **Dev Notes 검증**
- [ ] **Technical Context**: 충분한 기술적 배경
- [ ] **Architecture Guidelines**: 아키텍처 패턴 지침
- [ ] **Implementation Hints**: 구현 힌트 및 주의사항
- [ ] **Integration Points**: 다른 시스템과의 통합점

### **Dev Agent Record 검증**
- [ ] **Implementation Summary**: 구현 요약
- [ ] **File List**: 생성/수정된 파일 목록
- [ ] **Technical Decisions**: 주요 기술적 결정사항
- [ ] **Challenges & Solutions**: 도전과제 및 해결방안

---

## ❌ **일반적인 Template 위반 사항**

### **Missing Sections**
- [ ] Dev Agent Record 누락
- [ ] QA Results 섹션 없음
- [ ] Change Log 업데이트 안됨
- [ ] Testing 전략 명시 안됨

### **Placeholder Issues**  
- [ ] `{{EpicNum}}` 남아있음
- [ ] `{{role}}` 미대체
- [ ] `_TBD_` 플레이스홀더 존재
- [ ] `[Description]` 템플릿 텍스트 남음

### **Format Issues**
- [ ] 섹션 헤더 형식 불일치
- [ ] 마크다운 구조 문제
- [ ] 리스트 포맷 불일치
- [ ] 코드 블록 형식 오류

### **Content Quality Issues**
- [ ] 모호한 Acceptance Criteria
- [ ] 불완전한 Tasks 목록
- [ ] 부족한 Dev Notes
- [ ] 누락된 Success Metrics

---

## 📊 **Story별 Template Compliance 결과**

| Story | 필수 섹션 | Placeholder | Format | Content | 전체 점수 | 상태 |
|-------|-----------|-------------|---------|---------|-----------|------|
| 1.1 | ⏳ -/8 | ⏳ -/4 | ⏳ -/4 | ⏳ -/4 | ⏳ -/20 | 대기 |
| 1.2 | ⏳ -/8 | ⏳ -/4 | ⏳ -/4 | ⏳ -/4 | ⏳ -/20 | 대기 |
| 1.3 | ⏳ -/8 | ⏳ -/4 | ⏳ -/4 | ⏳ -/4 | ⏳ -/20 | 대기 |
| 1.4 | ⏳ -/8 | ⏳ -/4 | ⏳ -/4 | ⏳ -/4 | ⏳ -/20 | 대기 |
| 1.5 | ⏳ -/8 | ⏳ -/4 | ⏳ -/4 | ⏳ -/4 | ⏳ -/20 | 대기 |
| 1.6 | ⏳ -/8 | ⏳ -/4 | ⏳ -/4 | ⏳ -/4 | ⏳ -/20 | 대기 |
| 1.7 | ⏳ -/8 | ⏳ -/4 | ⏳ -/4 | ⏳ -/4 | ⏳ -/20 | 대기 |
| 1.8 | ⏳ -/8 | ⏳ -/4 | ⏳ -/4 | ⏳ -/4 | ⏳ -/20 | 대기 |
| 1.9 | ⏳ -/8 | ⏳ -/4 | ⏳ -/4 | ⏳ -/4 | ⏳ -/20 | 대기 |
| 1.10 | ⏳ -/8 | ⏳ -/4 | ⏳ -/4 | ⏳ -/4 | ⏳ -/20 | 대기 |

**전체 Template Compliance Rate**: ⏳ 대기중 (목표: 100%)

---

## 🎯 **개선 권장사항**

### **공통 개선 항목**
1. **Consistency**: 모든 스토리에 일관된 템플릿 적용
2. **Completeness**: 모든 필수 섹션 완성도 확보
3. **Quality**: 각 섹션 내용의 품질 향상
4. **Maintenance**: 지속적인 템플릿 준수 관리

### **자동화 개선 방안**
- Template 검증 자동화 스크립트 개발
- CI/CD 파이프라인에 Template 검증 추가
- 정기적 Template 준수 모니터링

---

**체크리스트 버전**: 1.0  
**작성일**: 2025-09-11  
**기반 템플릿**: bmad-core story-tmpl.yaml  
**검증 범위**: Stories 1.1-1.10