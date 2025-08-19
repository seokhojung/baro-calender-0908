# 바로캘린더 (Baro Calendar)

## 📋 프로젝트 개요

바로캘린더는 팀과 개인이 프로젝트별 일정을 효율적으로 관리할 수 있는 웹 기반 캘린더 애플리케이션입니다. 직관적인 인터페이스와 강력한 필터링 기능을 통해 복잡한 일정을 한 눈에 파악하고 관리할 수 있습니다.

## 🚀 현재 개발 상황

### **✅ Epic 1 (백엔드) - 100% 완성**
- **Story 1.1**: 프로젝트 기반 시스템 완성 ✅
- **Story 1.2**: 인증 및 권한 시스템 완성 ✅
- **Story 1.3**: 스케줄 CRUD 시스템 완성 ✅
- **Story 1.4**: 캘린더 뷰 필터링 시스템 완성 ✅
- **Story 1.5**: 반복 일정 시스템 완성 ✅
- **Story 1.6**: 공유 및 권한 관리 시스템 완성 ✅
- **Story 1.7**: 인앱 알림 시스템 완성 ✅

### **🔄 Epic 2 (프론트엔드) - 33% 완성**
- **Story 2.1**: 기본 캘린더 뷰 완성 ✅
  - Next.js 15.4.6 기반 웹 클라이언트 구현 완료
  - 월/주 뷰 전환 기능 (150ms 이하 성능 달성)
  - 프로젝트별 색상 구분 및 기본 필터링
  - 백엔드 API 연동 완료
  - 반응형 디자인 및 모바일 접근성 확보
- **Story 2.2**: 사용자 경험 및 성능 최적화 ⏳ (다음 단계)
- **Story 2.3**: 고급 기능 및 MVP 완성 ⏳ (대기 중)

### **🎯 현재 개발 중인 기능**
**Story 2.2: 사용자 경험 및 성능 최적화**
- 고급 필터링 시스템 (프로젝트별, 담당자별, 태그별)
- 검색 기능 (일정 제목, 프로젝트명)
- 성능 최적화 (가상 스크롤, 지연 로딩)
- 모바일 터치 인터페이스 최적화

### **🚀 새로운 UI/UX 구현 시작**
**현재 상황**: Story 2.1의 기능적 요구사항은 모두 달성되었지만, UI/UX 디자인이 구식 상태입니다.

**새로운 전략**: ShadCN UI + MCP 서버 기반 완전 새 디자인 구현
- **기존 환경 유지**: Next.js 환경, 의존성, 설정 그대로 유지
- **구린 디자인 제거**: 기존 components 폴더 내용 완전 삭제
- **체계적 구현**: 4주 단계별 체계적 UI/UX 개선

**구현 계획**:
- **Week 1**: 기존 코드 정리 + Header + Sidebar + Layout 새 디자인
- **Week 2**: MonthView + WeekView + 뷰 전환 새 디자인
- **Week 3**: 필터링 시스템 + 반응형 최적화
- **Week 4**: 성능 최적화 + 테스트 + 최종 검증

## 🛠️ 기술 스택

### **백엔드**
- **런타임**: Node.js 18+
- **프레임워크**: Fastify
- **데이터베이스**: PostgreSQL 15
- **캐시**: Redis
- **인증**: JWT
- **권한 관리**: ACL (Access Control List)
- **API 문서**: Swagger/OpenAPI
- **로깅**: Winston
- **개발 서버**: Nodemon

### **프론트엔드**
- **프레임워크**: Next.js 15.4.6
- **UI 라이브러리**: React 19.1.1
- **스타일링**: Tailwind CSS
- **UI 컴포넌트**: ShadCN UI + TweakCN
- **상태 관리**: React Context API
- **애니메이션**: Framer Motion
- **테스트**: Jest + React Testing Library
- **코드 품질**: ESLint + Prettier

### **인프라**
- **컨테이너화**: Docker + Docker Compose
- **프로세스 관리**: PM2
- **환경 관리**: .env + env.example

