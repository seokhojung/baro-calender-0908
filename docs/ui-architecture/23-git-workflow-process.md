# Git 워크플로우 프로세스 정의

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-27
- **작성자**: Architect Winston (with Sarah PO)
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 개발 프로세스 및 협업

---

## 🌿 **23. Git 워크플로우 프로세스 정의**

바로캘린더 프로젝트의 체계적인 Git 워크플로우를 정의하여 팀 협업 효율성을 극대화합니다.

---

## 📈 **23.1 브랜치 전략 - GitFlow 변형**

### **23.1.1 브랜치 구조**

```mermaid
gitgraph:
    options:
        theme: base
    commit id: "Initial"
    branch develop
    checkout develop
    commit id: "Setup"
    branch feature/calendar-view
    checkout feature/calendar-view
    commit id: "Add calendar"
    commit id: "Add events"
    checkout develop
    merge feature/calendar-view
    branch release/v1.0
    checkout release/v1.0
    commit id: "Prepare release"
    checkout main
    merge release/v1.0 tag: "v1.0"
    checkout develop
    merge release/v1.0
```

### **23.1.2 브랜치 유형 및 명명 규칙**

**주요 브랜치**
- `main`: 프로덕션 배포 브랜치 (항상 배포 가능한 상태)
- `develop`: 개발 통합 브랜치 (다음 릴리스 준비)

**지원 브랜치**
- `feature/*`: 새로운 기능 개발
- `release/*`: 릴리스 준비
- `hotfix/*`: 긴급 프로덕션 수정
- `bugfix/*`: 일반 버그 수정

**명명 규칙**
```bash
# Feature branches
feature/calendar-month-view
feature/event-crud-operations
feature/user-authentication

# Release branches  
release/v1.0.0
release/v1.1.0

# Hotfix branches
hotfix/login-security-fix
hotfix/memory-leak-patch

# Bugfix branches
bugfix/calendar-timezone-issue
bugfix/event-validation-error
```

---

## 🔄 **23.2 개발 워크플로우**

### **23.2.1 기능 개발 프로세스**

```bash
# 1. 최신 develop 브랜치로 시작
git checkout develop
git pull origin develop

# 2. Feature 브랜치 생성
git checkout -b feature/calendar-month-view

# 3. 개발 작업 수행
# ... 코딩 ...

# 4. 주기적으로 develop와 동기화
git fetch origin
git rebase origin/develop

# 5. 개발 완료 후 Push
git push origin feature/calendar-month-view

# 6. Pull Request 생성 (GitHub/GitLab)
# 7. 코드 리뷰 및 승인 후 Merge
```

### **23.2.2 커밋 메시지 컨벤션**

**Conventional Commits** 표준을 따릅니다:

```bash
# 형식
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

# 예시
feat(calendar): add month view navigation
fix(auth): resolve token expiration issue
docs(readme): update installation guide
style: format calendar component code
refactor(store): simplify event state management
test(calendar): add unit tests for month view
chore(deps): update react to 19.1.0
```

**타입 분류**
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 스타일 변경 (포맷팅, 세미콜론 등)
- `refactor`: 기능 변경 없는 코드 리팩토링
- `perf`: 성능 개선
- `test`: 테스트 추가/수정
- `chore`: 빌드, 의존성 관리 등
- `ci`: CI/CD 설정 변경

---

## 📝 **23.3 Pull Request (PR) 프로세스**

### **23.3.1 PR 생성 가이드라인**

**PR 제목 형식**
```
[타입] 간결한 설명 (#이슈번호)

예시:
[FEAT] 캘린더 월간 뷰 구현 (#42)
[FIX] 이벤트 생성 시 시간 검증 오류 수정 (#38)
[DOCS] API 문서 업데이트 (#45)
```

**PR 템플릿**
```markdown
## 📋 작업 내용
- [ ] 구현한 기능 또는 수정 사항

## 🎯 변경 사항
- **추가**: 새로 추가된 기능
- **수정**: 변경된 기능  
- **삭제**: 제거된 기능

## 📸 스크린샷 (UI 변경 시)
- Before/After 스크린샷 첨부

## ✅ 체크리스트
- [ ] 코드가 ESLint 규칙을 통과합니다
- [ ] TypeScript 타입 검사를 통과합니다
- [ ] 유닛 테스트가 모두 통과합니다
- [ ] 브라우저 호환성을 확인했습니다
- [ ] 접근성(a11y) 기준을 준수합니다
- [ ] 문서가 업데이트되었습니다 (필요시)

## 🔗 관련 이슈
- Closes #이슈번호
- Related to #이슈번호

## 📝 추가 정보
리뷰어가 알아야 할 특별한 사항
```

