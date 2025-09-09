# 📋 스토리 구현 자동화 가이드 (Story Implementation Automation)

**버전**: 1.0  
**작성일**: 2025-09-06  
**목적**: bmad-core 에이전트를 활용한 스토리 구현의 완전 자동화  

---

## 🎯 **자동화 개요**

**워크플로우**: Dev(구현) → PO(검증) → 개선처리 → 승인 → 상태업데이트  
**목표**: 80% 자동화, 20% 사용자 확인으로 안전하고 효율적인 스토리 처리  
**원칙**: bmad-core 에이전트 절차 완전 준수, 기존 파일 업데이트만 수행  

---

## 🚀 **사용법**

### **기본 명령:**
```
"스토리 X.Y 구현 자동화 실행"
```

### **예시:**
```
"스토리 1.4 구현 자동화 실행"
"스토리 2.1 구현 자동화 실행"  
```

### **실행 시 이 가이드를 순차적으로 따라 진행**

---

## 1️⃣ **Dev 에이전트 (James) - 스토리 구현 단계**

### 🔧 **정확한 호출 절차:**
```
"bmad-core의 dev 에이전트를 호출하여 Story {N} 구현해줘. dev.md 절차를 생략하지 말고 완전히 준수해줘"
```

### ✅ **Dev 에이전트 필수 체크리스트:**
- [ ] **bmad-core/agents/dev.md** 파일을 완전히 읽고 activation-instructions 정확히 준수
- [ ] **James 페르소나** 완전히 채택 (Expert Senior Software Engineer & Implementation Specialist)
- [ ] **devLoadAlwaysFiles** 모든 파일 로드:
  - [ ] docs/architecture/coding-standards.md
  - [ ] docs/architecture/tech-stack.md
  - [ ] docs/architecture/source-tree.md
  - [ ] docs/architecture/development-environment.md
- [ ] 할당된 **story 파일** 완전히 읽기 (`docs/frontend-stories/{N}.*.md`)
- [ ] **`*develop-story`** 명령어 정확히 실행 (명령어 없이 바로 시작 절대 금지)
- [ ] **order-of-execution** 엄격히 준수:
  - [ ] Read task → Implement → Write tests → Execute validations → Update checkbox [x] → Update File List
- [ ] **story-file-updates-ONLY** 규칙 준수:
  - [ ] ✅ **Dev Agent Record 섹션만** 업데이트
  - [ ] ✅ Tasks/Subtasks 체크박스 [x] 완료 표시
  - [ ] ✅ File List 업데이트
  - [ ] ✅ Change Log 업데이트
  - [ ] ✅ Status 변경
  - [ ] ❌ Story, Acceptance Criteria, Dev Notes 섹션 수정 금지
- [ ] **모든 Tasks/Subtasks [x]** 완료까지 중단 없이 진행
- [ ] **테스트 실행** 및 모든 validation 통과
- [ ] **🚨 CRITICAL: Definition of Done 체크리스트 업데이트** (2025-09-06 추가)
  - [ ] Definition of Done 섹션의 모든 `[ ]`를 `[x]`로 변경
  - [ ] Dev Agent Record와 Definition of Done 일치 확인
  - [ ] 누락된 체크박스 없는지 검증
- [ ] **Story Status**: "Ready for Review"로 변경
- [ ] **execute-checklist** 실행 (story-dod-checklist)

### ⚠️ **Dev 에이전트 흔한 실수 방지:**
- ❌ dev.md 대충 읽고 넘어가기
- ❌ James 페르소나 채택 안하고 바로 시작
- ❌ devLoadAlwaysFiles 로드 생략
- ❌ *develop-story 명령어 없이 바로 구현 시작  
- ❌ Dev Agent Record 외 다른 섹션 수정
- ❌ Tasks 완료 전에 중단하거나 일부만 처리
- ❌ 테스트 실행 생략
- ❌ File List 업데이트 누락
- ❌ **Definition of Done 체크리스트 업데이트 누락** (2025-09-06 추가)
- ❌ Dev Agent Record만 작성하고 Definition of Done은 미체크 상태 방치

### 🎯 **Dev 에이전트 완료 확인:**
- [ ] All Tasks marked [x] and have tests
- [ ] Validations and full regression pass
- [ ] **Definition of Done 모든 체크박스 [x] 완료** (2025-09-06 추가)
- [ ] File List is complete
- [ ] Story status: "Ready for Review"
- [ ] James가 완료 메시지 출력

