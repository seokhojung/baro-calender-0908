import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

// Initialize Sentry
export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not provided. Error monitoring will be disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    
    // Performance monitoring
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    
    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    
    // Error filtering
    beforeSend(event, hint) {
      // Don't send errors in development unless explicitly enabled
      if (ENVIRONMENT === 'development' && !process.env.NEXT_PUBLIC_SENTRY_DEV) {
        return null;
      }
      
      // Filter out common non-critical errors
      const error = hint.originalException;
      if (error instanceof Error) {
        // Skip ResizeObserver loop limit errors (common in calendar components)
        if (error.message?.includes('ResizeObserver loop limit exceeded')) {
          return null;
        }
        
        // Skip GraphQL validation errors (these are handled in UI)
        if (error.message?.includes('BAD_USER_INPUT')) {
          return null;
        }
        
        // Skip network errors that are handled gracefully
        if (error.message?.includes('Failed to fetch') && 
            event.tags?.errorType === 'NETWORK_ERROR') {
          return null;
        }
      }
      
      return event;
    },
    
    // Additional configuration
    integrations: [
      // Web vitals integration for performance monitoring
      Sentry.browserTracingIntegration({
        // Capture interactions like clicks, navigations
        tracingOrigins: [
          'localhost',
          /^https:\/\/.*\.vercel\.app$/,
          /^https:\/\/api\.baro-calendar\.com/,
        ],
      }),
    ],
    
    // Tag all events with user context when available
    initialScope: {
      tags: {
        component: 'calendar-client',
      },
    },
  });
};

// Custom error boundary component
export class ErrorBoundary extends Sentry.ErrorBoundary {
  constructor(props: any) {
    super({
      ...props,
      beforeCapture: (scope, error, errorInfo) => {
        scope.setTag('errorBoundary', true);
        scope.setLevel('error');
        
        // Add component stack to context
        if (errorInfo?.componentStack) {
          scope.setContext('react', {
            componentStack: errorInfo.componentStack,
          });
        }
        
        // Add any custom context from props
        if (props.beforeCapture) {
          props.beforeCapture(scope, error, errorInfo);
        }
      },
      fallback: ({ error, resetError }) => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Something went wrong
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                We've been notified about this error and will fix it as soon as possible.
              </p>
              <button
                onClick={resetError}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try again
              </button>
            </div>
            
            {ENVIRONMENT === 'development' && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  Error details (development)
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                  {error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      ),
    });
  }
}

// Utility functions for custom error reporting
export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('custom', context);
    }
    Sentry.captureException(error);
  });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    if (context) {
      scope.setContext('custom', context);
    }
    Sentry.captureMessage(message);
  });
};

export const setUserContext = (user: { id: string; email: string; name: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
};

export const clearUserContext = () => {
  Sentry.setUser(null);
};

export const addBreadcrumb = (message: string, category: string = 'custom', level: Sentry.SeverityLevel = 'info') => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
};

// Performance monitoring utilities
export const startTransaction = (name: string, op: string = 'navigation') => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

// Hook for React components to report errors
export const useSentryErrorHandler = () => {
  return {
    captureError: (error: Error, context?: Record<string, any>) => {
      captureError(error, context);
    },
    captureMessage: (message: string, level: Sentry.SeverityLevel = 'info') => {
      captureMessage(message, level);
    },
    addBreadcrumb: (message: string, category?: string) => {
      addBreadcrumb(message, category);
    },
  };
};

// Global error handler for unhandled promises
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    captureError(new Error(`Unhandled promise rejection: ${event.reason}`), {
      reason: event.reason,
      promise: event.promise,
    });
  });
}