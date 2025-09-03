# Coding Standards

## TypeScript Standards

### Strict Type Configuration
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### Interface & Type Definitions
```typescript
// ✅ Good: Descriptive interface names
interface CreateEventRequest {
  tenant_id: number;
  project_id: number;
  title: string;
  description?: string;
  starts_at_utc: string;
  ends_at_utc: string;
}

// ✅ Good: Generic type constraints
interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}
```

## Component Standards

### ShadCN UI Component Usage
- **MCP Priority**: Use `mcp_shadcn-ui-mcp_list_components` for available components
- **Compound Patterns**: Utilize Tabs.List, Tabs.Trigger, Tabs.Content patterns
- **Accessibility**: Follow WCAG AA standards with proper ARIA attributes

### Component Structure
```typescript
// ✅ Good: Component with proper TypeScript & accessibility
interface EventCardProps {
  event: CalendarEvent;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
}

export const EventCard = React.memo<EventCardProps>(({ 
  event, 
  onEdit, 
  onDelete 
}) => {
  const handleEdit = useCallback(() => onEdit(event), [event, onEdit]);
  const handleDelete = useCallback(() => onDelete(event.id), [event.id, onDelete]);

  return (
    <div className="event-card" role="article" aria-labelledby={`event-${event.id}`}>
      <h3 id={`event-${event.id}`}>{event.title}</h3>
      <button onClick={handleEdit} aria-label={`Edit ${event.title}`}>
        Edit
      </button>
      <button onClick={handleDelete} aria-label={`Delete ${event.title}`}>
        Delete
      </button>
    </div>
  );
});

EventCard.displayName = 'EventCard';
```

## Performance Standards

### React Optimization
- **React.memo**: For components receiving stable props
- **useMemo**: For expensive calculations only
- **useCallback**: For event handlers passed to child components
- **16ms Rule**: Components must render within 16.67ms (60fps)

### Code Splitting
```typescript
// ✅ Good: Lazy loading for route components
const CalendarPage = lazy(() => import('../pages/CalendarPage'));
const EventManagement = lazy(() => import('../components/EventManagement'));

// ✅ Good: Suspense with fallback
<Suspense fallback={<LoadingSpinner />}>
  <CalendarPage />
</Suspense>
```

## API Client Standards

### Type-Safe API Calls
```typescript
// ✅ Good: Typed API client usage
import { apiClient } from '@/lib/api/client';
import type { CreateEventRequest, Event } from '@/types/api';

const createEvent = async (eventData: CreateEventRequest): Promise<Event> => {
  return apiClient.createEvent(eventData);
};

// ✅ Good: Error handling
try {
  const event = await apiClient.createEvent(eventData);
  return { success: true, data: event };
} catch (error) {
  console.error('Event creation failed:', error);
  return { success: false, error: error.message };
}
```

## State Management Standards

### Zustand Store Structure
```typescript
// ✅ Good: Typed Zustand store
interface CalendarStore {
  events: Event[];
  currentView: 'month' | 'week' | 'day';
  currentDate: Date;
  setCurrentView: (view: 'month' | 'week' | 'day') => void;
  setCurrentDate: (date: Date) => void;
  addEvent: (event: Event) => void;
}

export const useCalendarStore = create<CalendarStore>((set) => ({
  events: [],
  currentView: 'month',
  currentDate: new Date(),
  setCurrentView: (view) => set({ currentView: view }),
  setCurrentDate: (date) => set({ currentDate: date }),
  addEvent: (event) => set((state) => ({ 
    events: [...state.events, event] 
  })),
}));
```

## Testing Standards

### Component Testing
```typescript
// ✅ Good: React Testing Library with user events
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventCard } from '../EventCard';

describe('EventCard', () => {
  const mockEvent = {
    id: '1',
    title: 'Test Event',
    description: 'Test Description'
  };

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const onDelete = jest.fn();

    render(<EventCard event={mockEvent} onEdit={onEdit} onDelete={onDelete} />);
    
    await user.click(screen.getByRole('button', { name: /edit test event/i }));
    
    expect(onEdit).toHaveBeenCalledWith(mockEvent);
  });
});
```

## File Naming & Structure

### Directory Structure
```
src/
├── components/
│   ├── ui/           # ShadCN UI components
│   ├── calendar/     # Calendar-specific components
│   └── common/       # Shared components
├── lib/
│   ├── api/          # API client & utilities
│   └── utils/        # Helper functions
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
└── stores/           # Zustand stores
```

### Naming Conventions
- **Components**: PascalCase (EventCard.tsx)
- **Hooks**: camelCase with use prefix (useCalendar.ts)
- **Types**: PascalCase interfaces (CreateEventRequest)
- **Constants**: UPPER_SNAKE_CASE (API_BASE_URL)
- **Functions**: camelCase (createEvent)

## Error Handling & Recovery

### Global Error Boundary Strategy
```typescript
// ✅ Required: Global Error Boundary in app/layout.tsx
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { logger } from '@/lib/utils/logger';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ErrorBoundary
          fallback={<GlobalErrorFallback />}
          onError={(error, errorInfo) => {
            logger.error('Global error caught:', error, errorInfo);
            // Send to monitoring service
          }}
        >
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### Component-Level Error Boundaries
```typescript
// ✅ Good: Feature-specific error boundaries
<ErrorBoundary
  fallback={<CalendarErrorFallback />}
  onError={(error) => logger.error('Calendar error:', error)}
>
  <CalendarComponent />
</ErrorBoundary>
```

### API Error Handling
```typescript
// ✅ Good: Centralized API error handling in client
class ApiClient {
  private handleError(error: any): never {
    if (error.response?.status === 401) {
      this.clearTokens();
      window.location.href = '/auth/login';
    }
    
    const apiError = new ApiError(
      error.response?.data?.message || error.message,
      error.response?.status || 500
    );
    
    // Send to monitoring
    logger.error('API Error:', apiError);
    throw apiError;
  }
}
```

### Toast Notification System
```typescript
// ✅ Required: Global toast for user feedback
import { toast } from '@/components/ui/toast';

const handleAsyncOperation = async () => {
  try {
    await apiClient.createEvent(eventData);
    toast.success('Event created successfully');
  } catch (error) {
    toast.error(error.message || 'Failed to create event');
  }
};
```

## Security Standards

### Authentication
- Never log sensitive data (tokens, passwords)
- Use HTTPS only endpoints
- Implement proper CSRF protection
- Validate all user inputs

### Data Handling
```typescript
// ✅ Good: Sanitized user input
import DOMPurify from 'dompurify';

const sanitizedDescription = DOMPurify.sanitize(userInput.description);
```

## Documentation Standards

### Component Documentation
```typescript
/**
 * EventCard displays a calendar event with edit/delete actions.
 * 
 * @param event - The calendar event to display
 * @param onEdit - Callback when user clicks edit button
 * @param onDelete - Callback when user clicks delete button
 * 
 * @example
 * ```tsx
 * <EventCard 
 *   event={event} 
 *   onEdit={(event) => setEditingEvent(event)}
 *   onDelete={(id) => removeEvent(id)}
 * />
 * ```
 */
```

## Performance Monitoring

### Core Web Vitals Targets
- **LCP**: < 2.5s (Largest Contentful Paint)
- **FID**: < 100ms (First Input Delay) 
- **CLS**: < 0.1 (Cumulative Layout Shift)
- **Component Render**: < 16.67ms (60fps)