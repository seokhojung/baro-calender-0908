# 바로캘린더 (Baro Calendar) - Next.js 클라이언트

## 📋 프로젝트 상태

**현재 상태**: 새로운 UI 아키텍처 기반으로 재구성 중  
**마지막 업데이트**: 2025-08-19  
**목표**: ShadCN UI + MCP 서버 기반 현대적 디자인 시스템 구축

---

## 🎯 **새로운 UI 구현 전략**

### **핵심 원칙**
**"기존 Next.js 환경 유지 + 구린 디자인 완전 제거 + ShadCN UI 기반 새 디자인 시스템 구축"**

### **구현 계획**
- **Week 1**: 기존 코드 정리 + Header + Sidebar + Layout 새 디자인
- **Week 2**: MonthView + WeekView + 뷰 전환 새 디자인  
- **Week 3**: 필터링 시스템 + 반응형 최적화
- **Week 4**: 성능 최적화 + 테스트 + 최종 검증

---

## 🛠️ **기술 스택**

- **Framework**: Next.js 15.4.6 (App Router)
- **UI Library**: ShadCN UI v4 + MCP 서버
- **Styling**: Tailwind CSS
- **Language**: TypeScript 5.3+
- **Testing**: Jest + React Testing Library
- **State Management**: Zustand + React Context API

---

## 🚀 **개발 환경 설정**

### **의존성 설치**
```bash
npm install
```

### **개발 서버 실행**
```bash
npm run dev
```

### **테스트 실행**
```bash
npm test
```

---

## 📁 **프로젝트 구조**

```
client/
├── 📁 src/ - 새로운 UI 아키텍처 기반 구조 (현재 빈 상태)
├── package.json - 프로젝트 의존성
├── tsconfig.json - TypeScript 설정
├── next.config.ts - Next.js 설정
├── jest.config.js - Jest 테스트 설정
├── components.json - shadcn/ui 설정
└── README.md - 프로젝트 설명
```

---

## 📚 **관련 문서**

- **UI 아키텍처**: `docs/ui-architecture/`
- **UI/UX 계획**: `docs/ui-ux/ui-design-system-plan.md`
- **정리 계획**: `docs/ui-ux/cleanup-and-restructure-plan.md`

---

## 🔄 **개발 워크플로우**

1. **SM 단계**: UI 아키텍처 문서 기반으로 새로운 스토리 작성
2. **Dev 단계**: 새로운 스토리 기반으로 새로운 폴더 구조 생성 및 구현

---

**이 프로젝트는 바로캘린더의 새로운 UI/UX를 구현하기 위한 깨끗한 시작점입니다.**
