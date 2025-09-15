#!/usr/bin/env node
/**
 * Pre-commit Hook: Document Synchronization Checker
 * 커밋하기 전에 문서와 구현의 일치성을 확인
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Living Documentation 동기화 검사 시작...');

// 변경된 파일들 확인
function getChangedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return output.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    console.log('⚠️ Git staged files를 확인할 수 없습니다.');
    return [];
  }
}

// 스토리 관련 파일인지 확인
function isStoryRelatedFile(filePath) {
  const storyRelatedPaths = [
    'client/src/components/',
    'client/src/stores/', 
    'client/src/lib/',
    'client/src/types/',
    'client/src/app/'
  ];
  
  return storyRelatedPaths.some(path => filePath.startsWith(path));
}

// 해당 파일이 어떤 스토리와 관련있는지 분석
function analyzeFileToStoryMapping(filePath) {
  const mappings = {
    // Store 파일들
    'stores/projectStore.ts': ['1.3', '1.5'],
    'stores/userStore.ts': ['1.3', '1.9'],
    'stores/calendarStore.ts': ['1.3', '1.4'],
    'stores/themeStore.ts': ['1.10'],
    'stores/authStore.ts': ['1.9'],
    
    // 컴포넌트들
    'components/ui/': ['1.2'],
    'components/calendar/': ['1.4'],
    'components/project/': ['1.5'],
    'components/auth/': ['1.9'],
    'components/providers/': ['1.3'],
    
    // 라이브러리들
    'lib/design-tokens': ['1.10'],
    'lib/auth/': ['1.9'],
    'lib/realtime/': ['1.7'],
    'lib/recurrence/': ['1.8']
  };
  
  for (const [pattern, stories] of Object.entries(mappings)) {
    if (filePath.includes(pattern)) {
      return stories;
    }
  }
  
  return [];
}

// 스토리 문서 경로 생성
function getStoryDocPath(storyNum) {
  const storyFiles = {
    '1.1': 'docs/frontend-stories/1.1.project-initialization-setup.md',
    '1.2': 'docs/frontend-stories/1.2.shadcn-design-system.md', 
    '1.3': 'docs/frontend-stories/1.3.state-management-monitoring.md',
    '1.4': 'docs/frontend-stories/1.4.unified-calendar-system.md',
    '1.5': 'docs/frontend-stories/1.5.project-crud-management-system.md',
    '1.6': 'docs/frontend-stories/1.6.schedule-crud-event-management.md',
    '1.7': 'docs/frontend-stories/1.7.unified-realtime-sync.md',
    '1.8': 'docs/frontend-stories/1.8.recurring-schedule-system.md',
    '1.9': 'docs/frontend-stories/1.9.authentication-security-system.md',
    '1.10': 'docs/frontend-stories/1.10.design-system-theme-implementation.md'
  };
  
  return storyFiles[storyNum];
}

// 스토리 문서의 Dev Agent Record 업데이트
function updateDevAgentRecord(storyDocPath, changedFiles) {
  if (!fs.existsSync(storyDocPath)) {
    console.log(`⚠️ 스토리 문서를 찾을 수 없습니다: ${storyDocPath}`);
    return false;
  }
  
  let content = fs.readFileSync(storyDocPath, 'utf8');
  const now = new Date().toLocaleString('ko-KR');
  
  // Dev Agent Record 섹션 찾기 및 업데이트
  const devRecordRegex = /(## Dev Agent Record[\s\S]*?)(### File List|### Debug Log|$)/;
  
  if (content.match(devRecordRegex)) {
    const updatedRecord = `## Dev Agent Record
### Agent Model Used
Claude Sonnet 4 (Living Documentation System)

### Latest Update
**업데이트 일시**: ${now}
**변경된 파일들**: 
${changedFiles.map(file => `- ${file}`).join('\n')}

### File List
`;
    
    content = content.replace(devRecordRegex, updatedRecord + '$2');
    
    try {
      fs.writeFileSync(storyDocPath, content);
      return true;
    } catch (error) {
      console.log(`❌ 스토리 문서 업데이트 실패: ${error.message}`);
      return false;
    }
  }
  
  return false;
}

// 빌드 상태 확인
function checkBuildStatus() {
  console.log('🧪 빌드 상태 확인 중...');
  
  try {
    // TypeScript 체크
    execSync('cd client && npx tsc --noEmit', { stdio: 'pipe' });
    console.log('✅ TypeScript: 오류 없음');
    
    // 기본적인 syntax 체크 (빠른 검증)
    execSync('cd client && npm run lint -- --max-warnings 50', { stdio: 'pipe' });
    console.log('✅ ESLint: 기본 규칙 준수');
    
    return { success: true, message: '빌드 검사 통과' };
  } catch (error) {
    console.log('⚠️ 빌드 이슈 발견됨');
    return { 
      success: false, 
      message: error.message,
      suggestion: '관련 스토리 문서의 Status 확인이 필요할 수 있습니다.'
    };
  }
}

// 메인 실행 함수
function main() {
  const changedFiles = getChangedFiles();
  
  if (changedFiles.length === 0) {
    console.log('📝 변경된 파일이 없습니다.');
    return;
  }
  
  console.log(`📂 변경된 파일들 (${changedFiles.length}개):`);
  changedFiles.forEach(file => console.log(`   - ${file}`));
  
  // 스토리 관련 파일 필터링
  const storyRelatedFiles = changedFiles.filter(isStoryRelatedFile);
  
  if (storyRelatedFiles.length === 0) {
    console.log('📋 스토리 관련 파일 변경 없음 - 문서 업데이트 불필요');
    return;
  }
  
  console.log(`🎯 스토리 관련 파일들 (${storyRelatedFiles.length}개):`);
  storyRelatedFiles.forEach(file => console.log(`   - ${file}`));
  
  // 관련 스토리들 찾기
  const affectedStories = new Set();
  storyRelatedFiles.forEach(file => {
    const stories = analyzeFileToStoryMapping(file);
    stories.forEach(story => affectedStories.add(story));
  });
  
  if (affectedStories.size === 0) {
    console.log('🤔 관련 스토리를 특정할 수 없습니다. 수동 확인을 권장합니다.');
    return;
  }
  
  console.log(`📖 영향받는 스토리들: ${Array.from(affectedStories).join(', ')}`);
  
  // 각 스토리 문서 업데이트
  let updatedDocs = 0;
  for (const storyNum of affectedStories) {
    const docPath = getStoryDocPath(storyNum);
    if (docPath && updateDevAgentRecord(docPath, storyRelatedFiles)) {
      console.log(`✅ Story ${storyNum} 문서 업데이트됨`);
      updatedDocs++;
    }
  }
  
  if (updatedDocs > 0) {
    console.log(`📋 총 ${updatedDocs}개 스토리 문서가 업데이트되었습니다.`);
    console.log(`💡 업데이트된 문서들을 함께 커밋하는 것을 권장합니다.`);
  }
  
  // 빌드 상태 확인 (선택적)
  const buildResult = checkBuildStatus();
  if (!buildResult.success) {
    console.log('⚠️ 빌드 이슈가 발견되었습니다:');
    console.log(`   ${buildResult.suggestion}`);
    console.log('   커밋 후 관련 스토리들의 Status 확인을 권장합니다.');
  }
  
  console.log('✅ Living Documentation 동기화 검사 완료');
}

// 실행
if (require.main === module) {
  main();
}