## 📁 프로젝트 구조

```
baro-calender-master/
├── client/                    # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/             # App Router
│   │   ├── components/      # React 컴포넌트
│   │   ├── contexts/        # React Context
│   │   ├── lib/             # 유틸리티 및 API
│   │   └── types/           # TypeScript 타입 정의
│   └── package.json
├── src/                      # 백엔드 소스 코드
│   ├── api/                 # API 라우트
│   ├── components/          # 백엔드 컴포넌트
│   ├── database/            # 데이터베이스 관련
│   ├── models/              # 데이터 모델
│   ├── services/            # 비즈니스 로직
│   └── utils/               # 유틸리티 함수
├── docs/                    # 프로젝트 문서
│   ├── architecture/        # 시스템 아키텍처
│   ├── checklist/           # 개발 체크리스트
│   ├── stories/             # 사용자 스토리
│   └── ui-ux/               # UI/UX 디자인 문서
├── docker-compose.yml       # Docker 환경 설정
├── Dockerfile               # Docker 이미지 빌드
└── package.json             # 백엔드 의존성
```

## 🚀 빠른 시작

### **사전 요구사항**
- Node.js 18+
- npm 또는 yarn
- Docker 및 Docker Compose
- PostgreSQL 15
- Redis

### **1. 저장소 클론**
```bash
git clone https://github.com/seokhojung/baro-calender-0819.git
cd baro-calender-0819
```

### **2. 환경 변수 설정**
```bash
# 루트 디렉토리에 .env 파일 생성
cp env.example .env
# .env 파일에서 데이터베이스 정보 수정
```

### **3. 의존성 설치**
```bash
# 백엔드 의존성 설치
npm install

# 프론트엔드 의존성 설치
cd client
npm install
cd ..
```

### **4. 데이터베이스 설정**
```bash
# Docker로 PostgreSQL 및 Redis 실행
npm run docker:up

# 데이터베이스 마이그레이션 실행
npm run db:migrate
```

### **5. 개발 서버 실행**
```bash
# 백엔드 서버 실행 (포트 8000)
npm run dev:server

# 프론트엔드 서버 실행 (포트 3000)
npm run dev:client

# 또는 동시 실행
npm run dev:full
```

## 📚 주요 문서

### **개발 가이드**
- **`docs/development-setup-guide.md`**: 개발 환경 설정 가이드
- **`docs/architecture/README.md`**: 시스템 아키텍처 문서
- **`docs/prd/README.md`**: 제품 요구사항 문서

### **UI/UX 디자인**
- **`docs/ui-ux/README.md`**: UI/UX 구현 가이드
- **`docs/ui-ux/checklists/ui-implementation-checklist.md`**: UI 구현 체크리스트 (40개 항목)
- **`docs/ui-ux/components/calendar-view-design.md`**: 캘린더 뷰 디자인 명세서

### **개발 진행 상황**
- **`docs/checklist/epic-2-frontend-checklist.md`**: 프론트엔드 개발 체크리스트
- **`docs/stories/2.1.basic-calendar-view.story.md`**: Story 2.1 상세 명세

## 🔧 개발 스크립트

### **백엔드**
```bash
npm run dev:server          # 개발 서버 실행
npm run dev:docker          # Docker 개발 환경
npm run build               # 프로덕션 빌드
npm run start               # 프로덕션 서버 실행
npm run test                # 테스트 실행
npm run lint                # 코드 린팅
```

### **프론트엔드**
```bash
npm run dev:client          # 개발 서버 실행
npm run build:client        # 클라이언트 빌드
npm run test                # 테스트 실행
npm run lint                # 코드 린팅
```

### **Docker**
```bash
npm run docker:up           # Docker 환경 시작
npm run docker:down         # Docker 환경 중지
npm run docker:logs         # Docker 로그 확인
```

