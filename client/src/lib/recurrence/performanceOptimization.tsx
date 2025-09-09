// Performance Optimization and Caching for Recurring Schedules - Story 1.8
// Advanced caching, memoization, and performance monitoring for recurring schedule system

import { format } from 'date-fns'
import {
  RecurringSchedule,
  EnhancedScheduleInstance,
  RecurrenceCache,
  RecurrencePerformanceMetrics
} from '../../types/recurrence'
import { RecurrenceEngine } from './rruleEngine'

// Performance Monitoring
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map()
  
  static recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const values = this.metrics.get(name)!
    values.push(value)
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }
  
  static getAverageMetric(name: string): number {
    const values = this.metrics.get(name) || []
    if (values.length === 0) return 0
    
    const sum = values.reduce((acc, val) => acc + val, 0)
    return sum / values.length
  }
  
  static getMetricsReport(): Record<string, { average: number; count: number; latest: number }> {
    const report: Record<string, { average: number; count: number; latest: number }> = {}
    
    for (const [name, values] of this.metrics.entries()) {
      report[name] = {
        average: this.getAverageMetric(name),
        count: values.length,
        latest: values[values.length - 1] || 0
      }
    }
    
    return report
  }
  
  static clearMetrics(): void {
    this.metrics.clear()
  }
}

// Advanced Caching System
export class RecurringScheduleCache {
  private static instanceCache = new Map<string, RecurrenceCache>()
  private static memoryUsage = new Map<string, number>()
  private static maxMemoryMB = 50 // 50MB limit
  
  /**
   * Generate cache key from schedule ID and date range
   */
  static generateCacheKey(
    recurringScheduleId: string, 
    dateRange: { start: Date; end: Date }
  ): string {
    const startMonth = format(dateRange.start, 'yyyy-MM')
    const endMonth = format(dateRange.end, 'yyyy-MM')
    return `${recurringScheduleId}_${startMonth}_${endMonth}`
  }
  
  /**
   * Get cached instances if available and not expired
   */
  static getCachedInstances(
    recurringSchedule: RecurringSchedule,
    dateRange: { start: Date; end: Date }
  ): EnhancedScheduleInstance[] | null {
    const cacheKey = this.generateCacheKey(recurringSchedule.id, dateRange)
    const cached = this.instanceCache.get(cacheKey)
    
    if (!cached) return null
    
    // Check expiration
    if (Date.now() > cached.expiresAt) {
      this.instanceCache.delete(cacheKey)
      this.memoryUsage.delete(cacheKey)
      return null
    }
    
    // Check if schedule version changed (optimistic updates)
    if (recurringSchedule.version && cached.generatedAt < recurringSchedule.updatedAt) {
      this.instanceCache.delete(cacheKey)
      this.memoryUsage.delete(cacheKey)
      return null
    }
    
    return cached.instances
  }
  
  /**
   * Cache generated instances
   */
  static setCachedInstances(
    recurringSchedule: RecurringSchedule,
    dateRange: { start: Date; end: Date },
    instances: EnhancedScheduleInstance[]
  ): void {
    const cacheKey = this.generateCacheKey(recurringSchedule.id, dateRange)
    
    // Calculate memory usage (rough estimate)
    const instanceSize = this.estimateInstanceSize(instances)
    
    // Check memory limit
    if (this.getTotalMemoryUsage() + instanceSize > this.maxMemoryMB * 1024 * 1024) {
      this.evictOldestEntries(instanceSize)
    }
    
    const cache: RecurrenceCache = {
      scheduleId: recurringSchedule.id,
      dateRange: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString()
      },
      instances,
      generatedAt: Date.now(),
      expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour expiration
    }
    
