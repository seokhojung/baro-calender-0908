# 바로캘린더 아키텍처 문서

## 개요

바로캘린더는 멀티테넌시 기반의 캘린더 시스템으로, 백엔드 API와 프론트엔드 웹 클라이언트로 구성됩니다.

## 기술 스택

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

## 문서 구조

- [01-system-overview-3c.md](./01-system-overview-3c.md) - 시스템 전체 개요
- [02-data-and-time-rules.md](./02-data-and-time-rules.md) - 데이터 및 시간 규칙
- [03-data-model.md](./03-data-model.md) - 데이터 모델
- [04-occurrence-expansion.md](./04-occurrence-expansion.md) - 반복 일정 전개
- [05-api.md](./05-api.md) - API 명세
- [06-security-and-acl.md](./06-security-and-acl.md) - 보안 및 ACL
- [07-file-upload-pipeline.md](./07-file-upload-pipeline.md) - 파일 업로드 파이프라인
- [08-performance-cache-scale.md](./08-performance-cache-scale.md) - 성능, 캐싱, 확장성
- [09-observability-and-quality.md](./09-observability-and-quality.md) - 관측성 및 품질
- [10-security-and-privacy.md](./10-security-and-privacy.md) - 보안 및 개인정보
- [11-backup-recovery-operations.md](./11-backup-recovery-operations.md) - 백업, 복구, 운영
- [12-open-issues.md](./12-open-issues.md) - 오픈 이슈
