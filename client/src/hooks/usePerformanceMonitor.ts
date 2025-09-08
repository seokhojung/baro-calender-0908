import { useEffect, useRef, useState, useCallback } from 'react';

export interface PerformanceMetrics {
  renderTime: number;
  componentMounts: number;
  rerenders: number;
  memoryUsage?: number;
  eventCount: number;
  lastUpdate: number;
}

export interface UsePerformanceMonitorOptions {
  enableMemoryTracking?: boolean;
  trackRerenders?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  componentName?: string;
}

/**
 * Hook for monitoring React component performance
 * Tracks render times, re-renders, memory usage, and other metrics
 */
export const usePerformanceMonitor = (
  eventCount: number = 0,
  options: UsePerformanceMonitorOptions = {}
) => {
  const {
    enableMemoryTracking = false,
    trackRerenders = true,
    onMetricsUpdate,
    componentName = 'Component'
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentMounts: 0,
    rerenders: 0,
    eventCount: 0,
    lastUpdate: Date.now()
  });

  const renderStartTime = useRef<number>(0);
  const mountCount = useRef<number>(0);
  const rerenderCount = useRef<number>(0);
  const isFirstRender = useRef<boolean>(true);

  // Start tracking render time
  const startRenderTracking = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  // End tracking render time
  const endRenderTracking = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    
    if (!isFirstRender.current && trackRerenders) {
      rerenderCount.current += 1;
    }
    
    let memoryUsage: number | undefined;
    if (enableMemoryTracking && 'memory' in performance) {
      // @ts-ignore - TypeScript doesn't know about performance.memory
      memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024); // Convert to MB
    }

    const newMetrics: PerformanceMetrics = {
      renderTime: Math.round(renderTime * 100) / 100, // Round to 2 decimal places
      componentMounts: mountCount.current,
      rerenders: rerenderCount.current,
      memoryUsage,
      eventCount,
      lastUpdate: Date.now()
    };

    setMetrics(newMetrics);
    
    if (onMetricsUpdate) {
      onMetricsUpdate(newMetrics);
    }

    // Log performance warnings
    if (renderTime > 16.67) { // More than one frame (60fps)
      console.warn(
        `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms (> 16.67ms threshold)`,
        { eventCount, rerenders: rerenderCount.current }
      );
    }

    isFirstRender.current = false;
  }, [eventCount, enableMemoryTracking, trackRerenders, onMetricsUpdate, componentName]);

  // Track component mounts
  useEffect(() => {
    mountCount.current += 1;
  }, []);

  // Start render tracking on every render
  startRenderTracking();

  // End render tracking after DOM updates
  useEffect(() => {
    endRenderTracking();
  });

  return {
    metrics,
    startRenderTracking,
    endRenderTracking
  };
};

/**
 * Hook for measuring specific operation performance
 */
export const useOperationTimer = () => {
  const [measurements, setMeasurements] = useState<Record<string, number>>({});

  const measureOperation = useCallback(<T>(
    operationName: string,
    operation: () => T
  ): T => {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    setMeasurements(prev => ({
      ...prev,
      [operationName]: Math.round(duration * 100) / 100
    }));

    if (duration > 5) { // Log operations taking more than 5ms
      console.log(`[Performance] ${operationName} took ${duration.toFixed(2)}ms`);
    }

    return result;
  }, []);

  const measureAsyncOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    setMeasurements(prev => ({
      ...prev,
      [operationName]: Math.round(duration * 100) / 100
    }));

    if (duration > 10) { // Log async operations taking more than 10ms
      console.log(`[Performance] Async ${operationName} took ${duration.toFixed(2)}ms`);
    }

    return result;
  }, []);

  return {
    measurements,
    measureOperation,
    measureAsyncOperation
  };
};

/**
 * Hook for tracking FPS and detecting performance issues
 */
