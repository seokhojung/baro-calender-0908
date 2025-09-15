# 📋 Living Documentation System

## 🎯 **시스템 개요**

**목적**: 문서와 구현이 항상 일치하는 실시간 동기화 시스템 구축  
**목표**: 중간 검증에서 발생한 "문서 O, 구현 X" 문제 완전 해결  
**적용 범위**: 모든 Frontend Stories (1.1-1.10, 2.1-2.26)  
**업데이트 주기**: 실시간 (코드 변경 시마다)

---

## 🔄 **문서-구현 동기화 사이클 (상세)**

### **Cycle 1: 개발 시작 단계**
```
📝 Story 문서 작성/업데이트
  ↓
🔧 개발 환경 설정
  ↓  
📊 Status 변경: "Ready for Development" → "In Progress"
  ↓
🎯 Dev Agent Record에 개발 시작 기록
```

### **Cycle 2: 개발 진행 단계 (매일 반복)**
```
💻 코드 구현/변경
  ↓
🧪 자동 빌드/테스트 실행
  ↓
📋 결과 분석 및 분기:
  
  ✅ 성공한 경우:
  - Dev Agent Record 자동 업데이트 (파일 목록, 변경사항)
  - Tasks/Subtasks 체크 업데이트
  - QA Results 점수 업데이트
  
  ❌ 실패한 경우:
  - Critical Issues 섹션에 오류 기록
  - Status 변경: "In Progress" → "In Progress - Issues Found"
  - 해결 계획 Dev Notes에 추가
  ↓
📚 문서 커밋 (코드와 함께)
  ↓
🔄 다음 사이클로 진행
```

### **Cycle 3: 완료 검증 단계**
```
🎯 개발 완료 주장
  ↓
🔍 자동 검증 실행:
  - 빌드 성공 여부 확인
  - 타입 오류 0개 확인
  - 린팅 오류 최소화 확인
  - 주요 기능 동작 확인
  ↓
📊 검증 결과 분기:
  
  ✅ 모든 검증 통과:
  - Status: "Completed"
  - Dev Agent Record 최종 업데이트
  - QA Results 완료 점수 기록
  
  ❌ 검증 실패:
  - Status: "In Progress - Verification Failed"
  - 실패 이유 Critical Issues에 기록
  - Cycle 2로 복귀
  ↓
🚀 완료된 스토리 마킹
```

### **Cycle 4: 통합 검증 단계 (주기적)**
```
📅 정기적 통합 검증 (주 1회 또는 마일스톤별)
  ↓
🔗 Cross-Story 통합 테스트 실행
  ↓
📊 통합 결과 분석:
  
  ✅ 통합 성공:
  - 모든 관련 스토리 문서에 통합 성공 기록
  - 전체 시스템 상태 업데이트
  
  ❌ 통합 실패:
  - 실패한 스토리들 Status 조정
  - Integration Issues 섹션 추가
  - 의존성 문제 Dev Notes에 기록
  ↓
🎯 필요시 개별 스토리 Cycle 2로 복귀
```

---

## 📁 **Living Documentation 파일 구조**

### **핵심 문서들**
```
docs/
├── living-documentation-system.md          # 이 문서
├── sync-automation/                         # 자동화 설정
│   ├── pre-commit-doc-sync.js              # Git hook
│   ├── build-status-updater.js             # 빌드 결과 반영
│   └── verification-scheduler.js           # 정기 검증
├── templates/
│   ├── story-template-living.md            # Living Documentation 템플릿
│   └── daily-sync-template.md              # 일일 동기화 템플릿
└── sync-logs/                              # 동기화 로그
    ├── daily-sync-YYYY-MM-DD.md           # 일일 동기화 결과
    └── integration-sync-YYYY-MM-DD.md     # 통합 검증 결과
```

---

## 🔧 **자동화 도구 설정**

### **생성된 자동화 도구 개요**