---

---

## 🔄 **Dev 완료 시 자동 PO 검수 진행 프로세스**

### 📋 **Dev Agent 완료 후 필수 자동 진행 절차** (2025-09-06 추가)

**Dev Agent (James)가 Story 완료 보고 시 자동 실행:**

```
🛡️ Dev 완료 → 자동 PO 검수 프로세스 시작

Step 1: Dev 완료 검증
👉 Definition of Done 체크리스트 모두 [x] 확인
👉 Story Status "Ready for Review" 확인
👉 File List 완성도 확인

Step 2: 자동 PO Agent 호출
👉 "bmad-core 자동화에 따라 Sarah (PO Agent)를 호출하여 검증 진행하겠습니다"
👉 Sarah 호출 → *validate-story-draft 실행
👉 SAFE/REVIEW/MANUAL 분류 및 점수 제공

Step 3: PO 리뷰 관리 시스템 자동 업데이트
👉 story-review-tracker.md 업데이트
👉 Quality Score 및 결과 기록
👉 프로젝트 건강도 갱신

Step 4: 사용자 승인 확인 요청
👉 "PO 검수 완료. 개선사항 처리하시겠습니까?"
👉 "다음 스토리 진행하시겠습니까?"
```

### ⚠️ **자동 진행 안전장치**

**반드시 확인해야 할 체크포인트:**
- ✅ Dev Agent가 Definition of Done 모두 체크했는지 확인
- ✅ Story Status가 "Ready for Review"인지 확인
- ✅ 실제 구현 파일들이 존재하는지 확인
- ✅ PO Agent 호출 전 사용자에게 안내 메시지 필수

---

## 2️⃣ **PO 에이전트 (Sarah) - 스토리 검증 단계**

### 🔍 **정확한 호출 절차:**
```
"PO 에이전트를 호출하여 Story {N} 검증해줘. po.md 절차를 생략하지 말고 완전히 준수해줘"
```

### ✅ **PO 에이전트 필수 체크리스트:**
- [ ] **bmad-core/agents/po.md** 파일을 완전히 읽고 activation-instructions 정확히 준수
- [ ] **Sarah 페르소나** 완전히 채택 (Technical Product Owner & Process Steward)
- [ ] **core_principles** 모두 적용:
  - [ ] Guardian of Quality & Completeness
  - [ ] Clarity & Actionability for Development
  - [ ] Process Adherence & Systemization
  - [ ] Dependency & Sequence Vigilance
  - [ ] Meticulous Detail Orientation
- [ ] **`*validate-story-draft {story-file-path}`** 명령어 정확히 실행
- [ ] **validate-next-story task** 완전 실행:
  - [ ] Template compliance check
  - [ ] Critical issues identification
  - [ ] Should-fix issues identification  
  - [ ] Anti-hallucination verification
  - [ ] Implementation readiness assessment
- [ ] **상세한 검증 리포트** 제공:
  - [ ] 구체적 점수 (X/10)
  - [ ] CRITICAL/SHOULD-FIX/MANUAL 분류
  - [ ] 구체적 수정 방법 제시
  - [ ] 파일 검증 결과
- [ ] **개선사항을 SAFE/REVIEW/MANUAL로 정확히 분류**
- [ ] **PO 리뷰 관리 시스템 자동 업데이트** (2025-09-06 추가)
  - [ ] `docs/po-reviews/story-review-tracker.md` 해당 스토리 섹션 업데이트
  - [ ] Quality Score, Review Date, Validation Results 기록
  - [ ] Overall Project Health Assessment 갱신
  - [ ] 필요시 상세 검증 리포트 생성 (`story-validation-reports/story-X.X-validation.md`)

### ⚠️ **PO 에이전트 흔한 실수 방지:**
- ❌ po.md 대충 읽고 넘어가기
- ❌ Sarah 페르소나 채택 안하고 바로 시작
- ❌ *validate-story-draft 명령어 없이 바로 검증 시작
- ❌ 피상적 검증 ("잘 됐네요" 수준의 답변)
- ❌ 개선사항 분류 없이 나열만 하기
- ❌ 구체적 수정 방법 제시 없음
- ❌ 파일 존재 여부 확인 없이 검증