export const useFPSMonitor = (enabled: boolean = false) => {
  const [fps, setFps] = useState<number>(60);
  const [avgFps, setAvgFps] = useState<number>(60);
  const frameCount = useRef<number>(0);
  const lastTime = useRef<number>(performance.now());
  const fpsHistory = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled) return;

    let animationId: number;

    const measureFPS = () => {
      const now = performance.now();
      const delta = now - lastTime.current;
      
      if (delta >= 1000) { // Calculate FPS every second
        const currentFps = Math.round((frameCount.current * 1000) / delta);
        setFps(currentFps);
        
        // Keep history of last 10 measurements for average
        fpsHistory.current.push(currentFps);
        if (fpsHistory.current.length > 10) {
          fpsHistory.current.shift();
        }
        
        const avgFpsValue = Math.round(
          fpsHistory.current.reduce((sum, fps) => sum + fps, 0) / fpsHistory.current.length
        );
        setAvgFps(avgFpsValue);
        
        // Warn about low FPS
        if (currentFps < 30) {
          console.warn(`[Performance] Low FPS detected: ${currentFps} fps`);
        }
        
        frameCount.current = 0;
        lastTime.current = now;
      } else {
        frameCount.current++;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    measureFPS();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enabled]);

  return { fps, avgFps };
};

/**
 * Performance metrics aggregator
 */
export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private readonly MAX_METRICS_PER_COMPONENT = 100;

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  recordMetrics(componentName: string, metrics: PerformanceMetrics) {
    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, []);
    }

    const componentMetrics = this.metrics.get(componentName)!;
    componentMetrics.push(metrics);

    // Keep only the last N metrics to prevent memory leaks
    if (componentMetrics.length > this.MAX_METRICS_PER_COMPONENT) {
      componentMetrics.shift();
    }
  }

  getAverageMetrics(componentName: string): PerformanceMetrics | null {
    const componentMetrics = this.metrics.get(componentName);
    if (!componentMetrics || componentMetrics.length === 0) {
      return null;
    }

    const avgMetrics = componentMetrics.reduce((acc, metrics) => ({
      renderTime: acc.renderTime + metrics.renderTime,
      componentMounts: acc.componentMounts + metrics.componentMounts,
      rerenders: acc.rerenders + metrics.rerenders,
      memoryUsage: (acc.memoryUsage || 0) + (metrics.memoryUsage || 0),
      eventCount: acc.eventCount + metrics.eventCount,
      lastUpdate: Math.max(acc.lastUpdate, metrics.lastUpdate)
    }), {
      renderTime: 0,
      componentMounts: 0,
      rerenders: 0,
      memoryUsage: 0,
      eventCount: 0,
      lastUpdate: 0
    });

    const count = componentMetrics.length;
    return {
      renderTime: Math.round((avgMetrics.renderTime / count) * 100) / 100,
      componentMounts: Math.round(avgMetrics.componentMounts / count),
      rerenders: Math.round(avgMetrics.rerenders / count),
      memoryUsage: avgMetrics.memoryUsage ? Math.round(avgMetrics.memoryUsage / count) : undefined,
      eventCount: Math.round(avgMetrics.eventCount / count),
      lastUpdate: avgMetrics.lastUpdate
    };
  }

  getAllMetrics(): Record<string, PerformanceMetrics[]> {
    const result: Record<string, PerformanceMetrics[]> = {};
    this.metrics.forEach((metrics, componentName) => {
      result[componentName] = [...metrics]; // Return copy to prevent mutation
    });
    return result;
  }

  getPerformanceReport(): string {
    let report = '=== Performance Report ===\n';
    
    this.metrics.forEach((metrics, componentName) => {
      const avgMetrics = this.getAverageMetrics(componentName);
      if (avgMetrics) {
        report += `\n${componentName}:\n`;
        report += `  Avg Render Time: ${avgMetrics.renderTime}ms\n`;
        report += `  Total Rerenders: ${avgMetrics.rerenders}\n`;
        report += `  Avg Event Count: ${avgMetrics.eventCount}\n`;
        if (avgMetrics.memoryUsage) {
          report += `  Avg Memory Usage: ${avgMetrics.memoryUsage}MB\n`;
        }
      }
    });

    return report;
  }

  clear() {
    this.metrics.clear();
  }
}