**1. `pre-commit-doc-sync.js`** - Git 커밋 전 문서 동기화 체크
**2. `daily-sync-checker.js`** - 일일 전체 시스템 동기화 상태 점검

### **1. Pre-commit Hook (매 커밋시)**
```javascript
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Living Documentation 동기화 검사 중..."

# 1. 변경된 파일 확인
CHANGED_FILES=$(git diff --cached --name-only)

# 2. 스토리 관련 파일 변경 시 문서 업데이트 확인
if echo "$CHANGED_FILES" | grep -E "(components|stores|pages)" > /dev/null; then
  echo "📋 관련 스토리 문서 업데이트가 필요할 수 있습니다"
  node docs/sync-automation/pre-commit-doc-sync.js
fi

# 3. 빌드 성공 여부 확인 (선택적)
npm run build > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ 빌드 실패: 관련 스토리 Status 확인이 필요합니다"
  exit 1
fi

echo "✅ Living Documentation 동기화 검사 완료"
```

### **2. 빌드 상태 자동 반영**
```javascript
// docs/sync-automation/build-status-updater.js
const fs = require('fs');
const { execSync } = require('child_process');

function updateBuildStatus() {
  try {
    // 빌드 실행
    execSync('npm run build', { cwd: './client' });
    execSync('npm run type-check', { cwd: './client' });
    execSync('npm run lint', { cwd: './client' });
    
    // 모든 검사 통과 시
    updateStoryStatuses('build-success');
  } catch (error) {
    // 실패 시 관련 스토리들 Status 업데이트
    updateStoryStatuses('build-failed', error.message);
  }
}

function updateStoryStatuses(status, errorMessage = '') {
  const storyFiles = [
    'docs/frontend-stories/1.1.project-initialization-setup.md',
    'docs/frontend-stories/1.2.shadcn-design-system.md',
    // ... 모든 스토리 파일들
  ];
  
  storyFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    if (status === 'build-success') {
      // QA Results 섹션에 성공 상태 기록
      content = content.replace(
        /## QA Results[\s\S]*?(?=##|$)/,
        `## QA Results
### 최근 빌드 상태
- **빌드 날짜**: ${new Date().toISOString().split('T')[0]}
- **빌드 상태**: ✅ 성공
- **TypeScript**: ✅ 오류 없음
- **ESLint**: ✅ 규칙 준수
- **전체 품질**: 양호

`
      );
    } else {
      // 실패 상태 기록
      content = content.replace(
        /## Status\nReady for Review/,
        '## Status\nIn Progress - Build Issues Found'
      );
    }
    
    fs.writeFileSync(file, content);
  });
}

// 실행
updateBuildStatus();
```

### **3. 일일 동기화 체크 (daily-sync-checker.js)**

**🎯 기능:**
- 모든 스토리의 문서-구현 일치성 검사
- 빌드 상태 자동 확인 (TypeScript, ESLint)
- 일일 동기화 보고서 자동 생성
- Critical Issues 자동 감지 및 분류

**📋 사용법:**
```bash
# 수동 실행
node docs/sync-automation/daily-sync-checker.js

# 자동 실행 (매일 오전 9시)
crontab -e
# 추가: 0 9 * * * cd /path/to/project && node docs/sync-automation/daily-sync-checker.js
```

**📊 생성되는 보고서:**
- `docs/sync-logs/daily-sync-YYYY-MM-DD.md`
- 스토리별 동기화 상태 테이블
- Critical Issues 목록 및 액션 아이템
- 빌드 상태 및 품질 지표

**🔍 핵심 검사 항목:**
```javascript
// 각 스토리별 검사
✅ Status vs 실제 구현 상태 일치성
✅ Dev Agent Record 최신성 (7일 이내)
✅ Critical Issues 존재 여부
✅ 문서 완성도 (필수 섹션 존재)

// 전체 시스템 검사  
✅ TypeScript 오류 0개
✅ ESLint 경고 최소화
✅ 빌드 성공 여부
✅ 통합 테스트 결과
```

