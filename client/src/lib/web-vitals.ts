import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';
import * as Sentry from '@sentry/nextjs';

// Interface for custom metrics
interface CustomMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType?: string;
}

// Performance thresholds (Google's recommendations)
const PERFORMANCE_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};

// Get performance rating
const getPerformanceRating = (metric: Metric): 'good' | 'needs-improvement' | 'poor' => {
  const threshold = PERFORMANCE_THRESHOLDS[metric.name as keyof typeof PERFORMANCE_THRESHOLDS];
  if (!threshold) return 'good';
  
  if (metric.value <= threshold.good) return 'good';
  if (metric.value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

// Send metric to analytics service
const sendToAnalytics = (metric: Metric, rating: string) => {
  // Send to Google Analytics if available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: rating,
      value: Math.round(metric.value),
      non_interaction: true,
    });
  }
  
  // Send to custom analytics endpoint
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'web-vitals',
        metric: {
          ...metric,
          rating,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          connectionType: (navigator as any).connection?.effectiveType,
        },
      }),
    }).catch(error => {
      console.warn('Failed to send web vitals to analytics:', error);
    });
  }
};

// Send metric to Sentry for monitoring
const sendToSentry = (metric: Metric, rating: string) => {
  Sentry.addBreadcrumb({
    category: 'performance',
    message: `${metric.name}: ${metric.value} (${rating})`,
    level: rating === 'poor' ? 'warning' : 'info',
    data: {
      name: metric.name,
      value: metric.value,
      rating,
      id: metric.id,
      delta: metric.delta,
    },
  });
  
  // Send as Sentry measurement
  Sentry.setMeasurement(metric.name, metric.value, 'millisecond');
  
  // Create performance issue for poor metrics
  if (rating === 'poor') {
    Sentry.captureMessage(`Poor ${metric.name} performance: ${metric.value}`, 'warning');
  }
};

// Main function to handle web vital metrics
const handleWebVital = (metric: Metric) => {
  const rating = getPerformanceRating(metric);
  
  console.log(`${metric.name}: ${metric.value} (${rating})`);
  
  // Send to various monitoring services
  sendToAnalytics(metric, rating);
  sendToSentry(metric, rating);
};

// Initialize web vitals monitoring
export const initWebVitals = () => {
  try {
    getCLS(handleWebVital);
    getFID(handleWebVital);
    getFCP(handleWebVital);
    getLCP(handleWebVital);
    getTTFB(handleWebVital);
  } catch (error) {
    console.warn('Failed to initialize web vitals:', error);
  }
};

// Custom performance measurements
export const measureCustomMetric = (name: string, value: number, unit: string = 'ms') => {
  const customMetric: CustomMetric = {
    name,
    value,
    unit,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    connectionType: (navigator as any).connection?.effectiveType,
  };
  
  // Send to Sentry
  Sentry.setMeasurement(name, value, unit);
  Sentry.addBreadcrumb({
    category: 'custom-performance',
    message: `${name}: ${value}${unit}`,
    level: 'info',
    data: customMetric,
  });
  
  // Send to analytics
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'custom-metric',
        metric: customMetric,
      }),
    }).catch(error => {
      console.warn('Failed to send custom metric to analytics:', error);
    });
  }
};

// Performance monitoring hooks for React components
export const usePerformanceMonitor = () => {
  const measureRenderTime = (componentName: string, startTime: number) => {
    const renderTime = performance.now() - startTime;
    measureCustomMetric(`${componentName}-render-time`, renderTime);
  };
  
  const measureAsyncOperation = async (operationName: string, operation: () => Promise<any>) => {
    const startTime = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      measureCustomMetric(`${operationName}-duration`, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      measureCustomMetric(`${operationName}-error-duration`, duration);
      throw error;
    }
  };
  
  const measureSyncOperation = (operationName: string, operation: () => any) => {
    const startTime = performance.now();
    try {
      const result = operation();
      const duration = performance.now() - startTime;
      measureCustomMetric(`${operationName}-duration`, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      measureCustomMetric(`${operationName}-error-duration`, duration);
      throw error;
    }
  };
  
  return {
    measureRenderTime,
    measureAsyncOperation,
    measureSyncOperation,
  };
};

// Calendar-specific performance metrics
export const measureCalendarMetrics = {
  eventRender: (eventCount: number, renderTime: number) => {
    measureCustomMetric('calendar-events-render-time', renderTime);
    measureCustomMetric('calendar-events-count', eventCount, 'count');
    
    // Calculate events per second
    if (renderTime > 0) {
      const eventsPerSecond = (eventCount / renderTime) * 1000;
      measureCustomMetric('calendar-events-per-second', eventsPerSecond, 'events/sec');
    }
  },
  
  monthNavigation: (navigationTime: number) => {
    measureCustomMetric('calendar-month-navigation-time', navigationTime);
  },
  
  eventCreation: (creationTime: number, optimistic: boolean) => {
    const metricName = optimistic ? 'calendar-event-creation-optimistic' : 'calendar-event-creation-server';
    measureCustomMetric(metricName, creationTime);
  },
  
  stateHydration: (hydrationTime: number, storeSize: number) => {
    measureCustomMetric('store-hydration-time', hydrationTime);
    measureCustomMetric('store-size-bytes', storeSize, 'bytes');
  },
};

// Resource timing monitoring
export const monitorResourceTiming = () => {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('load', () => {
    setTimeout(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      resources.forEach(resource => {
        if (resource.duration > 1000) { // Only report slow resources
          Sentry.addBreadcrumb({
            category: 'resource-timing',
            message: `Slow resource: ${resource.name}`,
            level: 'warning',
            data: {
              name: resource.name,
              duration: resource.duration,
              size: resource.transferSize,
              type: resource.initiatorType,
            },
          });
        }
      });
    }, 0);
  });
};

// Memory usage monitoring (if supported)
export const monitorMemoryUsage = () => {
  if (typeof window === 'undefined' || !(performance as any).memory) return;
  
  const measureMemory = () => {
    const memory = (performance as any).memory;
    
    measureCustomMetric('memory-used', memory.usedJSHeapSize, 'bytes');
    measureCustomMetric('memory-total', memory.totalJSHeapSize, 'bytes');
    measureCustomMetric('memory-limit', memory.jsHeapSizeLimit, 'bytes');
    
    // Calculate memory usage percentage
    const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    measureCustomMetric('memory-usage-percentage', usagePercentage, '%');
    
    if (usagePercentage > 80) {
      Sentry.captureMessage(`High memory usage: ${usagePercentage.toFixed(1)}%`, 'warning');
    }
  };
  
  // Measure immediately and then every 30 seconds
  measureMemory();
  setInterval(measureMemory, 30000);
};

// Initialize all performance monitoring
export const initPerformanceMonitoring = () => {
  initWebVitals();
  monitorResourceTiming();
  monitorMemoryUsage();
  
  console.log('Performance monitoring initialized');
};