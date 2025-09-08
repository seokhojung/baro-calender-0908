"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { throttle, debounce } from 'lodash';

export interface MobilePerformanceConfig {
  enableImageLazyLoading?: boolean;
  enableVirtualScrolling?: boolean;
  enableTouchOptimization?: boolean;
  enableMemoryManagement?: boolean;
  chunkSize?: number;
  throttleDelay?: number;
  debounceDelay?: number;
}

export interface DeviceCapabilities {
  isLowEndDevice: boolean;
  hasHardwareAcceleration: boolean;
  maxMemory: number;
  connectionType: string;
  pixelRatio: number;
  screenSize: 'small' | 'medium' | 'large';
  touchSupport: boolean;
}

/**
 * Detect device capabilities and performance characteristics
 */
export const detectDeviceCapabilities = (): DeviceCapabilities => {
  const isClient = typeof window !== 'undefined';
  
  if (!isClient) {
    return {
      isLowEndDevice: false,
      hasHardwareAcceleration: true,
      maxMemory: 4,
      connectionType: '4g',
      pixelRatio: 1,
      screenSize: 'medium',
      touchSupport: false,
    };
  }

  const navigator = window.navigator as any;
  const screen = window.screen;

  // Detect low-end device
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;
  const deviceMemory = navigator.deviceMemory || 2;
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  
  const isLowEndDevice = hardwareConcurrency <= 2 || deviceMemory <= 2;

  // Check for hardware acceleration
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const hasHardwareAcceleration = !!gl;

  // Get connection info
  const connection = (navigator as any).connection || {};
  const connectionType = connection.effectiveType || '4g';

  // Screen size categorization
  const screenWidth = screen.width;
  let screenSize: 'small' | 'medium' | 'large' = 'medium';
  
  if (screenWidth < 768) screenSize = 'small';
  else if (screenWidth > 1200) screenSize = 'large';

  return {
    isLowEndDevice,
    hasHardwareAcceleration,
    maxMemory: deviceMemory,
    connectionType,
    pixelRatio: window.devicePixelRatio || 1,
    screenSize,
    touchSupport: maxTouchPoints > 0 || 'ontouchstart' in window,
  };
};

/**
 * Hook for mobile performance optimizations
 */