### **4. 실제 사용 예시**

**Pre-commit Hook 실행 예시:**
```bash
$ git commit -m "Update project store"
🔍 Living Documentation 동기화 검사 시작...
📂 변경된 파일들 (3개):
   - client/src/stores/projectStore.ts
   - client/src/components/project/ProjectManagement.tsx
   - client/src/types/project.ts
🎯 스토리 관련 파일들 (3개):
   - client/src/stores/projectStore.ts
   - client/src/components/project/ProjectManagement.tsx
   - client/src/types/project.ts
📖 영향받는 스토리들: 1.3, 1.5
✅ Story 1.3 문서 업데이트됨
✅ Story 1.5 문서 업데이트됨
📋 총 2개 스토리 문서가 업데이트되었습니다.
🧪 빌드 상태 확인 중...
✅ TypeScript: 오류 없음
✅ ESLint: 기본 규칙 준수
✅ Living Documentation 동기화 검사 완료
```

**Daily Sync 실행 예시:**
```bash
$ node docs/sync-automation/daily-sync-checker.js
📅 2025-09-11 일일 동기화 검증 시작
🔍 전체 시스템 빌드 상태 확인 중...
📊 일일 검증 요약:
   동기화율: 80%
   총 이슈: 5개
   Critical 스토리: 2개
⚠️ 동기화 상태 보통 - 개선 필요
✅ 일일 동기화 보고서 생성 완료: docs/sync-logs/daily-sync-2025-09-11.md
```

### **5. 자동화 도구 커스터마이징**

**파일 매핑 수정 (pre-commit-doc-sync.js):**
```javascript
// analyzeFileToStoryMapping 함수에서 수정
const mappings = {
  // 새로운 스토리 추가 시
  'components/analytics/': ['2.5'], // Analytics 관련
  'components/reporting/': ['2.8'], // Reporting 관련
  // 기존 매핑들...
};
```

**검증 기준 조정 (daily-sync-checker.js):**
```javascript
// 문서 업데이트 허용 기간 변경
if (daysDiff > 14) { // 7일 → 14일로 변경
  issues.push(`문서가 ${daysDiff}일 전에 업데이트됨`);
}

// 동기화율 목표 변경
if (analysis.syncRate >= 95) { // 90% → 95%로 상향
  console.log('✅ 동기화 상태 우수!');
}
```

### **원래 코드 (참고용)**
```javascript
// docs/sync-automation/daily-sync-check.js
const fs = require('fs');

function generateDailySyncReport() {
  const today = new Date().toISOString().split('T')[0];
  const report = `# 일일 동기화 보고서 - ${today}

## 📊 **스토리별 동기화 상태**

${generateStoryStatusTable()}

## 🔍 **발견된 불일치 사항**

${checkDocumentationConsistency()}

## 🎯 **오늘의 액션 아이템**

${generateActionItems()}

---
**생성일**: ${new Date().toLocaleString('ko-KR')}
**자동 생성**: Living Documentation System
`;

  fs.writeFileSync(`docs/sync-logs/daily-sync-${today}.md`, report);
  console.log(`✅ 일일 동기화 보고서 생성 완료: ${today}`);
}

function generateStoryStatusTable() {
  // 모든 스토리 파일을 읽고 상태 확인
  const storyFiles = [
    '1.1.project-initialization-setup.md',
    '1.2.shadcn-design-system.md',
    // ... 모든 스토리
  ];
  
  let table = '| Story | Status | Last Updated | Issues |\n|-------|--------|--------------|--------|\n';
  
  storyFiles.forEach(file => {
    const content = fs.readFileSync(`docs/frontend-stories/${file}`, 'utf8');
    const status = extractStatus(content);
    const lastUpdated = extractLastUpdated(content);
    const issues = extractIssues(content);
    
    const storyNum = file.split('.')[1];
    table += `| ${storyNum} | ${status} | ${lastUpdated} | ${issues} |\n`;
  });
  
  return table;
}

// 매일 자동 실행 설정 (cron 또는 GitHub Actions)
generateDailySyncReport();
```

