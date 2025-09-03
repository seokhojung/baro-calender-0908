# Tech Stack

## Frontend Technology Stack

### Core Framework & Runtime
- **Next.js**: 15.4.6 (App Router, Server Components)
- **React**: 19.1.0 (Concurrent Features, Suspense, Stable Release)  
- **TypeScript**: 5.3+ (Strict Mode, Advanced Types)

### UI Components & Styling
- **ShadCN UI**: v4 (Radix UI 기반, 접근성 우선)
- **Tailwind CSS**: 3.4+ (Utility-First, CSS Variables)
- **Framer Motion**: 11.0+ (60fps 애니메이션, 성능 최적화)

### State Management & Data
- **Zustand**: 4.4+ (TypeScript 지원, 번들 크기 최적화)
- **TanStack React Query**: 5.66+ (서버 상태 관리, 캐싱)
- **Apollo Client**: 3.11+ (GraphQL 클라이언트, 실시간 업데이트)
- **API Client**: Custom TypeScript REST client with automatic token refresh

### Development Tools & Quality
- **Turbopack**: Next.js 15 기본 번들러
- **ESLint**: 코드 품질 및 보안 검사
- **Jest + RTL**: 단위 테스트 및 통합 테스트
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
- **Node.js**: 18+
- **npm**: Package manager
- **Docker**: Containerization support
- **Git**: Version control with pre-commit hooks