    this.instanceCache.set(cacheKey, cache)
    this.memoryUsage.set(cacheKey, instanceSize)
  }
  
  /**
   * Invalidate cache for specific schedule
   */
  static invalidateCache(recurringScheduleId?: string): void {
    if (recurringScheduleId) {
      // Remove specific schedule entries
      const keysToDelete = Array.from(this.instanceCache.keys())
        .filter(key => key.startsWith(`${recurringScheduleId}_`))
      
      keysToDelete.forEach(key => {
        this.instanceCache.delete(key)
        this.memoryUsage.delete(key)
      })
    } else {
      // Clear all cache
      this.instanceCache.clear()
      this.memoryUsage.clear()
    }
  }
  
  /**
   * Clean up expired cache entries
   */
  static cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []
    
    for (const [key, cache] of this.instanceCache.entries()) {
      if (now > cache.expiresAt) {
        expiredKeys.push(key)
      }
    }
    
    expiredKeys.forEach(key => {
      this.instanceCache.delete(key)
      this.memoryUsage.delete(key)
    })
    
    if (expiredKeys.length > 0) {
      PerformanceMonitor.recordMetric('cache-cleanup-count', expiredKeys.length)
    }
  }
  
  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    entries: number
    memoryUsageMB: number
    hitRate: number
    oldestEntry?: Date
    newestEntry?: Date
  } {
    const entries = this.instanceCache.size
    const memoryUsageMB = this.getTotalMemoryUsage() / (1024 * 1024)
    
    // Calculate hit rate from performance metrics
    const cacheHits = PerformanceMonitor.getAverageMetric('cache-hits')
    const cacheMisses = PerformanceMonitor.getAverageMetric('cache-misses')
    const hitRate = cacheHits + cacheMisses > 0 ? cacheHits / (cacheHits + cacheMisses) : 0
    
    // Find oldest and newest entries
    let oldestTime = Infinity
    let newestTime = 0
    
    for (const cache of this.instanceCache.values()) {
      if (cache.generatedAt < oldestTime) oldestTime = cache.generatedAt
      if (cache.generatedAt > newestTime) newestTime = cache.generatedAt
    }
    
    return {
      entries,
      memoryUsageMB,
      hitRate,
      oldestEntry: oldestTime !== Infinity ? new Date(oldestTime) : undefined,
      newestEntry: newestTime > 0 ? new Date(newestTime) : undefined
    }
  }
  
  /**
   * Estimate memory usage of instances array
   */
  private static estimateInstanceSize(instances: EnhancedScheduleInstance[]): number {
    if (instances.length === 0) return 0
    
    // Rough estimate: 1KB per instance
    return instances.length * 1024
  }
  
  /**
   * Get total memory usage
   */
  private static getTotalMemoryUsage(): number {
    let total = 0
    for (const size of this.memoryUsage.values()) {
      total += size
    }
    return total
  }
  
  /**
   * Evict oldest cache entries to free memory
   */
  private static evictOldestEntries(neededSpace: number): void {
    const entries = Array.from(this.instanceCache.entries())
      .sort(([, a], [, b]) => a.generatedAt - b.generatedAt)
    
    let freedSpace = 0
    let evictedCount = 0
    
    for (const [key, cache] of entries) {
      if (freedSpace >= neededSpace) break
      
      const size = this.memoryUsage.get(key) || 0
      this.instanceCache.delete(key)
      this.memoryUsage.delete(key)
      freedSpace += size
      evictedCount++
    }
    
    PerformanceMonitor.recordMetric('cache-evictions', evictedCount)
  }
}

// Performance-optimized instance generation with caching
export class OptimizedRecurrenceEngine {
  /**
   * Generate instances with caching and performance monitoring
   */
  static async generateInstancesOptimized(
    recurringSchedule: RecurringSchedule,
    dateRange: { start: Date; end: Date }
  ): Promise<EnhancedScheduleInstance[]> {
    const startTime = performance.now()
    
    // Check cache first
    const cached = RecurringScheduleCache.getCachedInstances(recurringSchedule, dateRange)
    if (cached) {
      const endTime = performance.now()
      PerformanceMonitor.recordMetric('cache-hits', 1)
      PerformanceMonitor.recordMetric('generation-time-cached', endTime - startTime)
      return cached
    }
    
    PerformanceMonitor.recordMetric('cache-misses', 1)
    
    // Generate instances
    try {
      const instances = RecurrenceEngine.generateInstances(recurringSchedule, dateRange)
      const endTime = performance.now()
      const generationTime = endTime - startTime
      
      // Record performance metrics
      PerformanceMonitor.recordMetric('generation-time', generationTime)
      PerformanceMonitor.recordMetric('instance-count', instances.length)
      
      // Cache the results
      RecurringScheduleCache.setCachedInstances(recurringSchedule, dateRange, instances)
      
      return instances
    } catch (error) {
      console.error('Failed to generate optimized instances:', error)
      PerformanceMonitor.recordMetric('generation-errors', 1)
      return []
    }
  }
  