### **23.3.2 코드 리뷰 가이드라인**

**리뷰어 책임**
- **필수 검토 항목**
  - 기능 요구사항 충족
  - 코드 품질 및 가독성
  - 성능 영향도
  - 보안 취약점
  - 테스트 커버리지

**리뷰 시간 기준**
- 🔥 **핫픽스**: 2시간 내
- ⚡ **긴급**: 1일 내
- 📋 **일반**: 2일 내
- 📚 **문서**: 3일 내

**승인 기준**
- **최소 1명의 승인** (일반 PR)
- **최소 2명의 승인** (핵심 기능 또는 아키텍처 변경)
- **모든 CI/CD 체크 통과**

---

## 🚀 **23.4 릴리스 프로세스**

### **23.4.1 릴리스 준비**

```bash
# 1. Release 브랜치 생성
git checkout develop
git pull origin develop
git checkout -b release/v1.1.0

# 2. 버전 업데이트
npm version minor  # 또는 major, patch

# 3. 릴리스 노트 작성
# CHANGELOG.md 업데이트

# 4. 최종 테스트 및 버그 수정
# 이 브랜치에서는 버그 수정만 허용

# 5. 릴리스 브랜치 푸시
git push origin release/v1.1.0

# 6. PR 생성: release/v1.1.0 → main
```

### **23.4.2 프로덕션 배포**

```bash
# 1. main 브랜치로 머지 후 태그 생성
git checkout main
git merge --no-ff release/v1.1.0
git tag -a v1.1.0 -m "Release version 1.1.0"
git push origin main --tags

# 2. develop 브랜치에도 반영
git checkout develop
git merge --no-ff release/v1.1.0
git push origin develop

# 3. Release 브랜치 정리
git branch -d release/v1.1.0
git push origin --delete release/v1.1.0
```

---

## 🚨 **23.5 핫픽스 프로세스**

### **23.5.1 긴급 수정 워크플로우**

```bash
# 1. main 브랜치에서 hotfix 브랜치 생성
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# 2. 수정 작업 수행
# ... 버그 수정 ...

# 3. 패치 버전 업데이트
npm version patch

# 4. 테스트 후 push
git push origin hotfix/critical-security-fix

# 5. main과 develop 모두에 긴급 PR 생성
```

### **23.5.2 핫픽스 배포**

```bash
# 1. main 브랜치 머지 및 태그
git checkout main
git merge --no-ff hotfix/critical-security-fix
git tag -a v1.1.1 -m "Hotfix version 1.1.1"
git push origin main --tags

# 2. develop 브랜치에도 반영
git checkout develop  
git merge --no-ff hotfix/critical-security-fix
git push origin develop

# 3. hotfix 브랜치 정리
git branch -d hotfix/critical-security-fix
git push origin --delete hotfix/critical-security-fix
```

---

## ⚙️ **23.6 자동화 및 도구**

### **23.6.1 Git Hooks 설정**

**Pre-commit Hook**
```bash
#!/bin/sh
# .git/hooks/pre-commit

# ESLint 검사
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ ESLint 검사 실패. 커밋이 중단됩니다."
  exit 1
fi

# TypeScript 타입 검사
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ TypeScript 검사 실패. 커밋이 중단됩니다."
  exit 1
fi

# 단위 테스트 실행
npm test
if [ $? -ne 0 ]; then
  echo "❌ 테스트 실패. 커밋이 중단됩니다."
  exit 1
fi

echo "✅ Pre-commit 검사 완료"
```

**Commit Message Hook**
```bash
#!/bin/sh
# .git/hooks/commit-msg

# Conventional Commits 형식 검증
commit_regex='^(feat|fix|docs|style|refactor|perf|test|chore|ci)(\(.+\))?: .{1,72}'

if ! grep -qE "$commit_regex" "$1"; then
    echo "❌ 커밋 메시지 형식이 잘못되었습니다."
    echo "올바른 형식: type(scope): description"
    echo "예: feat(calendar): add month view"
    exit 1
fi

echo "✅ 커밋 메시지 검증 완료"
```

