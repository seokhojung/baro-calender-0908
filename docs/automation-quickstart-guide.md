# 🚀 자동화 도구 빠른 시작 가이드

## 📋 **개요**

Living Documentation System의 자동화 도구들을 빠르게 활용할 수 있는 단계별 가이드입니다.

---

## ⚡ **5분 빠른 설정**

### **1단계: 권한 설정**
```bash
# Windows (관리자 권한 PowerShell)
cd C:\Users\seokho\Desktop\baro-calender-new

# 스크립트 실행 권한 부여
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Node.js 스크립트 권한 설정 (Linux/Mac의 경우)
# chmod +x docs/sync-automation/*.js
```

### **2단계: 도구 테스트**
```bash
# Pre-commit 도구 테스트
node docs/sync-automation/pre-commit-doc-sync.js

# Daily sync 도구 테스트  
node docs/sync-automation/daily-sync-checker.js
```

### **3단계: Git Hook 설정 (선택적)**
```bash
# Husky 설치 (아직 안 했다면)
npm install --save-dev husky
npx husky install

# Pre-commit hook 추가
npx husky add .husky/pre-commit "node docs/sync-automation/pre-commit-doc-sync.js"
```

---

## 🎯 **도구별 사용법**

### **📋 Pre-commit Doc Sync**

**목적**: Git 커밋하기 전에 변경된 파일과 관련된 스토리 문서를 자동 업데이트

**언제 실행되나:**
- `git commit` 명령어 실행 시 자동
- 또는 수동으로 `node docs/sync-automation/pre-commit-doc-sync.js` 실행

**무엇을 하나:**
```
1. Git staged files 확인
2. 스토리 관련 파일 필터링
3. 해당 스토리 문서의 Dev Agent Record 업데이트
4. 기본적인 빌드 상태 확인
5. 권장 사항 출력
```

**실행 예시:**
```bash
$ git add client/src/stores/projectStore.ts
$ git commit -m "Fix useProjectStore export"

🔍 Living Documentation 동기화 검사 시작...
📂 변경된 파일들 (1개):
   - client/src/stores/projectStore.ts
📖 영향받는 스토리들: 1.3, 1.5
✅ Story 1.3 문서 업데이트됨  
✅ Story 1.5 문서 업데이트됨
✅ Living Documentation 동기화 검사 완료

[main abc1234] Fix useProjectStore export
 1 file changed, 2 insertions(+), 1 deletion(-)
```

### **📊 Daily Sync Checker**

**목적**: 전체 프로젝트의 문서-구현 동기화 상태를 매일 점검하고 보고서 생성

**언제 실행하나:**
- 매일 아침 수동: `node docs/sync-automation/daily-sync-checker.js`
- 자동화: cron job 또는 GitHub Actions

**무엇을 확인하나:**
```
✅ 각 스토리의 Status vs 실제 구현 상태
✅ Dev Agent Record 최신성 (7일 이내)
✅ Critical Issues 존재 여부
✅ 전체 시스템 빌드 상태
✅ TypeScript/ESLint 오류 수
```

**생성되는 파일:**
- `docs/sync-logs/daily-sync-YYYY-MM-DD.md`

---

## 📈 **실무 활용 팁**

### **매일 아침 루틴 (5분)**
```bash
# 1. 어제의 동기화 보고서 확인
ls docs/sync-logs/daily-sync-*.md | tail -1 | xargs cat

# 2. 오늘의 동기화 상태 점검
node docs/sync-automation/daily-sync-checker.js

# 3. 발견된 이슈가 있다면 우선순위 확인
# (보고서에서 Critical Issues 섹션 확인)
```

### **개발 중 활용**
```bash
# 개발 전: 관련 스토리 상태 확인
grep -A5 "## Status" docs/frontend-stories/1.5.*.md

# 개발 중: 변경사항 자동 추적 (Git hook 활성화되어 있으면)
git add .
git commit -m "Update project CRUD components"
# → 자동으로 관련 문서 업데이트됨

# 개발 완료 후: 수동으로 전체 동기화 확인
node docs/sync-automation/daily-sync-checker.js
```

