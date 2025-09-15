#!/usr/bin/env node
/**
 * Daily Sync Checker: 일일 문서-구현 동기화 상태 확인
 * 매일 실행되어 모든 스토리의 문서-구현 일치성을 확인하고 보고서 생성
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DailySyncChecker {
  constructor() {
    this.today = new Date().toISOString().split('T')[0];
    this.stories = [
      { num: '1.1', file: 'docs/frontend-stories/1.1.project-initialization-setup.md' },
      { num: '1.2', file: 'docs/frontend-stories/1.2.shadcn-design-system.md' },
      { num: '1.3', file: 'docs/frontend-stories/1.3.state-management-monitoring.md' },
      { num: '1.4', file: 'docs/frontend-stories/1.4.unified-calendar-system.md' },
      { num: '1.5', file: 'docs/frontend-stories/1.5.project-crud-management-system.md' },
      { num: '1.6', file: 'docs/frontend-stories/1.6.schedule-crud-event-management.md' },
      { num: '1.7', file: 'docs/frontend-stories/1.7.unified-realtime-sync.md' },
      { num: '1.8', file: 'docs/frontend-stories/1.8.recurring-schedule-system.md' },
      { num: '1.9', file: 'docs/frontend-stories/1.9.authentication-security-system.md' },
      { num: '1.10', file: 'docs/frontend-stories/1.10.design-system-theme-implementation.md' }
    ];
    this.results = [];
  }

  // 스토리 문서에서 Status 추출
  extractStatus(content) {
    const match = content.match(/## Status\s*\n([^\n]+)/);
    return match ? match[1].trim() : 'Unknown';
  }

  // 최근 업데이트 일시 추출
  extractLastUpdated(content) {
    const matches = [
      content.match(/최종 업데이트.*?(\d{4}-\d{2}-\d{2})/),
      content.match(/업데이트 일시.*?(\d{4}-\d{2}-\d{2})/),
      content.match(/작성일.*?(\d{4}-\d{2}-\d{2})/)
    ];
    
    for (const match of matches) {
      if (match) return match[1];
    }
    
    return 'Unknown';
  }

  // Critical Issues 추출
  extractCriticalIssues(content) {
    const criticalSection = content.match(/## 🚨 Critical Issues Found[\s\S]*?(?=##|$)/);
    if (!criticalSection) return [];
    
    const issues = criticalSection[0].match(/- (.*)/g) || [];
    return issues.map(issue => issue.replace('- ', '').trim());
  }

  // 빌드 상태 확인
  checkBuildStatus() {
    try {
      console.log('🔍 전체 시스템 빌드 상태 확인 중...');
      
      // TypeScript 검사
      const tscResult = execSync('cd client && npx tsc --noEmit', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // ESLint 검사
      const lintResult = execSync('cd client && npm run lint', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      return {
        typescript: { success: true, errors: 0 },
        eslint: { success: true, warnings: 0 },
        overall: 'SUCCESS'
      };
    } catch (error) {
      // 오류 파싱
      const tsErrors = (error.stdout || '').match(/error TS\d+/g) || [];
      const lintWarnings = (error.stdout || '').match(/warning/g) || [];
      
      return {
        typescript: { success: tsErrors.length === 0, errors: tsErrors.length },
        eslint: { success: lintWarnings.length < 10, warnings: lintWarnings.length },
        overall: 'ISSUES_FOUND',
        details: error.message
      };
    }
  }

  // 개별 스토리 검증
  verifyStory(story) {
    if (!fs.existsSync(story.file)) {
      return {
        num: story.num,
        status: 'FILE_NOT_FOUND',
        docStatus: 'Missing',
        lastUpdated: 'N/A',
        issues: ['문서 파일이 존재하지 않음'],
        syncStatus: 'FAILED'
      };
    }

    const content = fs.readFileSync(story.file, 'utf8');
    const docStatus = this.extractStatus(content);
    const lastUpdated = this.extractLastUpdated(content);
    const criticalIssues = this.extractCriticalIssues(content);

    // 동기화 상태 판단
    let syncStatus = 'SYNCED';
    const issues = [];

    // Status가 "Completed"인데 Critical Issues가 있는 경우
    if (docStatus.includes('Completed') && criticalIssues.length > 0) {
      syncStatus = 'INCONSISTENT';
      issues.push('Status는 Completed이지만 Critical Issues 존재');
    }

    // 문서가 오래된 경우 (7일 이상)
    const daysDiff = lastUpdated !== 'Unknown' 
      ? Math.floor((Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    if (daysDiff > 7) {
      issues.push(`문서가 ${daysDiff}일 전에 업데이트됨 (최신화 필요)`);
    }

    // Dev Agent Record 검증
    if (!content.includes('## Dev Agent Record')) {
      issues.push('Dev Agent Record 섹션 누락');
      syncStatus = 'INCOMPLETE';
    }

    return {
      num: story.num,
      status: 'VERIFIED',
      docStatus,
      lastUpdated,
      issues: [...issues, ...criticalIssues],
      syncStatus,
      daysSinceUpdate: daysDiff
    };
  }

  // 전체 검증 실행
  runVerification() {
    console.log(`📅 ${this.today} 일일 동기화 검증 시작`);
    
    // 빌드 상태 확인
    const buildStatus = this.checkBuildStatus();
    
    // 각 스토리 검증
    this.results = this.stories.map(story => this.verifyStory(story));
    
    // 결과 분석
    const analysis = this.analyzeResults();
    
    // 보고서 생성
    const report = this.generateReport(buildStatus, analysis);
    
    // 보고서 저장
    const reportPath = `docs/sync-logs/daily-sync-${this.today}.md`;
    fs.writeFileSync(reportPath, report);
    
    console.log(`✅ 일일 동기화 보고서 생성 완료: ${reportPath}`);
    
    // 콘솔에 요약 출력
    this.printSummary(analysis);
    
    return { reportPath, analysis };
  }

  // 결과 분석
  analyzeResults() {
    const total = this.results.length;
    const synced = this.results.filter(r => r.syncStatus === 'SYNCED').length;
    const inconsistent = this.results.filter(r => r.syncStatus === 'INCONSISTENT').length;
    const incomplete = this.results.filter(r => r.syncStatus === 'INCOMPLETE').length;
    const failed = this.results.filter(r => r.syncStatus === 'FAILED').length;
    
    const totalIssues = this.results.reduce((sum, r) => sum + r.issues.length, 0);
    const criticalStories = this.results.filter(r => r.issues.length > 3);
    
    return {
      total,
      synced,
      inconsistent, 
      incomplete,
      failed,
      totalIssues,
      criticalStories,
      syncRate: Math.round((synced / total) * 100)
    };
  }

  // 보고서 생성
  generateReport(buildStatus, analysis) {
    return `# 📋 일일 동기화 보고서 - ${this.today}

## 📊 **전체 동기화 현황**

- **검증 스토리 수**: ${analysis.total}개
- **동기화 완료**: ${analysis.synced}개 (${analysis.syncRate}%)
- **불일치 발견**: ${analysis.inconsistent}개
- **불완전**: ${analysis.incomplete}개
- **실패**: ${analysis.failed}개
- **총 이슈 수**: ${analysis.totalIssues}개

## 🧪 **빌드 상태**

- **전체 빌드**: ${buildStatus.overall === 'SUCCESS' ? '✅ 성공' : '❌ 문제 발견'}
- **TypeScript**: ${buildStatus.typescript.success ? '✅ 오류 없음' : `❌ ${buildStatus.typescript.errors}개 오류`}
- **ESLint**: ${buildStatus.eslint.success ? '✅ 규칙 준수' : `⚠️ ${buildStatus.eslint.warnings}개 경고`}

## 📋 **Story별 상세 현황**

| Story | Status | Sync Status | Last Updated | Issues |
|-------|---------|-------------|--------------|---------|
${this.results.map(r => 
  `| ${r.num} | ${r.docStatus} | ${this.getSyncStatusEmoji(r.syncStatus)} ${r.syncStatus} | ${r.lastUpdated} | ${r.issues.length}개 |`
).join('\n')}

## 🚨 **발견된 주요 이슈들**

${this.generateIssuesList()}

## 🎯 **오늘의 액션 아이템**

${this.generateActionItems(analysis)}

## 📈 **추세 분석**

${this.generateTrendAnalysis()}

---
**보고서 생성 시간**: ${new Date().toLocaleString('ko-KR')}  
**자동 생성**: Living Documentation System  
**다음 보고서**: ${this.getNextReportDate()}
`;
  }

  getSyncStatusEmoji(status) {
    const emojis = {
      'SYNCED': '✅',
      'INCONSISTENT': '⚠️',
      'INCOMPLETE': '🔄', 
      'FAILED': '❌'
    };
    return emojis[status] || '❓';
  }

  generateIssuesList() {
    const criticalIssues = [];
    const minorIssues = [];
    
    this.results.forEach(result => {
      result.issues.forEach(issue => {
        if (issue.includes('Critical') || issue.includes('Completed이지만')) {
          criticalIssues.push(`**Story ${result.num}**: ${issue}`);
        } else {
          minorIssues.push(`**Story ${result.num}**: ${issue}`);
        }
      });
    });

    let output = '';
    if (criticalIssues.length > 0) {
      output += '### 🚨 Critical Issues\n';
      criticalIssues.forEach(issue => output += `- ${issue}\n`);
      output += '\n';
    }
    
    if (minorIssues.length > 0) {
      output += '### ⚠️ Minor Issues\n';
      minorIssues.forEach(issue => output += `- ${issue}\n`);
    }
    
    return output || '현재 발견된 이슈가 없습니다. ✅';
  }

  generateActionItems(analysis) {
    const items = [];
    
    if (analysis.inconsistent > 0) {
      items.push(`📝 ${analysis.inconsistent}개 스토리의 Status 불일치 해결`);
    }
    
    if (analysis.incomplete > 0) {
      items.push(`📋 ${analysis.incomplete}개 스토리의 문서 완성`);
    }
    
    if (analysis.criticalStories.length > 0) {
      items.push(`🚨 ${analysis.criticalStories.length}개 스토리의 Critical Issues 해결`);
    }
    
    const staleStories = this.results.filter(r => r.daysSinceUpdate > 7);
    if (staleStories.length > 0) {
      items.push(`🕒 ${staleStories.length}개 스토리의 문서 최신화`);
    }
    
    return items.length > 0 
      ? items.map(item => `- [ ] ${item}`).join('\n')
      : '- [x] 모든 항목이 양호한 상태입니다! 🎉';
  }

  generateTrendAnalysis() {
    // 간단한 추세 분석 (실제로는 과거 데이터와 비교)
    return `- **동기화율**: ${this.analyzeResults().syncRate}% (목표: 90% 이상)
- **평균 문서 업데이트 주기**: ${this.calculateAverageUpdateCycle()}일
- **이번 주 개선사항**: 지속적 모니터링 중`;
  }

  calculateAverageUpdateCycle() {
    const validDays = this.results
      .filter(r => r.daysSinceUpdate !== 999)
      .map(r => r.daysSinceUpdate);
    
    if (validDays.length === 0) return 'N/A';
    
    const average = validDays.reduce((sum, days) => sum + days, 0) / validDays.length;
    return Math.round(average);
  }

  getNextReportDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  printSummary(analysis) {
    console.log('\n📊 일일 검증 요약:');
    console.log(`   동기화율: ${analysis.syncRate}%`);
    console.log(`   총 이슈: ${analysis.totalIssues}개`);
    console.log(`   Critical 스토리: ${analysis.criticalStories.length}개`);
    
    if (analysis.syncRate >= 90) {
      console.log('✅ 동기화 상태 우수!');
    } else if (analysis.syncRate >= 70) {
      console.log('⚠️ 동기화 상태 보통 - 개선 필요');
    } else {
      console.log('❌ 동기화 상태 미흡 - 즉시 조치 필요');
    }
  }
}

// 실행
if (require.main === module) {
  const checker = new DailySyncChecker();
  checker.runVerification();
}