### **23.6.2 GitHub Actions 워크플로우**

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        npm ci
        cd client && npm ci
    
    - name: Run linting
      run: |
        npm run lint
        cd client && npm run lint
    
    - name: Run type checking  
      run: |
        npm run type-check
        cd client && npm run type-check
    
    - name: Run tests
      run: |
        npm test
        cd client && npm test
    
    - name: Build application
      run: |
        npm run build
        cd client && npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to production
      run: echo "Deploying to production..."
```

---

## 📊 **23.7 브랜치 관리 정책**

### **23.7.1 브랜치 보호 규칙**

**main 브랜치**
- ✅ Direct push 금지
- ✅ PR을 통한 머지만 허용
- ✅ 최소 1명의 리뷰 필수
- ✅ 모든 상태 체크 통과 필수
- ✅ 최신 상태 요구

**develop 브랜치**  
- ✅ Direct push 금지
- ✅ PR을 통한 머지만 허용
- ✅ 상태 체크 통과 필수

### **23.7.2 브랜치 정리 정책**

```bash
# 정기적인 브랜치 정리 스크립트
#!/bin/bash

# 머지된 feature 브랜치 정리
git branch --merged develop | grep "feature/" | xargs -n 1 git branch -d

# 원격 브랜치 정리
git remote prune origin

# 30일 이상 된 브랜치 확인
git for-each-ref --format='%(refname:short) %(committerdate)' refs/heads | \
awk '$2 <= "'$(date -d '30 days ago' --iso-8601)'"' | \
cut -d' ' -f1
```

---

## 📚 **23.8 팀 협업 가이드**

### **23.8.1 개발자 가이드라인**

**일일 작업 흐름**
1. **아침**: develop 브랜치 최신 상태 확인
2. **개발**: feature 브랜치에서 작업
3. **점심**: 진행 상황 커밋 (WIP 태그 사용)
4. **저녁**: 완성된 기능 푸시 및 PR 생성

**코드 충돌 해결**
```bash
# 1. 최신 develop 브랜치와 rebase
git fetch origin
git rebase origin/develop

# 2. 충돌 발생 시
git status  # 충돌 파일 확인
# 수동으로 충돌 해결 후
git add <resolved-files>
git rebase --continue

# 3. Force push (주의: 개인 브랜치만)
git push origin feature/my-branch --force-with-lease
```

### **23.8.2 긴급 상황 대응**

**프로덕션 장애 대응**
1. **즉시**: 장애 상황 Slack/Teams 공유
2. **5분 내**: 핫픽스 브랜치 생성 및 작업 시작
3. **30분 내**: 수정 완료 및 긴급 배포
4. **1시간 내**: 사후 분석 보고서 작성

**롤백 절차**
```bash
# 1. 이전 태그로 즉시 롤백
git checkout main
git reset --hard v1.0.9
git push origin main --force

# 2. 또는 Revert commit 생성
git revert <commit-hash>
git push origin main
```

---

## 🎯 **23.9 성공 지표 및 모니터링**

### **23.9.1 개발 효율성 지표**

- **PR 리뷰 시간**: 평균 24시간 이하
- **빌드 성공률**: 95% 이상
- **배포 빈도**: 주 2회 이상
- **핫픽스 빈도**: 월 2회 이하

### **23.9.2 품질 지표**

- **코드 커버리지**: 80% 이상
- **ESLint 경고**: 0개
- **TypeScript 에러**: 0개
- **보안 취약점**: Critical 0개

---

## 📝 **문서 상태**

**23번 섹션 작성 완료** ✅
- 23.1 브랜치 전략
- 23.2 개발 워크플로우
- 23.3 Pull Request 프로세스  
- 23.4 릴리스 프로세스
- 23.5 핫픽스 프로세스
- 23.6 자동화 및 도구
- 23.7 브랜치 관리 정책
- 23.8 팀 협업 가이드
- 23.9 성공 지표 및 모니터링

---

## 📚 **관련 문서**

- [**18. Development Checklist**](./18-development-checklist.md) - 개발 체크리스트
- [**22. CI Pipeline Performance**](./22-ci-pipeline-performance.md) - CI/CD 최적화
- [**12. Monitoring Testing**](./12-monitoring-testing.md) - 테스팅 전략

---

## 🎯 **다음 단계**

이 Git 워크플로우 프로세스를 기반으로:

1. **팀 온보딩**: 모든 개발자 교육 완료
2. **도구 설치**: Git hooks, GitHub Actions 설정  
3. **프로세스 정착**: 2주간 시범 운영 후 개선
4. **지속적 개선**: 월 단위 프로세스 검토

**체계적인 협업 프로세스로 고품질 소프트웨어 개발이 가능합니다!** 🚀