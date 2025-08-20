# ShadCN UI Workflow Rules

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 개발 워크플로우, UI 표준

---

## 🎯 **개요**

이 문서는 바로캘린더 프로젝트에서 **ShadCN UI 관련 작업을 수행할 때 반드시 따라야 하는 워크플로우 규칙**을 정의합니다.

**모든 ShadCN UI 관련 작업은 이 규칙을 무조건 준수해야 합니다.**

---

## 📋 **1. ShadCN UI 관련 작업은 무조건 MCP 서버를 사용한다**

### **규칙 설명**
- **MCP 서버 외 사용 금지**: ShadCN UI 컴포넌트나 블록을 직접 작성하지 않음
- **항상 최신 정보 확인**: MCP 서버를 통해 최신 ShadCN UI 정보 획득
- **일관성 보장**: 모든 개발자가 동일한 MCP 서버 사용

### **MCP 서버 호출 방법**
```bash
# 컴포넌트 목록 확인
mcp_shadcn-ui-mcp_list_components

# 블록 목록 확인  
mcp_shadcn-ui-mcp_list_blocks

# 특정 컴포넌트 데모 확인
mcp_shadcn-ui-mcp_get_component_demo {component-name}

# 특정 블록 소스 코드 확인
mcp_shadcn-ui-mcp_get_block {block-name}
```

---

## 🎨 **2. UI 기획 단계**

### **2.1 list components / list blocks 를 먼저 호출한다**

**순서:**
1. **컴포넌트 목록 확인**: `mcp_shadcn-ui-mcp_list_components`
2. **블록 목록 확인**: `mcp_shadcn-ui-mcp_list_blocks`
3. **사용 가능한 옵션 파악**: 컴포넌트 vs 블록 비교

### **2.2 코드 대신 "컴포넌트 이름"과 "배치 위치"만 문서화한다**

**문서화 방식:**
```markdown
# ❌ 잘못된 방식 (코드 포함)
```tsx
export const Button = () => { ... }
```

# ✅ 올바른 방식 (구조만 문서화)
src/components/ui/button.tsx    # 기본 버튼 컴포넌트
src/components/layout/Header.tsx # ShadCN UI: button, tabs, badge
```

### **2.3 blocks 가 있으면 단일 컴포넌트보다 blocks 를 우선 사용한다**

**우선순위:**
1. **Blocks 우선**: 복잡한 UI는 blocks 기반 설계
2. **단일 컴포넌트**: 간단한 UI만 단일 컴포넌트 조합
3. **하이브리드**: blocks + 단일 컴포넌트 조합

**예시:**
```markdown
# Calendar UI 설계
- calendar-26.tsx (4,362 bytes) 우선 사용 → 월/주 뷰 전환
- 단일 calendar.tsx 컴포넌트는 보조적으로 사용
```

---

## 🔧 **3. 구현 단계**

### **3.1 get component demo 를 먼저 호출해 올바른 코드 예시를 확보한다**

**구현 순서:**
1. **데모 코드 확인**: `mcp_shadcn-ui-mcp_get_component_demo {name}`
2. **코드 분석**: ShadCN UI의 공식 구현 방식 파악
3. **요구사항 매핑**: 프로젝트 요구사항과 비교

### **3.2 확보한 예시를 기반으로 구현한다**

**구현 원칙:**
- **ShadCN UI 공식 코드 기반**: 직접 작성하지 않음
- **Props 확장**: 프로젝트 요구사항에 맞게 인터페이스 확장
- **스타일 커스터마이징**: Tweak CN 테마 활용

### **3.3 복잡한 UI는 blocks 기반으로 확장한다**

**확장 방식:**
1. **Blocks 소스 코드 확인**: `mcp_shadcn-ui-mcp_get_block {name}`
2. **필요 부분 추출**: 프로젝트에 필요한 부분만 선택
3. **커스터마이징**: 프로젝트 요구사항에 맞게 수정

---

## 🎨 **4. 스타일 변경**

### **4.1 Tweak CN 테마를 설치 코드로 적용한다**

**테마 적용 순서:**
1. **Tweak CN 설치**: `npx tweak-cn@latest init`
2. **테마 설정**: `npx tweak-cn@latest add`
3. **커스텀 색상**: 프로젝트별 8가지 색상 시스템 적용

### **4.2 자동 설치 실패 시, 제공된 설정값을 직접 반영한다**

**수동 적용 방법:**
1. **tailwind.config.js**: 색상 팔레트 직접 설정
2. **CSS 변수**: 디자인 토큰 직접 정의
3. **컴포넌트 스타일**: 개별 컴포넌트 스타일 오버라이드

