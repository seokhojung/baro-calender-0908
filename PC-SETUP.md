# 🚀 Baro Calendar 프로젝트 설정 및 실행 가이드

## 📋 필수 요구사항

- **Node.js**: 18.0.0 이상
- **npm**: 8.0.0 이상
- **Docker**: 20.0.0 이상 (선택사항)
- **PostgreSQL**: 15.0 이상 (로컬 또는 Docker)
- **Redis**: 7.0 이상 (로컬 또는 Docker)

## 🔧 초기 설정

### ⚠️ PC 변경 시 필수 체크리스트
**다른 PC에서 작업했거나 새로운 환경에서 시작할 때 반드시 실행하세요!**

```bash
# 1. 도커 환경 정리 (기존 네트워크/볼륨 충돌 방지)
docker system prune -f

# 2. 기존 네트워크 확인
docker network ls

# 3. 혹시 남아있는 컨테이너 정리
docker ps -a
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# 4. 사용하지 않는 볼륨 정리
docker volume prune -f
```

### 1. 의존성 설치
```bash
# 루트 디렉토리에서
npm run install:all
```

### 2. 환경 변수 설정
```bash
# env.example을 .env로 복사
cp env.example .env

# .env 파일을 편집하여 실제 값으로 수정
DB_USER=your_db_user
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_PASSWORD=your_db_password
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
```

## 🖥️ 로컬 개발 환경 실행

### 백엔드 서버만 실행
```bash
npm run dev:server
# http://localhost:8000 에서 실행
```

### 프론트엔드만 실행
```bash
npm run dev:client
# http://localhost:3000 에서 실행
```

### 백엔드 + 프론트엔드 동시 실행
```bash
npm run dev:full
# 백엔드: http://localhost:8000
# 프론트엔드: http://localhost:3000
```

### 디버깅 모드로 실행
```bash
npm run dev:debug
# Node.js 디버거 포트 9229에서 실행
```

## 🚀 백그라운드 실행 (터미널 점유 없음)

### PM2 사용 (권장)
PM2는 프로세스 관리, 자동 재시작, 로그 관리 기능을 제공합니다.

```bash
# PM2 설치 (최초 1회)
npm run pm2:install

# 백엔드 + 프론트엔드 백그라운드 실행
npm run pm2:start

# 프로세스 상태 확인
npm run pm2:status

# 로그 실시간 확인
npm run pm2:logs

# 모니터링 대시보드
npm run pm2:monit

# 프로세스 중지
npm run pm2:stop

# 프로세스 재시작
npm run pm2:restart

# 프로세스 삭제
npm run pm2:delete
```

### nohup 사용 (간단한 백그라운드 실행)
```bash
# 백엔드 + 프론트엔드 백그라운드 실행
npm run bg:full

# 로그 확인
npm run bg:logs

# 프로세스 중지
npm run bg:stop
```

### Docker 백그라운드 실행
```bash
# 개발 환경 백그라운드 실행
npm run dev:docker:bg

# 로그 확인
npm run docker:logs
```

## 🐳 Docker 환경 실행

### 개발 환경 (핫 리로드 지원)
```bash
npm run dev:docker
# 또는 백그라운드 실행
npm run dev:docker:bg
```

### 프로덕션 환경
```bash
npm run docker:up
```

### Docker 서비스 관리
```bash
# 서비스 중지
npm run docker:down

# 로그 확인
npm run docker:logs
```

## 🗄️ 데이터베이스 설정

### 마이그레이션 실행
```bash
npm run db:migrate
```

### Docker PostgreSQL 연결
```bash
# PostgreSQL 컨테이너에 직접 연결
docker exec -it baro_calendar_postgres psql -U postgres -d baro_calendar
```

## 🧪 테스트 실행

### 백엔드 테스트
```bash
npm test
npm run test:watch
```

### 프론트엔드 테스트
```bash
cd client
npm test
npm run test:watch
npm run test:coverage
```

## 📚 API 문서

서버 실행 후 다음 URL에서 API 문서 확인 가능:
- **Swagger UI**: http://localhost:8000/docs
- **헬스체크**: http://localhost:8000/health

## 🔍 문제 해결

### PC 변경 후 자주 발생하는 문제들

#### 1. 네트워크 IP 충돌
```bash
# 증상: "Pool overlaps with other one on this address space" 에러
# 해결: 도커 네트워크 정리
docker network prune -f
docker system prune -f
```

#### 2. 컨테이너 이름 중복
```bash
# 증상: "Container name is already in use" 에러
# 해결: 기존 컨테이너 정리
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
```

#### 3. 대용량 도커 캐시 누적
```bash
# 증상: 디스크 공간 부족, 느린 빌드
# 해결: 빌드 캐시 정리 (수 GB 공간 확보 가능)
docker system prune -af --volumes
```

### 포트 충돌
- 백엔드: 8000 포트 사용 중인지 확인
- 프론트엔드: 3000 포트 사용 중인지 확인

#### 포트 사용 확인 방법
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# 포트 사용 중인 프로세스 종료
taskkill /PID [PID번호] /F
```

### 데이터베이스 연결 오류
- PostgreSQL 서비스 실행 상태 확인
- 환경 변수 설정 확인
- 방화벽 설정 확인

### 의존성 오류
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules client/node_modules
npm run install:all
```

### 백그라운드 프로세스 문제
```bash
# PM2 프로세스 확인
npm run pm2:status

# PM2 로그 확인
npm run pm2:logs

# 프로세스 강제 재시작
npm run pm2:restart
```

## 📁 프로젝트 구조

```
baro-calender-master/
├── src/                    # 백엔드 소스 코드
│   ├── api/               # API 라우터
│   ├── components/        # React 컴포넌트
│   ├── database/          # 데이터베이스 관련
│   ├── models/            # 데이터 모델
│   ├── services/          # 비즈니스 로직
│   └── utils/             # 유틸리티 함수
├── client/                # 프론트엔드 (Next.js)
├── docs/                  # 프로젝트 문서
├── logs/                  # 로그 파일들
├── ecosystem.config.js    # PM2 설정 파일
├── docker-compose.yml     # 프로덕션 Docker 설정
├── docker-compose.dev.yml # 개발용 Docker 설정
└── Dockerfile             # 멀티 스테이지 Docker 빌드
```

## 🚀 배포

### 프로덕션 빌드
```bash
npm run build
```

### Docker 이미지 빌드
```bash
docker build -t baro-calendar:latest .
```

## 🚨 PC 변경 시 빠른 체크리스트

**새로운 PC나 다른 환경에서 작업할 때 순서대로 실행하세요:**

```bash
# 1단계: 도커 환경 정리 (필수!)
docker system prune -f

# 2단계: 의존성 설치
npm run install:all

# 3단계: 환경 변수 설정
cp env.example .env
# .env 파일 편집

# 4단계: 올바른 방법으로 실행
# 방법 A: 도커 환경
npm run dev:docker:bg

# 방법 B: 로컬 환경
npm run dev:full
```

## 📞 지원

**PC 변경 후 문제가 발생하면 이 순서로 확인하세요:**
1. ⚠️ **도커 환경 정리** (`docker system prune -f`)
2. 환경 변수 설정 (`.env` 파일)
3. 의존성 설치 상태
4. 포트 사용 상태 (3000, 8000)
5. 데이터베이스 연결 상태
6. 백그라운드 프로세스 상태 (PM2 사용 시)

**💡 대부분의 문제는 1번 도커 환경 정리로 해결됩니다!**
