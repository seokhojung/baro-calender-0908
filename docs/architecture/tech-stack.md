# Tech Stack

## Frontend Technology Stack

### Core Framework & Runtime
- **Next.js**: 14.2.x (App Router, Server Components, Production Stable)
- **React**: 18.2.x (Concurrent Features, Suspense, Ecosystem Compatible)  
- **TypeScript**: 5.3+ (Strict Mode, Advanced Types)

### UI Components & Styling
- **ShadCN UI**: v0.8+ (Radix UI 기반, React 18 호환, 접근성 우선)
- **Tailwind CSS**: 3.4+ (Production Stable, CSS Variables)
- **Framer Motion**: 10.18+ (React 18 호환, 60fps 애니메이션)

### State Management & Data
- **Zustand**: 4.4+ (TypeScript 지원, React 18 호환, 번들 크기 최적화)
- **TanStack React Query**: 5.28+ (서버 상태 관리, React 18 안정 지원)
- **Apollo Client**: 3.8+ (GraphQL 클라이언트, React 18 호환)
- **API Client**: Custom TypeScript REST client with automatic token refresh

### Development Tools & Quality
- **Webpack 5**: Next.js 14 기본 번들러 (Production Proven)
- **ESLint**: 코드 품질 및 보안 검사
- **Jest + RTL**: 단위 테스트 (React 18 호환 버전)
- **Playwright**: E2E 테스트, 크로스 브라우저 지원

## Backend Technology Stack

### Server Framework
- **Fastify**: High-performance Node.js server
- **PostgreSQL**: Primary database with connection pooling
- **JWT**: Authentication with session management

### Authentication & Security
- **OAuth 2.0**: Google, GitHub providers
- **2FA**: TOTP (speakeasy) + SMS (Twilio)
- **Session Management**: Database-backed with audit logging

### API & Data
- **REST API**: Full TypeScript API client integration
- **Database**: PostgreSQL with migrations
- **File Upload**: Structured upload pipeline
- **Real-time**: WebSocket support for live updates

## Development Environment
- **Node.js**: 18.17+ (LTS, Production Stable)
- **npm**: 9+ (Package manager)
- **Docker Desktop**: Required for backend development
- **Git**: Version control with pre-commit hooks

### Docker-Based Development
- **PostgreSQL 15**: Database (Docker container)
- **Redis 7**: Caching and sessions (Docker container)
- **Backend API**: http://localhost:8000 (Docker container)
- **Frontend Dev**: http://localhost:3000 (Local Node.js)

### Development Workflow
```bash
# 1. Start Docker infrastructure
npm run dev:docker:bg

# 2. Run database migrations  
npm run db:migrate

# 3. Start frontend (separate terminal)
cd client && npm run dev
```

## Version Compatibility Matrix

### Core Dependencies Compatibility
| Package | Version | React Compat | Next.js Compat | Production Ready |
|---------|---------|--------------|-----------------|-------------------|
| React | 18.2.x | ✅ Base | ✅ 14.2+ | ✅ Stable |
| Next.js | 14.2.x | ✅ 18.2+ | ✅ Base | ✅ Stable |
| TypeScript | 5.3+ | ✅ All | ✅ All | ✅ Stable |
| ShadCN UI | 0.8+ | ✅ 18.2+ | ✅ 14.2+ | ✅ Stable |
| Tailwind | 3.4+ | ✅ All | ✅ All | ✅ Stable |
| Zustand | 4.4+ | ✅ 18.2+ | ✅ All | ✅ Stable |
| React Query | 5.28+ | ✅ 18.2+ | ✅ All | ✅ Stable |
| Framer Motion | 10.18+ | ✅ 18.2+ | ✅ All | ✅ Stable |

### ❌ Avoid These Versions (Too New/Unstable)
- **React 19.x**: Ecosystem compatibility issues
- **Next.js 15.x**: Turbopack still beta, React 19 dependency
- **Tailwind CSS 4.x**: Alpha/Beta, not production ready
- **TanStack Query 5.66+**: May have React 19 specific changes

### Production Stability Assessment
- **Low Risk** ✅: React 18.2, Next.js 14.2, Tailwind 3.4
- **Medium Risk** 🟡: Latest patch versions of stable majors  
- **High Risk** 🔴: React 19, Next.js 15, Tailwind 4.x