---

## 🔍 **5. 유지보수 & 검증**

### **5.1 반응형, 다크모드, 접근성을 확인한다**

**검증 항목:**
- **반응형**: 모바일, 태블릿, 데스크톱 레이아웃
- **다크모드**: 테마 전환 시 스타일 일관성
- **접근성**: WCAG AA 기준 준수, 키보드 네비게이션

### **5.2 문제가 생기면 MCP 서버를 다시 호출해 최신 예시를 확인한다**

**문제 해결 순서:**
1. **MCP 서버 재호출**: 최신 ShadCN UI 정보 확인
2. **데모 코드 재확인**: 변경된 구현 방식 파악
3. **기존 코드 업데이트**: 최신 방식에 맞게 수정

---

## 📚 **6. 바로캘린더 프로젝트 적용 사례**

### **6.1 MCP 서버 분석 결과**

**사용 가능한 컴포넌트: 46개**
**사용 가능한 Blocks:**
- Calendar: 32개 (calendar-26.tsx 우선 사용)
- Sidebar: 16개 (sidebar-02.tsx 우선 사용)
- Dashboard: 1개 (dashboard-01.tsx 우선 사용)

### **6.2 컴포넌트 배치 전략**

```markdown
# 기본 UI 컴포넌트
src/components/ui/
├── button.tsx           # 기본 버튼
├── input.tsx            # 입력 필드
├── select.tsx           # 선택 드롭다운
├── checkbox.tsx         # 체크박스
├── tabs.tsx             # 탭 (월/주 뷰 전환)
├── calendar.tsx         # 날짜 선택
├── card.tsx             # 카드 (이벤트 표시)
├── dialog.tsx           # 다이얼로그
├── sheet.tsx            # 시트 (모바일 사이드바)
├── scroll-area.tsx      # 스크롤 영역
├── badge.tsx            # 배지
├── separator.tsx        # 구분선
└── index.ts             # 컴포넌트 내보내기

# 복잡한 UI는 Blocks 우선
src/components/calendar/CalendarContainer.tsx    # calendar-26.tsx 기반
src/components/layout/Sidebar.tsx                # sidebar-02.tsx 기반
src/components/layout/Layout.tsx                 # dashboard-01.tsx 기반
```

---

## ⚠️ **7. 주의사항**

### **7.1 절대 금지 사항**
- ❌ **ShadCN UI 코드 직접 작성**: MCP 서버 사용 필수
- ❌ **구식 컴포넌트 사용**: 최신 ShadCN UI v4 사용
- ❌ **일관성 없는 스타일**: Tweak CN 테마 시스템 준수

### **7.2 권장 사항**
- ✅ **MCP 서버 우선 사용**: 항상 최신 정보 확인
- ✅ **Blocks 우선 설계**: 복잡한 UI는 blocks 기반
- ✅ **성능 목표 준수**: 150ms, 60fps 달성
- ✅ **접근성 표준 준수**: WCAG AA 기준

---

## 🔧 **8. 수동 적용 허용 조건**

### **8.1 MCP 서버 사용 불가 상황**

**수동 적용이 허용되는 조건:**
- **MCP 서버 장애**: 서버 다운타임 또는 네트워크 연결 불가
- **네트워크 제약**: 보안 정책으로 인한 외부 서버 접근 제한
- **신규 컴포넌트 미지원**: MCP에서 지원하지 않는 최신 ShadCN UI 컴포넌트
- **보안 정책**: 패키지 설치 제한으로 인한 MCP 도구 사용 불가
- **개발 환경 제약**: 오프라인 환경 또는 제한된 개발 환경

### **8.2 임시 허용 절차**

**수동 적용 시 필수 조건:**
- **이슈 티켓 생성**: 배경, 영향 영역, 대안, 리스크, 회수 계획 서술
- **리뷰어 승인**: UI 리드 1인 + FE 리드 1인 승인 필요
- **문서화**: 수동 적용 이유와 대안 방안 명시
- **일정 제한**: 최대 2주간 임시 허용, 이후 MCP 사용으로 전환

---

## 📋 **9. 예외 승인·회수 절차**

### **9.1 예외 승인 프로세스**

