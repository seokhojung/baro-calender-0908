# Source Tree Structure

## Project Directory Structure

```
baro-calendar/
├── client/                           # Frontend Next.js Application
│   ├── src/
│   │   ├── app/                      # Next.js App Router
│   │   │   ├── (auth)/              # Authentication routes
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── calendar/             # Calendar main page
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── projects/             # Project management
│   │   │   ├── settings/             # User settings
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/               # Reusable components
│   │   │   ├── ui/                  # ShadCN UI components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── calendar.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   └── ...
│   │   │   ├── calendar/            # Calendar-specific components
│   │   │   │   ├── CalendarContainer.tsx
│   │   │   │   ├── EventCard.tsx
│   │   │   │   └── EventForm.tsx
│   │   │   ├── layout/              # Layout components
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Navigation.tsx
│   │   │   └── common/              # Shared components
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       ├── GlobalErrorFallback.tsx
│   │   │       └── Toast.tsx
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useCalendar.ts
│   │   │   ├── useAuth.ts
│   │   │   └── useProjects.ts
│   │   ├── stores/                  # Zustand state management
│   │   │   ├── calendarStore.ts
│   │   │   ├── userStore.ts
│   │   │   └── index.ts
│   │   ├── lib/                     # Utilities and configuration
│   │   │   ├── api/                 # API client
│   │   │   │   ├── client.ts        # Main API client
│   │   │   │   ├── calendar.ts
│   │   │   │   └── projects.ts
│   │   │   ├── utils/               # Utility functions
│   │   │   │   ├── date.ts
│   │   │   │   └── validation.ts
│   │   │   └── types/               # TypeScript definitions
│   │   │       ├── api.ts           # API types
│   │   │       ├── calendar.ts
│   │   │       └── user.ts
│   │   └── tests/                   # Test files
│   │       ├── unit/
│   │       ├── integration/
│   │       └── e2e/
│   ├── public/                      # Static assets
│   ├── package.json
│   ├── tailwind.config.js
│   ├── components.json              # ShadCN UI config
│   └── tsconfig.json
├── src/                             # Backend Node.js/Fastify Server
│   ├── api/                         # API routes
│   │   └── v1/
│   │       ├── auth.js             # Authentication endpoints
│   │       ├── oauth.js            # OAuth providers
│   │       ├── events.js           # Event management
│   │       ├── projects.js         # Project management
│   │       └── members.js          # Member management
│   ├── database/                    # Database related
│   │   ├── migrations/              # Database migrations
│   │   │   ├── 001_create_tenant_project_member_tables.js
│   │   │   ├── 001.7_create_events_tables.js
│   │   │   └── 002_create_oauth_2fa_tables.js
│   │   └── safe-migration.js        # Safe migration manager
│   ├── models/                      # Data models
│   │   ├── tenant.js
│   │   ├── project.js
│   │   └── member.js
│   ├── services/                    # Business logic services
│   │   ├── projectService.js
│   │   └── memberService.js
│   ├── utils/                       # Server utilities
│   │   ├── logger.js
│   │   ├── jwtUtils.js
│   │   └── envValidator.js
│   ├── middleware/                  # Express/Fastify middleware
│   │   └── acl.js
│   ├── schemas/                     # Validation schemas
│   │   ├── projectSchema.js
│   │   └── memberSchema.js
│   ├── types/                       # TypeScript server types
│   └── server.js                    # Main server file
├── docs/                            # Documentation
│   ├── architecture/                # Architecture documentation
│   │   ├── README.md
│   │   ├── tech-stack.md           # Technology stack overview
│   │   ├── coding-standards.md     # Development standards
│   │   ├── source-tree.md          # This file
│   │   ├── 01-system-overview-3c.md
│   │   ├── 02-data-and-time-rules.md
│   │   ├── 03-data-model.md
│   │   ├── 04-occurrence-expansion.md
│   │   ├── 05-api.md
│   │   ├── 06-security-and-acl.md
│   │   └── ...
│   ├── frontend-stories/            # Frontend development stories
│   │   ├── 1.1.project-initialization-setup.md
│   │   ├── 1.2.shadcn-design-system.md
│   │   ├── 1.3.state-management-monitoring.md
│   │   └── ...
│   ├── ui-architecture/             # UI/UX architecture docs
│   │   ├── 01-frontend-tech-stack.md
│   │   ├── 02-project-structure.md
│   │   ├── 03-component-standards.md
│   │   └── ...
│   ├── prd/                        # Product requirement docs
│   └── stories/                    # Development stories
├── tests/                          # Backend tests
│   ├── unit/
│   ├── integration/
│   └── setup.js
├── .bmad-core/                     # BMad-Method configuration
│   ├── agents/                     # Agent definitions
│   │   └── dev.md                  # Development agent config
│   ├── tasks/                      # Workflow tasks
│   ├── templates/                  # Document templates
│   └── core-config.yaml            # Core configuration
├── package.json                    # Root package.json
├── docker-compose.yml              # Docker configuration
├── .env.example                    # Environment template
├── .gitignore
└── README.md
```

