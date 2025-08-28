# CI 파이프라인 및 성능 게이트

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처

---

## 🚀 **16. CI 파이프라인 및 성능 게이트**

### **16.1 GitHub Actions 워크플로우**

**통합 CI/CD 파이프라인**
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:unit -- --coverage --watchAll=false
    
    - name: Run accessibility tests
      run: npm run test:a11y
    
    - name: Check test coverage
      run: |
        COVERAGE=$(npm run test:coverage --silent | grep -o '[0-9.]*%' | head -1)
        if [ "${COVERAGE%.*}" -lt 80 ]; then
          echo "Test coverage ${COVERAGE} is below 80% threshold"
          exit 1
        fi

  performance-gate:
    runs-on: ubuntu-latest
    needs: quality-gate
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Run Lighthouse CI
      run: npm run lighthouse
    
    - name: Check performance thresholds
      run: |
        # Lighthouse CI 결과 검증
        if [ -f ".lighthouseci/lhr.json" ]; then
          LCP=$(jq -r '.lighthouseResult.audits.largest-contentful-paint.numericValue' .lighthouseci/lhr.json)
          FID=$(jq -r '.lighthouseResult.audits.max-potential-fid.numericValue' .lighthouseci/lhr.json)
          CLS=$(jq -r '.lighthouseResult.audits.cumulative-layout-shift.numericValue' .lighthouseci/lhr.json)
          
          if (( $(echo "$LCP > 2500" | bc -l) )); then
            echo "LCP threshold exceeded: ${LCP}ms > 2500ms"
            exit 1
          fi
          
          if (( $(echo "$FID > 100" | bc -l) )); then
            echo "FID threshold exceeded: ${FID}ms > 100ms"
            exit 1
          fi
          
          if (( $(echo "$CLS > 0.1" | bc -l) )); then
            echo "CLS threshold exceeded: ${CLS} > 0.1"
            exit 1
          fi
        fi

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [quality-gate, performance-gate]
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright browsers
      run: npx playwright install --with-deps
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: e2e-test-results
        path: test-results/
        retention-days: 30

  deploy:
    runs-on: ubuntu-latest
    needs: [quality-gate, performance-gate, e2e-tests]
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to production
      run: |
        echo "Deploying to production..."
        # 배포 스크립트 실행
```

### **16.2 성능 임계치 및 게이트**

**Lighthouse CI 설정**
```typescript
// .lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000', 'http://localhost:3000/calendar', 'http://localhost:3000/projects'],
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 60000,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-input-delay': ['error', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'time-to-interactive': ['error', { maxNumericValue: 3800 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
```

**성능 게이트 설정**
```typescript
// src/lib/performance/gates.ts
export const PERFORMANCE_GATES = {
  // Core Web Vitals
  lcp: 2500,    // 2.5초
  fid: 100,     // 100ms
  cls: 0.1,     // 0.1
  
  // 바로캘린더 특화 지표
  viewTransition: 150,  // 150ms
  eventLoading: 1000,   // 1초
  projectFiltering: 500, // 500ms
  
  // 번들 크기
  bundleSize: 250,       // 250KB (gzipped)
  
  // 테스트 커버리지
  testCoverage: 80,      // 80%
} as const

export const checkPerformanceGate = (
  metric: keyof typeof PERFORMANCE_GATES,
  value: number
): { passed: boolean; threshold: number; difference: number } => {
  const threshold = PERFORMANCE_GATES[metric]
  const passed = value <= threshold
  const difference = value - threshold
  
  return { passed, threshold, difference }
}

// 성능 게이트 실패 시 처리
export const handlePerformanceGateFailure = (
  metric: string,
  value: number,
  threshold: number
) => {
  // Slack 알림 전송
  sendSlackAlert(metric, value, threshold)
  
  // 개발자 콘솔에 경고
  console.warn(
    `Performance gate failed: ${metric} = ${value} > ${threshold}`
  )
  
  // Sentry에 이벤트 전송
  Sentry.captureMessage(
    `Performance gate failure: ${metric}`,
    'warning'
  )
}
```

---

## 📚 **관련 문서**

- [**9. Monitoring & Testing**](./09-monitoring-testing.md)
- [**15. Observability 및 모니터링**](./15-observability-monitoring.md)

---

## 📝 **문서 상태**

**16번 섹션 분할 완료** ✅
- 16.1 GitHub Actions 워크플로우
- 16.2 성능 임계치 및 게이트

---

## 🎯 **다음 단계**

이 CI/CD 파이프라인을 기반으로:
1. **GitHub Actions 설정**: 자동화된 품질 검증 및 성능 테스트
2. **성능 게이트**: Core Web Vitals 기준 자동 검증
3. **배포 자동화**: 품질 기준 통과 시 자동 배포
4. **지속적 모니터링**: 성능 지표 지속적 추적 및 개선