### 🎯 **PO 에이전트 완료 확인:**
- [ ] 상세 검증 리포트 제공
- [ ] 모든 개선사항이 SAFE/REVIEW/MANUAL로 분류됨
- [ ] 구체적 수정 방법이 각 항목별로 제시됨
- [ ] Sarah의 최종 승인/보류 결정 명시
- [ ] **미완성 단계 명시**: Tasks/Subtasks에서 [ ] 체크박스 개수 확인 및 사용자에게 알림
- [ ] **PO 리뷰 관리 시스템 업데이트 완료** (2025-09-06 추가)
  - [ ] `story-review-tracker.md`에 해당 스토리 결과 기록
  - [ ] 프로젝트 전체 건강도 점수 갱신
  - [ ] 다음 진행 가능한 스토리 식별 및 추천

---

## 3️⃣ **개선사항 자동 처리 단계**

### 🤖 **SAFE (자동 실행) - 확인 없이 바로 적용**
- ✅ **헤더 번호 정정** (Story 1.1a → Story 1.4)
- ✅ **명백한 오타 수정** (typo correction)
- ✅ **포맷팅 정리** (spacing, indentation)
- ✅ **날짜 업데이트** (outdated timestamps)
- ✅ **파일명 확장자 정정** (.md, .ts 등)
- ✅ **백엔드 API 구현 상태 확인** (파일 존재 여부로 자동 검증)

**실행 방법:**
```
🤖 SAFE 개선사항 자동 수정 중...
✅ 헤더 번호 수정: "Story 1.2" → "Story 1.4"
✅ 오타 수정: "구현화" → "구현"
✅ 날짜 업데이트: 2025-01-09 → 2025-09-06
✅ 백엔드 API 상태 확인: events.js, projects.js, timeline.js 파일 존재 확인됨
```

### ⚠️ **REVIEW (사용자 확인 후 실행) - 반드시 확인 필요**
- ❓ **의존성 참조 변경** ([1.1a, 1.2] → [1.1, 1.2])
- ❓ **파일명 참조 수정** (old file names → new file names)  
- ❓ **단순 임계값 추가** (LCP <2.5s, FID <100ms)
- ❓ **문서 구조 변경** (섹션 순서, 제목 수정)

**실행 방법:**
```
⚠️  REVIEW 항목 확인 필요:
1. 의존성 참조 변경: [1.1a, 1.2] → [1.1, 1.2]
   👉 확인하시겠습니까? (y/n/skip): 

2. AC #5에 성능 임계값 추가: "LCP <2.5s, FID <100ms, CLS <0.1"
   👉 확인하시겠습니까? (y/n/skip): 
```

### 🔴 **MANUAL (반드시 수동 검토) - 자동 실행 금지**
- 🛑 **Acceptance Criteria 내용 변경**
- 🛑 **Story 요구사항 수정**
- 🛑 **코드 로직 변경**
- 🛑 **아키텍처 결정사항 수정**
- 🛑 **복잡한 비즈니스 로직 변경**
- 🛑 **디자인 요구사항 정의** (UX/UI 디자이너 협업 필요)

**실행 방법:**
```
🛑 MANUAL 검토 필요 항목:
1. Acceptance Criteria #3 내용 변경
   👉 수동 검토가 필요합니다. 개발팀과 협의해주세요.

2. 디자인 요구사항 정의
   👉 수동 검토가 필요합니다. UX/UI 디자이너와 협의 필요.
```

---

## 4️⃣ **단계별 구현 워크플로우** (Stage-by-Stage Implementation)

### 📋 **단계별 구현이 필요한 경우**
- 대형 스토리 (13+ story points)
- Tasks가 6개 이상의 단계로 구분된 경우
- 각 단계가 독립적으로 검증 가능한 경우

### 🔄 **각 단계 완료 시 필수 절차**

#### **Step 1: Dev 에이전트 단계 구현**
```
🤖 Dev 에이전트 (James): 특정 단계 구현
- 해당 단계의 모든 subtasks 완료
- 파일 생성/수정 완료  
- 기본 테스트 작성
- 개발 서버 테스트 (자동 포트 선택)
```

### 📋 **개발 서버 자동 관리 전략**

#### **현재 환경 확인**
```bash
# 실행 중인 서버 확인
lsof -ti:3000 || netstat -ano | findstr :3000  # 3000번 포트 사용 여부
```