  /**
   * Batch generate instances for multiple schedules
   */
  static async batchGenerateInstances(
    schedules: RecurringSchedule[],
    dateRange: { start: Date; end: Date }
  ): Promise<Map<string, EnhancedScheduleInstance[]>> {
    const startTime = performance.now()
    const results = new Map<string, EnhancedScheduleInstance[]>()
    
    // Use Promise.allSettled to handle individual failures gracefully
    const promises = schedules.map(async (schedule) => {
      const instances = await this.generateInstancesOptimized(schedule, dateRange)
      return { scheduleId: schedule.id, instances }
    })
    
    const settled = await Promise.allSettled(promises)
    
    let successCount = 0
    let errorCount = 0
    
    settled.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.set(result.value.scheduleId, result.value.instances)
        successCount++
      } else {
        console.error('Failed to generate instances for schedule:', result.reason)
        errorCount++
      }
    })
    
    const endTime = performance.now()
    PerformanceMonitor.recordMetric('batch-generation-time', endTime - startTime)
    PerformanceMonitor.recordMetric('batch-success-count', successCount)
    PerformanceMonitor.recordMetric('batch-error-count', errorCount)
    
    return results
  }
}

// Memory management utilities
export class MemoryManager {
  /**
   * Monitor memory usage and trigger cleanup when needed
   */
  static monitorMemoryUsage(): void {
    // Check memory usage every 30 seconds
    setInterval(() => {
      const stats = RecurringScheduleCache.getCacheStats()
      PerformanceMonitor.recordMetric('memory-usage-mb', stats.memoryUsageMB)
      
      // Trigger cleanup if memory usage is high
      if (stats.memoryUsageMB > 40) { // 40MB threshold
        RecurringScheduleCache.cleanup()
        PerformanceMonitor.recordMetric('memory-cleanup-triggered', 1)
      }
    }, 30000)
  }
  
  /**
   * Force garbage collection and cleanup
   */
  static forceCleanup(): void {
    RecurringScheduleCache.cleanup()
    PerformanceMonitor.recordMetric('force-cleanup', 1)
    
    // Try to trigger garbage collection if available
    if (typeof window !== 'undefined' && 'gc' in window) {
      try {
        (window as any).gc()
      } catch (e) {
        // GC not available, ignore
      }
    }
  }
  
  /**
   * Get memory status report
   */
  static getMemoryStatus(): {
    cacheStats: ReturnType<typeof RecurringScheduleCache.getCacheStats>
    performanceMetrics: RecurrencePerformanceMetrics
  } {
    const cacheStats = RecurringScheduleCache.getCacheStats()
    const metricsReport = PerformanceMonitor.getMetricsReport()
    
    const performanceMetrics: RecurrencePerformanceMetrics = {
      generationTime: metricsReport['generation-time']?.average || 0,
      instanceCount: metricsReport['instance-count']?.average || 0,
      cacheHitRate: cacheStats.hitRate,
      memoryUsage: cacheStats.memoryUsageMB * 1024 * 1024 // Convert to bytes
    }
    
    return {
      cacheStats,
      performanceMetrics
    }
  }
}

// Performance tracking decorator
export function trackPerformance<T extends (...args: any[]) => any>(
  target: any,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<T>
): TypedPropertyDescriptor<T> | void {
  const originalMethod = descriptor.value!
  
  descriptor.value = function (...args: any[]) {
    const startTime = performance.now()
    const result = originalMethod.apply(this, args)
    const endTime = performance.now()
    
    PerformanceMonitor.recordMetric(`${propertyName}-duration`, endTime - startTime)
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const asyncEndTime = performance.now()
        PerformanceMonitor.recordMetric(`${propertyName}-async-duration`, asyncEndTime - startTime)
      })
    }
    
    return result
  } as T
}

// Initialize performance monitoring
export const initializePerformanceMonitoring = (): void => {
  // Start memory monitoring
  MemoryManager.monitorMemoryUsage()
  
  // Clean up cache every 5 minutes
  setInterval(() => {
    RecurringScheduleCache.cleanup()
  }, 5 * 60 * 1000)
  
  // Log performance metrics every 2 minutes in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const status = MemoryManager.getMemoryStatus()
      console.log('Recurrence Performance Status:', status)
    }, 2 * 60 * 1000)
  }
}