**1단계: 이슈 생성**
```markdown
## 수동 ShadCN UI 적용 요청

### 배경
- MCP 서버 장애 상황
- 신규 컴포넌트 미지원
- 보안 정책 상 패키지 설치 제한

### 영향 영역
- 컴포넌트: [컴포넌트명]
- 파일 경로: [파일 경로]
- 예상 작업 시간: [시간]

### 대안 방안
- MCP 서버 복구 대기
- 수동 코드 작성 후 추후 MCP 규격으로 재생성
- 대체 컴포넌트 사용 검토

### 리스크
- 코드 일관성 저하
- 추후 유지보수 복잡성 증가
- MCP 워크플로우 이탈

### 회수 계획
- MCP 지원 복구 시 즉시 전환
- 수동 코드를 MCP 규격으로 재생성
- 원본 수동 코드 폐기
```

**2단계: 승인자 검토**
- **UI 리드**: 디자인 일관성 및 사용자 경험 검토
- **FE 리드**: 기술적 구현 및 아키텍처 검토
- **승인 조건**: 두 명 모두 승인 시에만 진행

**3단계: 승인 및 진행**
- 승인된 이슈에 대한 수동 적용 진행
- 적용 과정 및 결과 문서화
- 회수 계획 수립 및 일정 설정

### **9.2 예외 회수 프로세스**

**1단계: MCP 지원 복구 확인**
- MCP 서버 정상 작동 확인
- 해당 컴포넌트 MCP 지원 여부 확인
- MCP 규격 코드 생성 테스트

**2단계: 코드 재생성**
- MCP 서버를 통한 컴포넌트 재생성
- 수동 코드와 MCP 코드 비교 검증
- 기능 및 스타일 일치성 확인

**3단계: 원본 폐기**
- 수동 코드 완전 제거
- MCP 규격 코드로 교체
- 이슈 티켓 종료 및 문서 업데이트

---

## 📝 **10. MCP 생성물 주석 템플릿**

### **10.1 컴포넌트 주석 템플릿**

**ShadCN UI 컴포넌트 주석**
```tsx
/**
 * Source: shadcn-ui-mcp
 * Command: mcp_shadcn-ui-mcp_get_component_demo button
 * Component: Button
 * Version: v4.0.0
 * GeneratedAt: 2025-08-20T00:00:00Z
 * MCP Server: shadcn-ui-mcp-server
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // 컴포넌트 구현...
  }
)
```

**ShadCN UI Blocks 주석**
```tsx
/**
 * Source: shadcn-ui-mcp
 * Command: mcp_shadcn-ui-mcp_get_block calendar-26
 * Block: Calendar (calendar-26.tsx)
 * Version: v4.0.0
 * GeneratedAt: 2025-08-20T00:00:00Z
 * MCP Server: shadcn-ui-mcp-server
 * Block Size: 4,362 bytes
 * Description: 월/주 뷰 전환 기능이 포함된 캘린더 컴포넌트
 */
export const CalendarContainer = () => {
  // 블록 구현...
}
```

### **10.2 주석 검증 규칙**

**주석 필수 요소:**
- ✅ **Source**: MCP 서버 출처 명시
- ✅ **Command**: 실행된 MCP 명령어
- ✅ **Component/Block**: 생성된 컴포넌트/블록명
- ✅ **Version**: ShadCN UI 버전
- ✅ **GeneratedAt**: 생성 시간 (ISO 8601 형식)
- ✅ **MCP Server**: 사용된 MCP 서버명

**주석 검증 체크리스트:**
- [ ] 모든 필수 요소가 포함되었는가?
- [ ] 명령어가 정확하게 기록되었는가?
- [ ] 생성 시간이 ISO 8601 형식인가?
- [ ] 버전 정보가 정확한가?

---

## 💻 **11. 실행 커맨드 예시(복붙용)**

### **11.1 MCP 서버 기본 명령어**

**MCP 서버 실행 및 연결**
```bash
# MCP 서버 실행
npx shadcn-ui-mcp-server

# MCP 서버 상태 확인
npx shadcn-ui-mcp-server --status

# MCP 서버 버전 확인
npx shadcn-ui-mcp-server --version

# MCP 서버 도움말
npx shadcn-ui-mcp-server --help
```

### **11.2 컴포넌트 관련 명령어**

**컴포넌트 목록 및 정보 조회**
```bash
# 사용 가능한 컴포넌트 목록 조회
mcp_shadcn-ui-mcp_list_components

# 특정 컴포넌트 데모 코드 조회
mcp_shadcn-ui-mcp_get_component_demo button

# 특정 컴포넌트 메타데이터 조회
mcp_shadcn-ui-mcp_get_component_metadata button

# 특정 컴포넌트 소스 코드 조회
mcp_shadcn-ui-mcp_get_component button
```

### **11.3 블록 관련 명령어**