#### **자동 포트 선택 전략**
1. **기본 포트 3000**: 도커 환경이 사용 중이면 스킵
2. **대체 포트 순서**: 3001 → 3002 → 3003 → 자동 할당
3. **백그라운드 실행**: `npm run dev -- --port {available_port} &`
4. **실행 확인**: 서버 Ready 메시지 대기 (최대 30초)

#### **충돌 방지 규칙**
- **도커 환경 우선**: `npm run dev:docker:bg` 실행 중이면 건드리지 않음
- **포트 충돌 시**: 자동으로 다른 포트 선택
- **테스트 완료 후**: 자동 실행한 서버만 종료 (기존 서버 보호)

#### **자동 서버 실행 스크립트**
```bash
#!/bin/bash
# 자동 포트 선택 및 서버 실행
find_available_port() {
  for port in 3001 3002 3003 3004 3005; do
    if ! lsof -ti:$port > /dev/null 2>&1; then
      echo $port
      return
    fi
  done
  echo "0"  # 자동 할당
}

start_dev_server() {
  # 도커 환경 체크 및 3000번 포트 사용 확인
  if docker ps --format "table {{.Names}}" | grep -q "baro" || lsof -ti:3000 > /dev/null 2>&1; then
    echo "🐳 도커 환경 또는 다른 서비스가 3000번 포트 사용 중 - 스킵"
  fi
  
  # 사용 가능한 포트 찾기
  AVAILABLE_PORT=$(find_available_port)
  
  # 서버 실행
  echo "🚀 개발 서버 시작: localhost:$AVAILABLE_PORT"
  cd client && npm run dev -- --port $AVAILABLE_PORT &
  SERVER_PID=$!
  
  # 서버 준비 대기 (최대 30초)
  echo "⏳ 서버 준비 대기 중..."
  timeout 30s bash -c "while ! curl -s http://localhost:$AVAILABLE_PORT > /dev/null; do sleep 1; done"
  
  if [ $? -eq 0 ]; then
    echo "✅ 서버 준비 완료: http://localhost:$AVAILABLE_PORT"
    echo $SERVER_PID > .dev-server-pid  # PID 저장
    return 0
  else
    echo "❌ 서버 시작 실패"
    kill $SERVER_PID 2>/dev/null
    return 1
  fi
}

stop_dev_server() {
  if [ -f .dev-server-pid ]; then
    PID=$(cat .dev-server-pid)
    kill $PID 2>/dev/null
    rm .dev-server-pid
    echo "🛑 개발 서버 종료됨"
  fi
}

cleanup_test_servers() {
  echo "🧹 테스트 서버 정리 중..."
  
  # 도커 컨테이너 포트는 보호 (3000번)
  PROTECTED_PORTS=("3000")
  
  # 테스트용 포트 범위 (3001-3005)
  for port in 3001 3002 3003 3004 3005; do
    # 해당 포트를 사용하는 프로세스 찾기
    if command -v lsof >/dev/null 2>&1; then
      # Linux/Mac
      PID=$(lsof -ti:$port 2>/dev/null)
    else
      # Windows
      PID=$(netstat -ano | findstr ":$port " | awk '{print $5}' | head -1)
    fi
    
    if [ ! -z "$PID" ]; then
      # npm dev 서버인지 확인 (Node.js 프로세스)
      if ps -p $PID -o cmd= 2>/dev/null | grep -q "npm.*dev\|node.*next"; then
        echo "🔄 테스트 서버 종료: port $port (PID: $PID)"
        kill $PID 2>/dev/null
        # 프로세스 종료 대기
        sleep 2
      fi
    fi
  done
  
  echo "✅ 테스트 서버 정리 완료"
}

# 에이전트 테스트 완료 시 자동 호출
cleanup_after_test() {
  echo "🏁 테스트 완료 - 정리 작업 시작"
  stop_dev_server
  cleanup_test_servers
  echo "🎯 도커 환경(3000번)은 보호됨 - 테스트 서버만 정리됨"
}
```

#### **Step 2: 단계별 PO 검증 실행**
```
👩‍💼 PO 에이전트 (Sarah) 호출 필수:
"Sarah, Story X.X의 Stage N 구현이 완료되었습니다. 
해당 단계의 구현 내용을 검증해주세요."

✅ 검증 결과: 점수/10 및 개선사항 제시
❌ 실패 시: 개선 후 재검증
```