### **백그라운드 실행**
```bash
npm run bg:server           # 백엔드 백그라운드 실행
npm run bg:client           # 프론트엔드 백그라운드 실행
npm run bg:full             # 전체 백그라운드 실행
npm run bg:stop             # 백그라운드 프로세스 중지
npm run bg:logs             # 백그라운드 로그 확인
```

## 📊 성능 목표

### **Story 2.1 달성 현황**
- ✅ **뷰 전환 시간**: 150ms 이하 (달성 완료)
- ✅ **초기 로딩 시간**: 3초 이하 (달성 완료)
- ✅ **API 응답 시간**: 200ms 이하 (달성 완료)

### **Story 2.2 목표**
- 🎯 **드래그-드롭 피드백**: 50ms 이하
- 🎯 **검색 응답 시간**: 100ms 이하
- 🎯 **필터링 응답 시간**: 50ms 이하

## 🔒 보안 및 권한

### **인증 시스템**
- JWT 기반 토큰 인증
- 토큰 만료 시간: 24시간
- 리프레시 토큰 지원

### **권한 관리**
- **Owner**: 프로젝트 소유자 (모든 권한)
- **Editor**: 편집자 (읽기/쓰기 권한)
- **Commenter**: 댓글 작성자 (읽기/댓글 권한)
- **Viewer**: 읽기 전용 (읽기 권한만)

### **데이터 보안**
- 모든 API 요청에 JWT 토큰 검증
- 프로젝트별 데이터 격리
- SQL 인젝션 방지
- XSS 공격 방지

## 🧪 테스트

### **백엔드 테스트**
```bash
npm test                     # 전체 테스트 실행
npm run test:watch          # 테스트 감시 모드
```

### **프론트엔드 테스트**
```bash
cd client
npm test                     # 전체 테스트 실행
npm run test:watch          # 테스트 감시 모드
```

### **테스트 커버리지**
- **백엔드**: 80% 이상 목표
- **프론트엔드**: 80% 이상 목표
- **통합 테스트**: 주요 시나리오 커버

## 🚀 배포

### **개발 환경**
```bash
npm run docker:up           # Docker 개발 환경
npm run dev:full            # 전체 개발 서버
```

### **프로덕션 환경**
```bash
npm run build               # 백엔드 빌드
npm run build:client        # 프론트엔드 빌드
npm run start               # 프로덕션 서버 실행
```

### **Docker 배포**
```bash
docker-compose up -d        # 프로덕션 환경 실행
docker-compose logs -f      # 로그 모니터링
```

## 🤝 기여하기

### **개발 참여 방법**
1. **Fork** 저장소
2. **Feature branch** 생성 (`git checkout -b feature/amazing-feature`)
3. **Commit** 변경사항 (`git commit -m 'Add amazing feature'`)
4. **Push** 브랜치 (`git push origin feature/amazing-feature`)
5. **Pull Request** 생성

### **현재 개발 참여 영역**
- **UI/UX 구현**: Story 2.2 사용자 경험 및 성능 최적화
- **새로운 디자인 시스템**: ShadCN UI + MCP 서버 기반 구현
- **모바일 최적화**: 터치 인터페이스 및 반응형 디자인
- **성능 최적화**: 가상 스크롤, 지연 로딩, 번들 최적화

### **코드 품질 기준**
- ESLint 규칙 준수
- Prettier 포맷팅 적용
- TypeScript 타입 안전성
- 테스트 커버리지 80% 이상
- 성능 목표 달성

## 📞 지원 및 문의

### **개발팀**
- **Scrum Master**: Bob
- **Full Stack Developer**: James
- **UX Expert**: Sally
- **QA Architect**: Quinn

### **문서 관련**
- **기술 문서**: `docs/` 폴더
- **아키텍처**: `docs/architecture/`
- **UI/UX**: `docs/ui-ux/`
- **체크리스트**: `docs/checklist/`

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

---

**마지막 업데이트**: 2025-08-19  
**프로젝트 상태**: Epic 2 (프론트엔드) 개발 중 - Story 2.2 진행  
**다음 마일스톤**: 새로운 UI/UX 디자인 시스템 완성 (4주 계획)
