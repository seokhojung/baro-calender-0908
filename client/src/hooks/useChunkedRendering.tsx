import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChunkedProcessor } from '@/lib/utils/performance-utils';

export interface ChunkedRenderingOptions {
  chunkSize: number;
  delayMs: number;
  useIdleCallback: boolean;
  enableProgressTracking: boolean;
  priority: 'background' | 'normal' | 'immediate';
}

export interface ChunkedRenderingState<T> {
  items: T[];
  renderedItems: T[];
  isProcessing: boolean;
  progress: number;
  currentChunk: number;
  totalChunks: number;
  error: Error | null;
}

/**
 * Hook for chunked rendering of large datasets to prevent UI blocking
 */
export const useChunkedRendering = <T extends any>(
  items: T[],
  options: Partial<ChunkedRenderingOptions> = {}
) => {
  const {
    chunkSize = 50,
    delayMs = 1,
    useIdleCallback = true,
    enableProgressTracking = true,
    priority = 'normal'
  } = options;

  const [state, setState] = useState<ChunkedRenderingState<T>>({
    items: [],
    renderedItems: [],
    isProcessing: false,
    progress: 0,
    currentChunk: 0,
    totalChunks: 0,
    error: null
  });

  const processingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const processChunks = useCallback(async (itemsToProcess: T[]) => {
    if (processingRef.current) {
      // Cancel previous processing
      abortControllerRef.current?.abort();
    }

    processingRef.current = true;
    abortControllerRef.current = new AbortController();

    const totalChunks = Math.ceil(itemsToProcess.length / chunkSize);
    const renderedItems: T[] = [];

    setState(prev => ({
      ...prev,
      items: itemsToProcess,
      renderedItems: [],
      isProcessing: true,
      progress: 0,
      currentChunk: 0,
      totalChunks,
      error: null
    }));

    try {
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        const startIndex = chunkIndex * chunkSize;
        const endIndex = Math.min(startIndex + chunkSize, itemsToProcess.length);
        const chunk = itemsToProcess.slice(startIndex, endIndex);

        renderedItems.push(...chunk);

        const progress = ((chunkIndex + 1) / totalChunks) * 100;

        setState(prev => ({
          ...prev,
          renderedItems: [...renderedItems],
          progress: enableProgressTracking ? progress : 100,
          currentChunk: chunkIndex + 1
        }));

        // Yield control based on priority
        if (chunkIndex < totalChunks - 1) {
          if (priority === 'immediate') {
            // No delay for immediate priority
            continue;
          } else if (priority === 'background' && useIdleCallback && 'requestIdleCallback' in window) {
            await new Promise<void>((resolve) => {
              requestIdleCallback(() => resolve(), { timeout: 50 });
            });
          } else {
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }
      }

      setState(prev => ({
        ...prev,
        isProcessing: false,
        progress: 100
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error as Error,
        progress: 0
      }));
    } finally {
      processingRef.current = false;
    }
  }, [chunkSize, delayMs, useIdleCallback, enableProgressTracking, priority]);

  // Start processing when items change
  useEffect(() => {
    if (items.length > 0) {
      processChunks(items);
    } else {
      setState(prev => ({
        ...prev,
        items: [],
        renderedItems: [],
        isProcessing: false,
        progress: 0,
        currentChunk: 0,
        totalChunks: 0,
        error: null
      }));
    }
  }, [items, processChunks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      processingRef.current = false;
    };
  }, []);

  const retry = useCallback(() => {
    if (!processingRef.current) {
      processChunks(state.items);
    }
  }, [processChunks, state.items]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setState(prev => ({
      ...prev,
      isProcessing: false,
      progress: 0,
      error: new Error('Processing cancelled by user')
    }));
  }, []);

  return {
    ...state,
    retry,
    cancel,
    isCompleted: state.progress === 100 && !state.isProcessing
  };
};

/**
 * Hook for chunked processing with custom processor function
 */
export const useChunkedProcessor = <T, R>(
  items: T[],
  processor: (items: T[]) => R[],
  options: Partial<ChunkedRenderingOptions> = {}
) => {
  const [results, setResults] = useState<R[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const {
    chunkSize = 100,
    delayMs = 2,
    useIdleCallback = true,
    priority = 'normal'
  } = options;

  const processWithChunks = useCallback(async () => {
    if (items.length === 0) {
      setResults([]);
      setProgress(0);
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setResults([]);

    try {
      const processedResults = await ChunkedProcessor.processInChunks(
        items,
        processor,
        chunkSize,
        delayMs
      );

      setResults(processedResults);
      setProgress(100);
    } catch (err) {
      setError(err as Error);
      setResults([]);
    } finally {
      setIsProcessing(false);
    }
  }, [items, processor, chunkSize, delayMs]);

  useEffect(() => {
    processWithChunks();
  }, [processWithChunks]);

  return {
    results,
    isProcessing,
    progress,
    error,
    retry: processWithChunks
  };
};

/**
 * Hook for progressive loading with intersection observer
 */
export const useProgressiveLoading = <T extends any>(
  allItems: T[],
  options: {
    initialCount: number;
    loadMore: number;
    threshold: number;
  } = {
    initialCount: 20,
    loadMore: 20,
    threshold: 0.8
  }
) => {
  const [visibleCount, setVisibleCount] = useState(options.initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const visibleItems = useMemo(
    () => allItems.slice(0, visibleCount),
    [allItems, visibleCount]
  );

  const hasMore = visibleCount < allItems.length;

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    // Simulate async loading delay
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + options.loadMore, allItems.length));
      setIsLoading(false);
    }, 100);
  }, [isLoading, hasMore, options.loadMore, allItems.length]);

  // Set up intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: options.threshold }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [loadMore, hasMore, isLoading, options.threshold]);

  // Reset when allItems change
  useEffect(() => {
    setVisibleCount(options.initialCount);
    setIsLoading(false);
  }, [allItems, options.initialCount]);

  return {
    visibleItems,
    isLoading,
    hasMore,
    loadMore,
    sentinelRef,
    progress: (visibleCount / allItems.length) * 100
  };
};

/**
 * Component for rendering a progress indicator during chunked processing
 */
export const ChunkedRenderingProgress: React.FC<{
  isProcessing: boolean;
  progress: number;
  currentChunk: number;
  totalChunks: number;
  className?: string;
}> = ({ isProcessing, progress, currentChunk, totalChunks, className }) => {
  if (!isProcessing) return null;

  return (
    <div className={`bg-background/95 backdrop-blur-sm border rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Processing items...</span>
            <span className="text-xs text-muted-foreground">
              {currentChunk} / {totalChunks} chunks
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};