#### **Step 3: 개선사항 처리 (SAFE/REVIEW/MANUAL)**
```
🤖 SAFE 항목: 자동 수정
⚠️ REVIEW 항목: 사용자 확인 후 수정  
🛑 MANUAL 항목: 수동 검토 필요
```

#### **Step 4: 스토리 문서 단계별 업데이트**
```
📝 필수 업데이트:
- [ ] Tasks/Subtasks 해당 단계 체크박스 업데이트
- [ ] Dev Agent Record > Completion Notes에 단계별 성과 추가
- [ ] 다음 단계 진행 가능 여부 확인
```

#### **Step 5: 테스트 서버 정리 및 다음 단계 결정**
```
🧹 테스트 서버 자동 정리:
- 3001-3005번 포트의 npm dev 서버 종료
- 도커 환경(3000번) 보호
- 임시 PID 파일 삭제

✅ 단계 완료 조건:
- PO 점수 8/10 이상
- 모든 REVIEW 개선사항 처리 완료
- 스토리 문서 업데이트 완료
- 테스트 서버 정리 완료

➡️ 다음 단계 진행 또는 전체 스토리 완료 판단
```

### ⚠️ **단계별 구현 주의사항**
- 각 단계마다 **반드시** PO 검증 필요
- 단계 완료 없이 다음 단계 진행 금지
- 전체 스토리 완료 시에도 **최종 통합 검증** 별도 수행

### 🤖 **Dev 에이전트 프롬프트 개선사항**

#### **서버 실행 자동화**
Dev 에이전트에게 전달할 추가 지침:

```
**개발 서버 생명주기 관리:**
1. 구현 완료 후 반드시 개발 서버에서 테스트
2. 3000번 포트 사용 중이면 자동으로 다른 포트 선택 (3001-3005 범위)
3. 도커 환경(3000번)은 절대 건드리지 않음 - 보호됨
4. 서버 실행 시 사용자 확인 요청 없이 자동 진행
5. **중요**: 테스트 완료 후 반드시 테스트 서버 정리
   - 3001-3005번 포트의 npm dev 서버 모두 종료
   - 도커 서버(3000번)만 남겨두기
   - cleanup_after_test() 함수 자동 호출

**자동 실행 명령어 (사용자 확인 요청 없이):**
- 포트 확인: lsof -ti:3000 (또는 netstat -ano | findstr :3000)
- 자동 서버 실행: cd client && npm run dev -- --port 3001 < /dev/null &
- Bash 도구 사용: run_in_background=true로 설정
- 준비 확인: curl -s http://localhost:3001 (서버 Ready 대기)
- 자동 종료: cleanup_after_test() 호출
```

#### **사용자 확인 요청 자동 우회**
```bash
# 1. Bash 도구 사용 시 자동 실행
run_in_background=true  # 백그라운드 실행으로 확인 요청 방지

# 2. 프롬프트 자동 응답
echo "y" | command  # 자동으로 "yes" 응답

# 3. 비대화형 모드 실행
npm run dev -- --port 3001 < /dev/null &  # stdin 차단으로 프롬프트 방지
```

#### **Dev 에이전트 실행 예제**
```javascript
// Bash 도구 호출 시 반드시 포함해야 할 옵션들
{
  "command": "cd client && npm run dev -- --port 3001",
  "description": "Start development server on available port",
  "run_in_background": true,    // 🔑 필수: 사용자 확인 요청 방지
  "timeout": 30000             // 30초 타임아웃
}

// 또는 stdin 리다이렉트 방식
{
  "command": "cd client && npm run dev -- --port 3001 < /dev/null &",
  "description": "Start development server without user prompts"
}
```

#### **주의사항**
- **절대 하지 말 것**: 사용자에게 "서버를 실행하시겠습니까?" 같은 질문
- **반드시 할 것**: run_in_background=true 또는 stdin 리다이렉트 사용
- **자동 정리**: 테스트 완료 후 cleanup_after_test() 자동 호출

---

## 📁 **PO 리뷰 관리 시스템 통합**

### 🗂️ **통합된 PO 리뷰 폴더 구조**

**개선된 폴더 구조 (2025-09-06 업데이트):**
```
docs/
└── po-reviews/                           # PO 리뷰 통합 폴더
    ├── story-review-tracker.md           # 전체 스토리 리뷰 추적 (확장 가능)
    └── story-validation-reports/          # 개별 스토리 상세 검증 리포트
        ├── story-1.1-validation.md       # (필요시 생성)
        ├── story-1.2-validation.md       # (필요시 생성)
        ├── story-1.3-validation.md       # (필요시 생성)
        └── story-1.4-validation.md       # ✅ 생성 완료
```