---

## 📋 **Living Story Template**

### **기존 템플릿에 추가할 섹션들**

```markdown
## 🔄 Living Documentation Status
**최종 동기화**: [자동 업데이트 타임스탬프]  
**빌드 상태**: [자동 업데이트 - ✅ Success / ❌ Failed]  
**문서-구현 일치성**: [자동 평가 - 100% / 부분적 / 불일치]

## 📊 Real-time QA Results
**TypeScript 오류**: [자동 카운트] 개  
**ESLint 위반**: [자동 카운트] 개  
**빌드 경고**: [자동 카운트] 개  
**테스트 커버리지**: [자동 측정] %  
**마지막 성공 빌드**: [타임스탬프]

## 🔗 Integration Dependencies (Live)
**의존하는 스토리**: [자동 분석]  
**영향받는 스토리**: [자동 분석]  
**공유 컴포넌트**: [자동 추출]  
**API 의존성**: [자동 추출]

## 🚨 Active Issues (Live)
**Critical Issues**: [자동 추출]  
**Runtime Errors**: [실행 시 자동 감지]  
**Integration Failures**: [통합 테스트 결과]
```

---

## 🎯 **일일 운영 가이드**

### **개발자 일일 체크리스트**
```markdown
[ ] 오전: 어제의 일일 동기화 보고서 확인
[ ] 개발 시작 전: 관련 스토리 문서 Status 확인
[ ] 코드 변경 시: 관련 스토리 Dev Agent Record 간단 업데이트
[ ] 커밋 전: Pre-commit hook 결과 확인
[ ] 오후: 빌드 상태 확인 및 이슈 해결
[ ] 퇴근 전: 진행 상황 스토리 문서에 간단 기록
```

### **주간 통합 검증 체크리스트**
```markdown
[ ] 모든 스토리 Status 일괄 검토
[ ] Cross-Story 의존성 검증
[ ] 통합 빌드 및 테스트 실행
[ ] 성능 메트릭 확인
[ ] 문서-구현 일치성 전수 검사
[ ] 다음 주 개발 우선순위 조정
```

---

## 📈 **성공 지표 (KPI)**

### **문서-구현 일치성 지표**
- **동기화 정확도**: 95% 이상
- **Status 정확도**: 100% (실제 구현 상태와 일치)
- **빌드 성공률**: 90% 이상
- **Critical Issues 해결 시간**: 24시간 이내

### **개발 효율성 지표**
- **문서 업데이트 지연 시간**: 1일 이내
- **통합 검증 주기**: 주 1회 이상
- **개발자 문서 신뢰도**: 높음 (설문 조사)

---

## 🔧 **도구 설치 및 설정**

### **초기 설정 명령어**
```bash
# 1. Husky 설치 (Git hooks)
npm install --save-dev husky
npx husky install

# 2. 자동화 스크립트 권한 설정
chmod +x docs/sync-automation/*.js

# 3. 일일 동기화 cron 설정 (선택적)
# crontab -e
# 0 9 * * * cd /path/to/project && node docs/sync-automation/daily-sync-check.js

# 4. Pre-commit hook 활성화
npx husky add .husky/pre-commit "node docs/sync-automation/pre-commit-doc-sync.js"
```

### **VS Code 확장 설정 (권장)**
```json
// .vscode/settings.json
{
  "files.associations": {
    "*.md": "markdown"
  },
  "markdown.preview.doubleClickToSwitchToEditor": false,
  "editor.rulers": [80],
  "files.autoSave": "onWindowChange"
}
```

---

**문서 버전**: 1.0  
**작성일**: 2025-09-11  
**업데이트 주기**: 지속적 (Living Document)  
**담당자**: Development Team + Documentation Team