**블록 목록 및 정보 조회**
```bash
# 사용 가능한 블록 목록 조회
mcp_shadcn-ui-mcp_list_blocks

# 특정 블록 소스 코드 조회
mcp_shadcn-ui-mcp_get_block calendar-26

# 특정 카테고리 블록 목록 조회
mcp_shadcn-ui-mcp_list_blocks --category calendar

# 블록 디렉토리 구조 조회
mcp_shadcn-ui-mcp_get_directory_structure
```

### **11.4 환경 변수 설정**

**토큰 및 인증 설정**
```bash
# Windows 환경변수 설정
set GITHUB_TOKEN=ghp_your_github_token_here
set NPM_TOKEN=npm_your_npm_token_here

# macOS/Linux 환경변수 설정
export GITHUB_TOKEN=ghp_your_github_token_here
export NPM_TOKEN=npm_your_npm_token_here

# .env 파일 생성
echo "GITHUB_TOKEN=ghp_your_github_token_here" > .env
echo "NPM_TOKEN=npm_your_npm_token_here" >> .env
```

### **11.5 문제 해결 명령어**

**일반적인 문제 해결**
```bash
# MCP 서버 재시작
npx shadcn-ui-mcp-server --restart

# MCP 서버 캐시 정리
npx shadcn-ui-mcp-server --clear-cache

# MCP 서버 로그 확인
npx shadcn-ui-mcp-server --logs

# MCP 서버 진단
npx shadcn-ui-mcp-server --diagnose

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 **12. 바로캘린더 프로젝트 적용 사례**

### **12.1 MCP 서버 분석 결과**

**사용 가능한 컴포넌트: 46개**
**사용 가능한 Blocks:**
- Calendar: 32개 (calendar-26.tsx 우선 사용)
- Sidebar: 16개 (sidebar-02.tsx 우선 사용)
- Dashboard: 1개 (dashboard-01.tsx 우선 사용)

### **12.2 컴포넌트 배치 전략**

```markdown
# 기본 UI 컴포넌트
src/components/ui/
├── button.tsx           # 기본 버튼
├── input.tsx            # 입력 필드
├── select.tsx           # 선택 드롭다운
├── checkbox.tsx         # 체크박스
├── tabs.tsx             # 탭 (월/주 뷰 전환)
├── calendar.tsx         # 날짜 선택
├── card.tsx             # 카드 (이벤트 표시)
├── dialog.tsx           # 다이얼로그
├── sheet.tsx            # 시트 (모바일 사이드바)
├── scroll-area.tsx      # 스크롤 영역
├── badge.tsx            # 배지
├── separator.tsx        # 구분선
└── index.ts             # 컴포넌트 내보내기

# 복잡한 UI는 Blocks 우선
src/components/calendar/CalendarContainer.tsx    # calendar-26.tsx 기반
src/components/layout/Sidebar.tsx                # sidebar-02.tsx 기반
src/components/layout/Layout.tsx                 # dashboard-01.tsx 기반
```

### **12.3 MCP 워크플로우 적용 예시**

**캘린더 컴포넌트 구현 과정**
```bash
# 1. 사용 가능한 블록 확인
mcp_shadcn-ui-mcp_list_blocks --category calendar

# 2. 우선순위 블록 선택 (calendar-26.tsx)
mcp_shadcn-ui-mcp_get_block calendar-26

# 3. 블록 소스 코드 분석 및 적용
# 4. 프로젝트 요구사항에 맞게 커스터마이징
# 5. MCP 주석 템플릿 적용
```

---

## 📝 **13. Change Log**

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-19 | 1.0 | 초기 ShadCN UI Workflow Rules 작성 | Architect Winston |
| 2025-08-20 | 1.1 | 수동 허용/예외 승인·회수/주석 템플릿/명령 예시 추가 | Architect Winston |

---

## 🎯 **14. 다음 단계**

이 워크플로우 규칙을 준수하여:

1. **Component Standards**: ShadCN UI 기반으로 완성 ✅
2. **State Management**: 다음 섹션 진행 예정
3. **실제 구현**: MCP 서버 활용하여 단계별 구현
4. **품질 보장**: 수동 적용 시 예외 절차 준수

---

**문서 상태**: ✅ **Active (개발 표준으로 사용)**  
**적용 범위**: 모든 ShadCN UI 관련 작업  
**검토 주기**: ShadCN UI 업데이트 시마다 재검토  
**최신 업데이트**: 2025-08-20 - 수동 허용 절차 및 MCP 주석 템플릿 추가