### 📋 **PO 에이전트 필수 업데이트 절차**

#### **Step 1: PO 검증 완료 후 리뷰 추적 시스템 업데이트**
```
✅ PO 에이전트 (Sarah) 검증 완료 시 자동 실행:

1. story-review-tracker.md 업데이트
   👉 해당 스토리 섹션 추가/업데이트
   👉 Quality Score, Review Date, Validation Results 기록
   👉 Overall Project Health Assessment 갱신

2. 상세 검증 리포트 생성 (필요시)
   👉 story-validation-reports/story-X.X-validation.md 생성
   👉 복잡한 스토리나 중요 스토리만 해당
   👉 백엔드 통합, 성능 지표 상세 분석 포함
```

#### **Step 2: 리뷰 추적 파일 업데이트 템플릿**
```markdown
### Story X.X: [스토리 제목]
- **Current Status**: ✅ **COMPLETED**
- **Priority**: [P0/P1/P2]
- **Story Points**: [점수]
- **Dependencies**: [의존성]
- **Review Date**: [YYYY-MM-DD]
- **Reviewer**: Sarah (Technical PO)
- **Validation Results**:
  - ✅ [주요 검증 항목 1]
  - ✅ [주요 검증 항목 2]
  - ✅ [주요 검증 항목 3]
- **Quality Score**: [점수]/10
- **Notes**: [PO 검토 의견 및 특이사항]
```

#### **Step 3: 자동 업데이트 스크립트**
PO 에이전트 호출 시 다음 작업 자동 수행:

```
🤖 PO 검증 완료 → 자동 리뷰 관리 업데이트:

1. 📝 story-review-tracker.md 업데이트
   - 해당 스토리 상태 "COMPLETED"로 변경
   - PO 검증 점수 및 결과 추가
   - 전체 프로젝트 건강도 재계산

2. 📊 프로젝트 진행률 업데이트
   - 완료된 Story Points 합계
   - 전체 진행률 퍼센티지 계산
   - 다음 진행 가능한 스토리 식별

3. 🎯 다음 단계 자동 추천
   - 의존성 해결된 스토리 목록
   - 우선순위 기반 스토리 추천
```

### 📈 **확장 가능한 리뷰 시스템**

#### **새로운 스토리 완료 시 자동 프로세스**
```
🔄 Story X.X 완료 시 자동 실행:

Step 1: PO 에이전트 검증
👉 Sarah 호출 → *validate-story-draft 실행

Step 2: 리뷰 시스템 업데이트  
👉 story-review-tracker.md에 새 스토리 섹션 추가
👉 Quality Score, 검증 결과 기록

Step 3: 프로젝트 상태 갱신
👉 전체 건강도 점수 재계산
👉 완료율 업데이트

Step 4: 다음 스토리 추천
👉 의존성 분석 → 진행 가능한 스토리 식별
```

#### **리뷰 관리 시스템 장점**
```
✅ 확장성: 모든 스토리 1.1~끝까지 추적 가능
✅ 일관성: 모든 PO 검증이 동일한 형식으로 기록
✅ 추적성: 프로젝트 진행 과정 완전 기록  
✅ 효율성: 자동 업데이트로 관리 부담 최소화
✅ 투명성: 모든 검증 결과가 문서화됨
```

---

## 5️⃣ **최종 승인 및 상태 업데이트**

### 📊 **사용자에게 제시할 완료 정보:**
```
✅ Story {N} 구현 완료 요약:

📁 구현된 파일 목록:
- client/src/stores/calendar-store.ts
- client/src/lib/apollo-client.ts  
- client/src/components/ui/calendar.tsx
- tests/stores/calendar-store.test.ts
- (총 X개 파일)

📋 PO 검증 결과:
- 검증 점수: 9/10  
- 구현 품질: Excellent
- 테스트 커버리지: 85%

🔧 적용된 개선사항:
- [SAFE] 헤더 번호 정정 (자동 완료)
- [REVIEW] 의존성 참조 업데이트 (사용자 승인)
- [MANUAL] AC #3 추가 검토 필요 (수동 처리 대기)

📈 프로젝트 진행률:
- 이전: 18/186 points (10%)
- 현재: 31/186 points (17%) 
- 증가: +13 points

⏱️  소요 시간: 약 X분
🎯 다음 단계: Story 1.5 (프로젝트 CRUD) 진행 가능
```