### **주간/마일스톤별 활용**
```bash
# 지난 주 동기화 보고서들 일괄 확인
ls docs/sync-logs/daily-sync-2025-09-*.md | xargs grep "동기화율"

# 특정 스토리의 이슈 추세 확인
ls docs/sync-logs/*.md | xargs grep "Story 1.5"
```

---

## 🔧 **커스터마이징 방법**

### **새로운 스토리 추가 시**

**1. pre-commit-doc-sync.js 수정:**
```javascript
// analyzeFileToStoryMapping 함수에서
const mappings = {
  // 기존 매핑들...
  'stores/analyticsStore.ts': ['2.5'],
  'components/analytics/': ['2.5'],
  'components/dashboard/': ['2.3'],
  // 새로운 매핑 추가
};
```

**2. daily-sync-checker.js 수정:**
```javascript
// stories 배열에 새로운 스토리 추가
this.stories = [
  // 기존 스토리들...
  { num: '2.1', file: 'docs/frontend-stories/2.1.advanced-filtering.md' },
  { num: '2.2', file: 'docs/frontend-stories/2.2.search-functionality.md' },
  // 새로운 스토리들 추가
];
```

### **검증 기준 조정**
```javascript
// daily-sync-checker.js에서

// 문서 업데이트 허용 기간 (현재: 7일)
if (daysDiff > 14) { // 7일 → 14일로 완화
  
// 동기화율 목표 (현재: 90%)  
if (analysis.syncRate >= 95) { // 더 엄격하게 설정
```

### **보고서 형식 커스터마이징**
```javascript
// generateReport 함수에서 템플릿 수정
const report = `# 일일 동기화 보고서 - ${today}

## 🎯 **우선순위별 액션 아이템**
${generatePrioritizedActionItems()}

## 📊 **전체 동기화 현황**
// 기존 내용...
`;
```

---

## 🚨 **트러블슈팅**

### **자주 발생하는 문제들**

**1. "Permission denied" 오류**
```bash
# Windows
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Linux/Mac
chmod +x docs/sync-automation/*.js
```

**2. "Cannot find module" 오류**
```bash
# Node.js 모듈 확인
node --version  # v18 이상 필요
npm --version   # npm 확인

# 스크립트 경로 확인
pwd  # 프로젝트 루트에서 실행하는지 확인
```

**3. Git hook이 실행되지 않음**
```bash
# Husky 설치 확인
ls -la .husky/pre-commit

# Hook 권한 확인  
chmod +x .husky/pre-commit

# Hook 내용 확인
cat .husky/pre-commit
```

**4. 보고서가 생성되지 않음**
```bash
# docs/sync-logs 폴더 존재 확인
mkdir -p docs/sync-logs

# 파일 쓰기 권한 확인
touch docs/sync-logs/test.txt && rm docs/sync-logs/test.txt
```

### **디버깅 방법**
```bash
# 상세 로그와 함께 실행
NODE_DEBUG=* node docs/sync-automation/daily-sync-checker.js

# 특정 부분만 테스트
node -e "
const checker = require('./docs/sync-automation/daily-sync-checker.js');
console.log('Test result:', checker.checkBuildStatus());
"
```

---

## 📚 **추가 리소스**

**관련 문서:**
- `docs/living-documentation-system.md` - 전체 시스템 개요
- `docs/development-strategy-analysis.md` - 개발 전략 분석
- `docs/implementation-verification/` - 검증 관련 문서들

**자동화 스크립트:**
- `docs/sync-automation/pre-commit-doc-sync.js` - Pre-commit hook
- `docs/sync-automation/daily-sync-checker.js` - 일일 동기화 체크

**생성되는 파일들:**
- `docs/sync-logs/daily-sync-YYYY-MM-DD.md` - 일일 보고서
- 각 스토리 문서의 Dev Agent Record - 자동 업데이트

---

**문서 업데이트**: 2025-09-11  
**도구 버전**: 1.0  
**호환성**: Node.js 18+, Git 2.0+