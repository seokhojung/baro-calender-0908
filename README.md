# 바로캘린더 (Baro Calendar)

멀티테넌시 기반의 경량 캘린더 시스템으로, 여러 프로젝트·스케줄을 한 눈에 조망하고 쉽게 공유할 수 있습니다.

## 🎯 핵심 가치

**가볍다·빠르다·한눈에 보인다**

- **가볍다**: 빠른 로딩, 최소한의 리소스 사용
- **빠르다**: 월/주 뷰 전환 < 150ms, 드래그-드롭 피드백 < 50ms
- **한눈에 보인다**: 직관적 UI, 프로젝트별 색상 구분, 모바일 접근성

## 🛠️ 기술 스택

### 백엔드
- **프레임워크**: Fastify
- **데이터베이스**: PostgreSQL
- **인증**: JWT + ACL
- **로깅**: Winston
- **API 문서**: Swagger/OpenAPI

### 프론트엔드
- **프레임워크**: Next.js 15.4.6
- **언어**: TypeScript
- **UI 라이브러리**: shadcn/ui + tweakcn
- **스타일링**: Tailwind CSS
- **상태 관리**: React Context API / Zustand
- **애니메이션**: Framer Motion
- **접근성**: WCAG 2.2 AA 준수

## 🚀 빠른 시작

### 포트 설정
- **백엔드 API 서버**: 8000번 포트
- **프론트엔드 Next.js**: 3000번 포트 (기존 3001번에서 변경)
- **PostgreSQL**: 5432번 포트
- **Redis**: 6379번 포트

### 백엔드 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행 (8000번 포트)
npm run dev

# 백그라운드 실행
npm run server-bg
```

### 프론트엔드 개발
```bash
# Next.js 프로젝트 생성
npx create-next-app@latest client --typescript --tailwind --eslint

# shadcn/ui 설정
cd client
npx shadcn@latest init

# tweakcn 설정
npm install tweakcn
npx tweakcn init

# 프론트엔드 개발 서버 실행 (3000번 포트)
npm run dev
```

## 📚 문서

- [PRD 문서](./docs/prd.md) - 제품 요구사항
- [아키텍처 문서](./docs/architecture/) - 시스템 설계
- [개발 가이드](./docs/development-setup-guide.md) - 개발 환경 설정
- [에픽 1 체크리스트](./docs/checklist/epic-1-backend-completion.md) - 백엔드 완성 체크리스트
- [에픽 2 체크리스트](./docs/checklist/epic-2-frontend-checklist.md) - 프론트엔드 진행도 추적

## 🎨 주요 기능

- **캘린더 뷰**: 월/주 전환, 프로젝트별 색상 구분
- **프로젝트 관리**: CRUD, 멤버 초대, 권한 관리
- **스케줄 관리**: 반복 일정, 예외 처리, 알림
- **공유 기능**: 읽기 전용 링크, 권한 기반 접근
- **모바일 우선**: 반응형 디자인, 터치 인터페이스

## 📊 성능 목표

- **월/주 뷰 전환**: < 150ms
- **드래그-드롭 피드백**: < 50ms
- **타임라인 조회 API**: < 300ms
- **초기 로딩**: < 1초

## 🤝 기여하기

1. 이슈 생성 또는 기존 이슈 확인
2. 브랜치 생성 (`feature/기능명` 또는 `fix/버그명`)
3. 코드 작성 및 테스트
4. Pull Request 생성

## 📄 라이선스

MIT License