### 🎯 **승인 확인:**
```
📋 Story {N} 승인하시겠습니까?
[1] 승인 (상태 업데이트 및 다음 스토리 진행)
[2] 추가 수정 필요 (MANUAL 항목 처리 후 재검토)  
[3] 상세 정보 확인 (구현 파일 내용 확인)
[4] 보류 (나중에 다시 검토)

선택하세요 (1-4): 
```

### 🔄 **승인 후 자동 실행 액션:**
1. **STORY-STATUS.md 업데이트:**
   - ✅ 완료된 스토리에 체크 표시
   - 🔧 다음 진행 가능한 스토리 상태 변경
   - 📈 전체 진행률 업데이트

2. **다음 Story 추천:**
   ```
   ✅ Story {N} 승인 완료!
   
   🎯 다음 진행 가능한 스토리들:
   1. Story {N+1}: {제목} (의존성 해결됨)
   2. Story {X}: {제목} (병렬 진행 가능)
   
   다음 스토리를 시작하시겠습니까?
   [1] Story {N+1} 자동화 실행
   [2] 수동으로 다음 스토리 선택
   [3] 잠시 중단 (나중에 계속)
   ```

3. **PO 검증 결과 사용자 요약 제공:**
   ```
   📋 Story {N} PO 검증 결과 요약:
   - 검증 점수: X/10
   - 핵심 성과: [주요 구현 성과 3-5개]
   - 개선사항: [SAFE/REVIEW/MANUAL 분류별 요약]
   - 비즈니스 목표 달성: [KPI 달성 현황]
   - 기술적 성취: [파일 수, 핵심 기술 구현]
   - 최종 결론: [생산 준비 상태 및 주요 가치]
   ```

---

## 🛡️ **자동화 프로세스 안전장치**

### 🚨 **프로세스 준수 강제 시스템**

#### **필수 확인 프로토콜**
사용자가 "진행해줘", "다음 단계 해줘" 등의 요청을 할 때:

```
❌ 잘못된 응답 (절대 금지):
"네, 바로 구현하겠습니다." → 직접 Task 호출

✅ 올바른 응답 (필수):
"bmad-core 자동화 스크립트에 따라 [해당 Agent]를 호출하여 진행하겠습니다."
```

#### **자동화 프로세스 체크포인트**
```
🔍 Step 1: 사용자 요청 분석
👉 어떤 작업인가? (Dev/PO/개선/승인)

🔍 Step 2: 해당 Agent 식별  
👉 Dev Agent (James) / PO Agent (Sarah) / 개선처리 / 상태업데이트

🔍 Step 3: 자동화 프로세스 명시
👉 "bmad-core 자동화에 따라 {Agent명} 호출 예정"

🔍 Step 4: 사용자 승인 확인 (선택적)
👉 복잡한 작업의 경우만

🔍 Step 5: 정확한 Agent 호출 실행
👉 activation-instructions 완전 준수
```

#### **간단한 체크 명령어**
```
사용자가 사용할 수 있는 명령어:

🤖 "자동화 체크" 
👉 현재 단계에서 어떤 자동화 프로세스를 따라야 하는지 확인

🤖 "다음 에이전트"
👉 현재 상황에서 호출해야 할 다음 에이전트 식별

🤖 "프로세스 확인"  
👉 지금까지 진행된 자동화 프로세스 단계별 확인
```

#### **에러 방지 체크리스트**
```
✅ 사용자 요청 → 자동화 문서 확인 필수
✅ 해당 Agent 명시 → 사용자에게 알림 필수  
✅ activation-instructions 준수 필수
✅ 권한 범위 내 작업만 수행 필수

❌ 사용자 "진행해줘" → 바로 Task 호출 (절대 금지)
❌ Agent 없이 직접 구현 (절대 금지)
❌ 자동화 프로세스 생략 (절대 금지)
❌ 절차 건너뛰기 (절대 금지)
```

#### **강제 준수 메시지**
모든 작업 시작 전 반드시 출력:
```
🛡️ bmad-core 자동화 프로세스 준수 중...
📋 현재 단계: [Dev/PO/개선/승인] 
🤖 호출 예정 Agent: [James/Sarah/자동처리/상태업데이트]
⚡ 자동화 스크립트 절차: [activation-instructions/validate-story-draft/기타]
```