export const useMobilePerformance = (config: MobilePerformanceConfig = {}) => {
  const {
    enableImageLazyLoading = true,
    enableVirtualScrolling = true,
    enableTouchOptimization = true,
    enableMemoryManagement = true,
    chunkSize = 50,
    throttleDelay = 16,
    debounceDelay = 300,
  } = config;

  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    scrollPerformance: 0,
  });

  const performanceObserverRef = useRef<PerformanceObserver | null>(null);
  const memoryCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize device capabilities
  useEffect(() => {
    setDeviceCapabilities(detectDeviceCapabilities());
  }, []);

  // Performance monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Monitor paint and render performance
    if ('PerformanceObserver' in window) {
      performanceObserverRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.entryType === 'paint') {
            setPerformanceMetrics(prev => ({
              ...prev,
              renderTime: entry.startTime,
            }));
          }
        });
      });

      performanceObserverRef.current.observe({ 
        entryTypes: ['paint', 'measure', 'navigation'] 
      });
    }

    // Memory monitoring for low-end devices
    if (enableMemoryManagement && deviceCapabilities?.isLowEndDevice) {
      memoryCheckIntervalRef.current = setInterval(() => {
        if ('memory' in performance) {
          const memInfo = (performance as any).memory;
          const memoryUsage = memInfo.usedJSHeapSize / 1024 / 1024; // MB
          
          setPerformanceMetrics(prev => ({
            ...prev,
            memoryUsage,
          }));

          // Trigger garbage collection suggestion if memory usage is high
          if (memoryUsage > deviceCapabilities.maxMemory * 0.8) {
            // Suggest memory cleanup
            triggerMemoryCleanup();
          }
        }
      }, 5000);
    }

    return () => {
      performanceObserverRef.current?.disconnect();
      if (memoryCheckIntervalRef.current) {
        clearInterval(memoryCheckIntervalRef.current);
      }
    };
  }, [deviceCapabilities, enableMemoryManagement]);

  const triggerMemoryCleanup = useCallback(() => {
    // Clear any large caches or temporary data
    if (typeof window !== 'undefined') {
      // Clear image caches
      const images = document.querySelectorAll('img[data-lazy-loaded]');
      images.forEach((img) => {
        const imgElement = img as HTMLImageElement;
        if (!imgElement.getBoundingClientRect().top) {
          imgElement.src = '';
        }
      });

      // Clear event listeners that might hold references
      window.dispatchEvent(new Event('memory-pressure'));
    }
  }, []);

  // Optimized scroll handler
  const createOptimizedScrollHandler = useCallback((handler: (event: Event) => void) => {
    if (!enableTouchOptimization) return handler;

    return throttle(handler, throttleDelay, { leading: true, trailing: true });
  }, [enableTouchOptimization, throttleDelay]);

  // Optimized resize handler
  const createOptimizedResizeHandler = useCallback((handler: (event: Event) => void) => {
    return debounce(handler, debounceDelay);
  }, [debounceDelay]);

  // Chunk processing for large datasets
  const processInChunks = useCallback(<T,>(
    items: T[],
    processor: (chunk: T[]) => void,
    onComplete?: () => void
  ) => {
    if (!enableVirtualScrolling || items.length <= chunkSize) {
      processor(items);
      onComplete?.();
      return;
    }

    let currentIndex = 0;

    const processChunk = () => {
      const chunk = items.slice(currentIndex, currentIndex + chunkSize);
      processor(chunk);
      
      currentIndex += chunkSize;

      if (currentIndex < items.length) {
        // Use requestIdleCallback if available, otherwise setTimeout
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(processChunk);
        } else {
          setTimeout(processChunk, 1);
        }
      } else {
        onComplete?.();
      }
    };

    processChunk();
  }, [enableVirtualScrolling, chunkSize]);

  // Image lazy loading utility
  const createLazyImageObserver = useCallback(() => {
    if (!enableImageLazyLoading || typeof window === 'undefined') return null;

    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              img.setAttribute('data-lazy-loaded', 'true');
              observer.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );

    return imageObserver;
  }, [enableImageLazyLoading]);

  // Touch performance optimizations
  const optimizeTouchEvent = useCallback((element: HTMLElement) => {
    if (!enableTouchOptimization) return;

    // Add touch-action CSS for better performance
    element.style.touchAction = 'manipulation';
    
    // Add passive event listeners where possible
    const addPassiveListener = (event: string, handler: EventListener) => {
      element.addEventListener(event, handler, { passive: true });
    };

    return { addPassiveListener };
  }, [enableTouchOptimization]);

  // Get optimized configuration based on device capabilities
  const getOptimizedConfig = useCallback(() => {
    if (!deviceCapabilities) return {};

    const config: any = {};

    if (deviceCapabilities.isLowEndDevice) {
      config.reducedAnimations = true;
      config.lowerImageQuality = true;
      config.reducedEventListeners = true;
      config.simplifiedRendering = true;
    }

    if (deviceCapabilities.connectionType === 'slow-2g' || deviceCapabilities.connectionType === '2g') {
      config.reducedImageLoading = true;
      config.minimalAssets = true;
    }

    if (deviceCapabilities.screenSize === 'small') {
      config.compactLayout = true;
      config.reducedEventDetails = true;
    }

    if (!deviceCapabilities.hasHardwareAcceleration) {
      config.disableTransitions = true;
      config.reduce3DTransforms = true;
    }

    return config;
  }, [deviceCapabilities]);

  // Measure component performance
  const measurePerformance = useCallback((name: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    
    if ('performance' in window && 'measure' in performance) {
      performance.measure(name, { start, end });
    }
    
    return end - start;
  }, []);

  return {
    deviceCapabilities,
    performanceMetrics,
    createOptimizedScrollHandler,
    createOptimizedResizeHandler,
    processInChunks,
    createLazyImageObserver,
    optimizeTouchEvent,
    getOptimizedConfig,
    measurePerformance,
    triggerMemoryCleanup,
  };
};

/**
 * React component for performance monitoring
 */
export const PerformanceMonitor: React.FC<{
  enabled?: boolean;
  onPerformanceData?: (data: any) => void;
}> = ({ enabled = true, onPerformanceData }) => {
  const { performanceMetrics, deviceCapabilities } = useMobilePerformance();

  useEffect(() => {
    if (enabled && onPerformanceData) {
      onPerformanceData({
        metrics: performanceMetrics,
        capabilities: deviceCapabilities,
      });
    }
  }, [enabled, performanceMetrics, deviceCapabilities, onPerformanceData]);

  return null;
};

/**
 * Utility functions for mobile optimization
 */
export const mobileOptimizationUtils = {
  // Reduce motion for users who prefer it
  shouldReduceMotion: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Check if device is in battery saver mode (if available)
  isBatterySaverMode: () => {
    if (typeof window === 'undefined') return false;
    const navigator = window.navigator as any;
    return navigator.getBattery?.()?.then((battery: any) => battery.charging === false);
  },

  // Preload critical resources
  preloadResource: (href: string, as: string) => {
    if (typeof window === 'undefined') return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  },

  // Defer non-critical resources
  deferResource: (src: string, callback?: () => void) => {
    if (typeof window === 'undefined') return;
    
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        document.head.appendChild(script);
      });
    } else {
      setTimeout(() => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        document.head.appendChild(script);
      }, 100);
    }
  },
};