## Key Directory Purposes

### Frontend (`client/`)
- **Next.js 15**: App Router structure with nested layouts
- **ShadCN/UI**: Component library with MCP server integration
- **TypeScript**: Full type safety across the application
- **Zustand**: Lightweight state management
- **React Query**: Server state caching and synchronization

### Backend (`src/`)
- **Fastify**: High-performance Node.js server framework
- **PostgreSQL**: Database with migration system
- **JWT + OAuth**: Authentication with Google/GitHub providers
- **2FA**: TOTP and SMS-based two-factor authentication
- **REST API**: Full TypeScript integration with frontend

### Documentation (`docs/`)
- **Architecture**: Technical architecture documentation
- **Frontend Stories**: BMad-Method development stories
- **UI Architecture**: Frontend-specific architectural decisions
- **PRD**: Product requirements and specifications

### Configuration Files
- **components.json**: ShadCN/UI configuration
- **tailwind.config.js**: Tailwind CSS customization
- **tsconfig.json**: TypeScript compiler options
- **docker-compose.yml**: Development environment setup

## File Naming Conventions

### Frontend
- **Components**: PascalCase (EventCard.tsx)
- **Hooks**: camelCase with 'use' prefix (useCalendar.ts)
- **Stores**: camelCase with 'Store' suffix (calendarStore.ts)
- **Types**: camelCase matching domain (calendar.ts)

### Backend
- **API Routes**: camelCase (events.js)
- **Services**: camelCase with 'Service' suffix (projectService.js)
- **Models**: camelCase (project.js)
- **Migrations**: numbered with descriptive name (001_create_tables.js)

### Documentation
- **Stories**: numbered with kebab-case (1.1.project-setup.md)
- **Architecture**: numbered with kebab-case (01-system-overview.md)
- **General**: kebab-case (coding-standards.md)

## Import Path Aliases

### Frontend Aliases
```typescript
// tsconfig.json paths
{
  "@/components/*": ["src/components/*"],
  "@/hooks/*": ["src/hooks/*"],
  "@/lib/*": ["src/lib/*"],
  "@/stores/*": ["src/stores/*"],
  "@/types/*": ["src/types/*"]
}
```

### Usage Examples
```typescript
// ✅ Good: Using path aliases
import { Button } from '@/components/ui/button';
import { useCalendar } from '@/hooks/useCalendar';
import { apiClient } from '@/lib/api/client';
import { CalendarEvent } from '@/types/calendar';
```

## Build Outputs

### Frontend Build
```
client/.next/              # Next.js build output
client/out/               # Static export (if used)
```

### Backend Build
```
dist/                     # Compiled JavaScript (if using TypeScript)
node_modules/            # Dependencies
```

## Development Workflow

1. **Backend Development**: Work in `src/` directory
2. **Frontend Development**: Work in `client/src/` directory  
3. **Documentation**: Update relevant docs in `docs/`
4. **Testing**: Run tests from respective test directories
5. **Migration**: Use `src/database/migrations/` for schema changes