#### **프로세스 이탈 감지 시 조치**
```
🚨 프로세스 이탈 감지!

원인: 자동화 프로세스를 따르지 않고 직접 구현 시도
조치: 즉시 중단 → 올바른 Agent 호출 → 정상 프로세스 재개

예시:
"잠시만요! bmad-core 자동화를 따르지 않았습니다. 
 James (Dev Agent)를 호출하여 정상 프로세스로 진행하겠습니다."
```

---

## 🚨 **중요 주의사항 및 원칙**

### 💎 **bmad-core 에이전트 원칙 (절대 준수):**
- ✅ **각 에이전트는 독립 세션**으로 호출 (동시 실행 금지)
- ✅ **activation-instructions 완전 준수** 필수 (생략 절대 금지)
- ✅ **지정된 명령어 정확히 사용** (*develop-story, *validate-story-draft)
- ✅ **권한 범위 내에서만** 작업 (Dev Agent Record만, PO는 검증만)
- ✅ **bmad-core 폴더는 절대 수정하지 않음**

### 🔒 **자동화 실행 시 절대 규칙:**
- ❌ **절차 생략 절대 금지** (시간 절약을 위한 생략 불허)
- ❌ **에이전트 페르소나 건너뛰기 금지**
- ❌ **명령어 없이 바로 작업 시작 금지**
- ❌ **권한 없는 섹션 수정 금지**
- ❌ **사용자 확인 없는 REVIEW 항목 자동 실행 금지**

### 📄 **문서 업데이트 원칙:**
- ✅ **기존 파일 업데이트만** (새 파일 생성 최소화)
- ✅ **Story 파일**: Dev Agent Record 섹션만 수정
- ✅ **STORY-STATUS.md**: 진행 상황 업데이트  
- ✅ **설정 파일들**: package.json 등 기존 파일 수정

### 🆕 **새로 생성되는 파일들 (허용):**
- ✅ **구현 코드 파일들**: stores, components, utils, services 등
- ✅ **테스트 파일들**: *.test.ts, *.spec.ts
- ✅ **새로운 설정 파일들**: 필요시에만

---

## 🔧 **트러블슈팅**

### **Dev 에이전트가 절차를 생략할 때:**
```
"James, dev.md의 activation-instructions를 다시 정확히 읽어주세요. 
특히 devLoadAlwaysFiles 로드와 *develop-story 명령 사용을 생략하지 마세요."
```

### **PO 에이전트가 피상적으로 검증할 때:**
```
"Sarah, po.md의 core_principles를 다시 확인하고 
*validate-story-draft 명령으로 상세한 검증을 실행해주세요. 
특히 SAFE/REVIEW/MANUAL 분류가 필요합니다."
```

### **자동화 중단 시:**
```
현재까지 진행 상황을 확인하고, 
해당 단계부터 다시 시작하세요:

1단계 (Dev): Story 파일의 Status가 "Ready for Review"인지 확인
2단계 (PO): 검증 리포트가 완전히 제공되었는지 확인  
3단계 (개선): SAFE/REVIEW/MANUAL 분류가 완료되었는지 확인
4단계 (승인): 사용자 승인 여부 확인
```

---

## 📚 **관련 문서**

- **bmad-core/agents/dev.md** - Dev 에이전트 완전 가이드
- **bmad-core/agents/po.md** - PO 에이전트 완전 가이드  
- **docs/frontend-stories/STORY-STATUS.md** - 스토리 진행 현황
- **docs/frontend-stories/DEPENDENCY-MATRIX.md** - 의존성 매트릭스
- **docs/po-reviews/story-review-tracker.md** - PO 리뷰 통합 추적 시스템 (2025-09-06 신규)
- **docs/po-reviews/story-validation-reports/** - 개별 스토리 상세 검증 리포트 폴더

---

**🎉 이 자동화 가이드를 사용하여 안전하고 효율적인 스토리 구현을 진행하세요!**

**마지막 업데이트**: 2025-09-06  
**버전**: 1.1 (PO 리뷰 관리 시스템 통합)  
**상태**: 운영 준비 완료

## 📝 **버전 이력**
- **v1.1** (2025-09-06): PO 리뷰 관리 시스템 통합, 자동화 안전장치 추가
- **v1.0** (2025-09-06): 초기 bmad-core 자동화 스크립트 완성