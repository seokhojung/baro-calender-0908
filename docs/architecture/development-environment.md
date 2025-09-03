# Development Environment Guide

## 🐳 **Docker-Based Development Setup**

### Prerequisites
- **Docker Desktop**: 실행 중이어야 함
- **Node.js**: 18.17+ (프론트엔드 개발용)
- **Git**: 버전 관리

## 🚀 **Backend Development Workflow**

### 1️⃣ **Docker 환경 시작**
```bash
# Docker Desktop 실행 후
npm run dev:docker:bg
```
**실행 내용:**
- PostgreSQL 15 (port 5432)
- Redis 7 (port 6379)  
- Backend API Server (port 8000 in container, mapped externally)

### 2️⃣ **서비스 확인**
```bash
# 서비스 상태 확인
docker-compose -f docker-compose.dev.yml ps

# 로그 확인  
docker-compose -f docker-compose.dev.yml logs -f
```

### 3️⃣ **데이터베이스 설정**
```bash
# 마이그레이션 실행
npm run db:migrate

# 또는 안전한 마이그레이션
npm run migrate:safe
```

## 🎯 **Frontend Development Workflow** 

### 1️⃣ **프론트엔드 서버 실행** (별도 터미널)
```bash
cd client
npm run dev
```
**Frontend URL**: http://localhost:3000

### 2️⃣ **API 연동 설정**
- **Backend API**: http://localhost:8000 (Docker 컨테이너)
- **Frontend**: http://localhost:3000 (로컬 개발 서버)
- **CORS**: 자동 설정됨 (`CORS_ORIGIN: http://localhost:3000`)

## 🔧 **환경 설정 파일**

### Backend (.env)
```bash
# 백엔드 환경 변수 (Docker에서 자동 주입)
DB_HOST=postgres          # Docker 컨테이너 내 호스트
DB_NAME=baro_calendar_dev
DB_USER=postgres
DB_PASSWORD=postgres123
DB_PORT=5432
REDIS_URL=redis://redis:6379
PORT=8000
CORS_ORIGIN=http://localhost:3000
```

### Frontend (client/.env.local) - 생성 필요
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=development
```

## ⚡ **개발 명령어 모음**

### Docker 관련
```bash
# 백그라운드 실행
npm run dev:docker:bg

# 포그라운드 실행 (로그 확인용)
npm run dev:docker

# Docker 환경 종료
docker-compose -f docker-compose.dev.yml down

# Docker 환경 재빌드
docker-compose -f docker-compose.dev.yml up -d --build
```

### 데이터베이스 관리
```bash
# 마이그레이션
npm run db:migrate
npm run migrate:safe
npm run migrate:dry-run

# 백업 & 복원
npm run migrate:backup
npm run migrate:restore-backup
```

### 개발 서버
```bash
# 전체 개발 환경 (백엔드 + 프론트엔드)
npm run dev:full

# 백엔드만
npm run dev:server

# 프론트엔드만  
npm run dev:client
```

## 🔍 **포트 매핑 정보**

| 서비스 | 컨테이너 포트 | 호스트 포트 | 접근 URL |
|--------|---------------|-------------|----------|
| PostgreSQL | 5432 | 5432 | localhost:5432 |
| Redis | 6379 | 6379 | localhost:6379 |
| Backend API | 8000 | 8000 | http://localhost:8000 |
| Frontend | 3000 | 3000 | http://localhost:3000 |

## 🛠️ **개발 시 주의사항**

### 1. **Docker Desktop 필수**
- 백엔드 개발 시 Docker Desktop이 실행 중이어야 함
- `npm run dev:docker:bg` 명령어로 인프라 환경 구성

### 2. **API 클라이언트 설정**
```typescript
// src/lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

### 3. **CORS 설정 완료**
- Backend에서 Frontend URL 허용 설정됨
- 추가 도메인 필요 시 `CORS_ORIGIN` 수정

### 4. **OAuth 설정** (스토리 구현 시)
```bash
# 추가 환경 변수 (OAuth 스토리에서 설정)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id  
GITHUB_CLIENT_SECRET=your_github_client_secret
```

## 🚨 **트러블슈팅**

### Docker 관련 이슈
```bash
# 포트 충돌 시
docker-compose -f docker-compose.dev.yml down
sudo lsof -i :5432  # 포트 점유 프로세스 확인

# 볼륨 초기화 (데이터 삭제 주의!)
docker-compose -f docker-compose.dev.yml down -v
```

### 데이터베이스 연결 이슈
```bash
# 컨테이너 헬스체크 확인
docker-compose -f docker-compose.dev.yml ps

# PostgreSQL 직접 연결 테스트
docker exec -it baro_calendar_postgres_dev psql -U postgres -d baro_calendar_dev
```

## ✅ **개발 시작 체크리스트**

1. [ ] Docker Desktop 실행
2. [ ] `npm run dev:docker:bg` 실행
3. [ ] `npm run db:migrate` 실행  
4. [ ] Backend API 확인: http://localhost:8000/health
5. [ ] 프론트엔드 개발 준비 완료

**이제 프론트엔드 스토리 구현을 시작할 수 있습니다!** 🚀