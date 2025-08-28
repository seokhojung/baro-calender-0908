# 프로젝트 설정 및 개발 가이드

## 📋 문서 정보
- **문서 버전**: 1.0
- **작성일**: 2025-08-19
- **작성자**: Architect Winston
- **프로젝트명**: 바로캘린더 (Baro Calendar)
- **상태**: Active
- **카테고리**: 프론트엔드 아키텍처

---

## 🚀 **10. 프로젝트 설정 및 개발 가이드**

**핵심 원칙**: **단계별 설정, 명확한 가이드라인, 개발자 온보딩 최적화**

### **10.1 프로젝트 초기 설정**
```bash
# 새 Next.js 프로젝트 생성
npx create-next-app@latest baro-calendar --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 프로젝트 디렉토리 이동
cd baro-calendar

# 의존성 설치
npm install
```

#### **2단계: ShadCN UI 설정**
```bash
# ShadCN UI 초기화
npx shadcn@latest init

# 기본 컴포넌트 설치
npx shadcn@latest add button input select checkbox tabs calendar card dialog sheet scroll-area badge separator form label textarea

# 추가 컴포넌트 설치
npx shadcn@latest add dropdown-menu popover tooltip toast alert-dialog command
```

#### **3단계: 추가 의존성 설치**
```bash
# 상태 관리
npm install zustand

# 폼 관리
npm install react-hook-form @hookform/resolvers zod

# 날짜 처리
npm install date-fns

# 애니메이션
npm install framer-motion

# 테스트 도구
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom

# E2E 테스트
npm install -D @playwright/test

# 성능 모니터링
npm install -D lighthouse @lhci/cli

# 접근성 테스트
npm install -D jest-axe
```

### **10.2 환경 설정 파일**

#### **Tailwind CSS 설정**
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // 프로젝트 색상 시스템
        'project-blue': {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // ... 다른 프로젝트 색상들
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}

export default config
```

#### **TypeScript 설정**
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### **10.3 개발 환경 설정**

#### **VS Code 설정**
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

#### **VS Code 확장 프로그램**
```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

---

## 📚 **관련 문서**

- [**9. Monitoring & Testing**](./09-monitoring-testing.md)
- [**11. MVP 개발 로드맵**](./11-mvp-roadmap.md)
- [**12. 개발 환경 설정 체크리스트**](./12-development-checklist.md)

---

## 📝 **문서 상태**

**10번 섹션 분할 완료** ✅
- 10.1 프로젝트 초기 설정
- 10.2 환경 설정 파일
- 10.3 개발 환경 설정

---

## 🎯 **다음 단계**

이 섹션을 기반으로:
1. **프로젝트 초기 설정**: 단계별 Next.js 프로젝트 생성
2. **ShadCN UI 설정**: 컴포넌트 라이브러리 구성
3. **개발 환경 최적화**: VS Code 설정 및 확장 프로그램 설치
4. **의존성 관리**: 필요한 라이브러리 설치 및 설정
