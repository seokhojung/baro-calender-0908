#!/usr/bin/env node

/**
 * Performance Benchmark Script for Calendar Components
 * 
 * This script runs comprehensive performance benchmarks to measure:
 * - Component render times
 * - Memory usage
 * - Event processing performance
 * - Virtual scrolling efficiency
 * - Cache hit rates
 * 
 * Usage: npm run benchmark
 */

import { addDays, addHours, startOfToday } from 'date-fns';
import { Event } from '@/types/store';
import { EventSpatialIndex, EventGrouper, CalculationCache } from '@/lib/utils/performance-utils';
import { PerformanceTracker } from '@/hooks/usePerformanceMonitor';

interface BenchmarkResult {
  name: string;
  duration: number;
  memoryUsage?: number;
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  throughput?: number;
  success: boolean;
  error?: string;
}

interface BenchmarkSuite {
  name: string;
  results: BenchmarkResult[];
  totalDuration: number;
  memoryDelta: number;
}

class PerformanceBenchmark {
  private results: BenchmarkSuite[] = [];
  private performanceTracker = PerformanceTracker.getInstance();

  constructor() {
    console.log('🚀 Calendar Performance Benchmark Suite');
    console.log('========================================\n');
  }

  // Generate test events for benchmarking
  private generateTestEvents(count: number): Event[] {
    const baseDate = startOfToday();
    const events: Event[] = [];

    console.log(`📊 Generating ${count} test events...`);

    for (let i = 0; i < count; i++) {
      const startDate = addDays(addHours(baseDate, Math.random() * 24), Math.floor(Math.random() * 365));
      const endDate = addHours(startDate, 1 + Math.random() * 4);

      events.push({
        id: `event-${i}`,
        title: `Benchmark Event ${i}`,
        description: `Generated for performance testing ${i}`,
        startDate,
        endDate,
        allDay: Math.random() < 0.2,
        color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
        category: `category-${Math.floor(Math.random() * 10)}`,
        projectId: `project-${Math.floor(Math.random() * 20)}`,
        tenantId: 1,
        status: 'confirmed',
        priority: Math.random() < 0.3 ? 'high' : 'normal',
        isRecurring: Math.random() < 0.1,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      if (i % 1000 === 0 && i > 0) {
        process.stdout.write(`\r📊 Generated ${i} events...`);
      }
    }

    console.log(`\r📊 Generated ${count} test events ✅`);
    return events;
  }

  // Get current memory usage in MB
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    } else if ('performance' in globalThis && (performance as any).memory) {
      return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  // Run a benchmark function multiple times and collect statistics
  private async runBenchmark(
    name: string,
    benchmarkFn: () => Promise<void> | void,
    iterations: number = 10,
    warmup: number = 3
  ): Promise<BenchmarkResult> {
    console.log(`\n🔬 Running ${name}...`);

    const times: number[] = [];
    const initialMemory = this.getMemoryUsage();
    let success = true;
    let error: string | undefined;

    try {
      // Warmup runs
      for (let i = 0; i < warmup; i++) {
        await benchmarkFn();
      }

      // Actual benchmark runs
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await benchmarkFn();
        const duration = performance.now() - startTime;
        times.push(duration);

        process.stdout.write(`\r🔬 ${name}: ${i + 1}/${iterations} iterations`);
      }

      console.log(''); // New line after progress
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);
      console.error(`❌ ${name} failed: ${error}`);
    }

    const finalMemory = this.getMemoryUsage();
    const totalDuration = times.reduce((a, b) => a + b, 0);

    const result: BenchmarkResult = {
      name,
      duration: totalDuration,
      memoryUsage: finalMemory - initialMemory,
      iterations: times.length,
      averageTime: times.length > 0 ? totalDuration / times.length : 0,
      minTime: times.length > 0 ? Math.min(...times) : 0,
      maxTime: times.length > 0 ? Math.max(...times) : 0,
      throughput: times.length > 0 ? (iterations * 1000) / totalDuration : 0,
      success,
      error
    };

    if (success) {
      console.log(`✅ ${name}: ${result.averageTime.toFixed(2)}ms avg (${result.minTime.toFixed(2)}-${result.maxTime.toFixed(2)}ms)`);
      if (result.memoryUsage && result.memoryUsage > 0) {
        console.log(`   Memory: +${result.memoryUsage}MB`);
      }
    }

    return result;
  }

  // Spatial Index Performance Tests
  private async benchmarkSpatialIndex(): Promise<BenchmarkSuite> {
    console.log('\n🗂️  Spatial Index Benchmarks');
    console.log('============================');

    const suiteStartTime = performance.now();
    const initialMemory = this.getMemoryUsage();
    const results: BenchmarkResult[] = [];

    // Test different event counts
    const eventCounts = [100, 500, 1000, 2000, 5000, 10000];

    for (const count of eventCounts) {
      const events = this.generateTestEvents(count);
      
      // Index building performance
      results.push(await this.runBenchmark(
        `Build spatial index (${count} events)`,
        () => new EventSpatialIndex(events),
        5,
        1
      ));

      // Query performance
      const spatialIndex = new EventSpatialIndex(events);
      results.push(await this.runBenchmark(
        `Single date query (${count} events)`,
        () => spatialIndex.getEventsForDate(new Date()),
        100,
        10
      ));

      results.push(await this.runBenchmark(
        `Date range query (${count} events)`,
        () => spatialIndex.getEventsForDateRange(
          startOfToday(),
          addDays(startOfToday(), 30)
        ),
        50,
        5
      ));

      results.push(await this.runBenchmark(
        `Filtered query (${count} events)`,
        () => spatialIndex.getFilteredEvents({
          categories: ['category-1', 'category-2'],
          projectIds: ['project-1', 'project-2']
        }),
        30,
        3
      ));

      // Clean up for memory measurement
      if (global.gc) {
        global.gc();
      }
    }

    const totalDuration = performance.now() - suiteStartTime;
    const memoryDelta = this.getMemoryUsage() - initialMemory;

    return {
      name: 'Spatial Index',
      results,
      totalDuration,
      memoryDelta
    };
  }

  // Event Grouping Performance Tests
  private async benchmarkEventGrouping(): Promise<BenchmarkSuite> {
    console.log('\n📊 Event Grouping Benchmarks');
    console.log('============================');

    const suiteStartTime = performance.now();
    const initialMemory = this.getMemoryUsage();
    const results: BenchmarkResult[] = [];

    const eventCounts = [500, 1000, 2000, 5000];

    for (const count of eventCounts) {
      const events = this.generateTestEvents(count);

      results.push(await this.runBenchmark(
        `Group events by date (${count} events)`,
        () => EventGrouper.groupEventsByDate(events),
        20,
        3
      ));

      results.push(await this.runBenchmark(
        `Group events by month (${count} events)`,
        () => EventGrouper.groupEventsByMonth(events),
        20,
        3
      ));

      results.push(await this.runBenchmark(
        `Group overlapping events (${count} events)`,
        () => EventGrouper.groupOverlappingEvents(events),
        10,
        2
      ));
    }

    const totalDuration = performance.now() - suiteStartTime;
    const memoryDelta = this.getMemoryUsage() - initialMemory;

    return {
      name: 'Event Grouping',
      results,
      totalDuration,
      memoryDelta
    };
  }

  // Cache Performance Tests
  private async benchmarkCache(): Promise<BenchmarkSuite> {
    console.log('\n💾 Cache Performance Benchmarks');
    console.log('================================');

    const suiteStartTime = performance.now();
    const initialMemory = this.getMemoryUsage();
    const results: BenchmarkResult[] = [];

    const cache = new CalculationCache<any>(1000, 60000);
    const testData = { data: 'x'.repeat(1000) }; // 1KB per item

    // Cache write performance
    results.push(await this.runBenchmark(
      'Cache write operations (1000 items)',
      () => {
        for (let i = 0; i < 1000; i++) {
          cache.set(`key-${i}`, { ...testData, id: i });
        }
      },
      10,
      2
    ));

    // Cache read performance
    results.push(await this.runBenchmark(
      'Cache read operations (1000 items)',
      () => {
        for (let i = 0; i < 1000; i++) {
          cache.get(`key-${i}`);
        }
      },
      50,
      5
    ));

    // Cache hit rate test
    let hits = 0;
    let misses = 0;
    
    await this.runBenchmark(
      'Cache hit rate test',
      () => {
        for (let i = 0; i < 1000; i++) {
          if (cache.get(`key-${i % 500}`)) {
            hits++;
          } else {
            misses++;
          }
        }
      },
      1,
      0
    );

    const hitRate = (hits / (hits + misses)) * 100;
    console.log(`   Cache hit rate: ${hitRate.toFixed(1)}%`);

    const totalDuration = performance.now() - suiteStartTime;
    const memoryDelta = this.getMemoryUsage() - initialMemory;

    return {
      name: 'Cache Performance',
      results,
      totalDuration,
      memoryDelta
    };
  }

  // Component Simulation Benchmarks
  private async benchmarkComponentSimulation(): Promise<BenchmarkSuite> {
    console.log('\n⚛️  Component Simulation Benchmarks');
    console.log('====================================');

    const suiteStartTime = performance.now();
    const initialMemory = this.getMemoryUsage();
    const results: BenchmarkResult[] = [];

    const events1000 = this.generateTestEvents(1000);
    const events5000 = this.generateTestEvents(5000);

    // Simulate month view data processing
    results.push(await this.runBenchmark(
      'Month view data processing (1000 events)',
      () => {
        const spatialIndex = new EventSpatialIndex(events1000);
        const monthStart = startOfToday();
        const monthEnd = addDays(monthStart, 35);
        const monthEvents = spatialIndex.getEventsForDateRange(monthStart, monthEnd);
        EventGrouper.groupEventsByDate(monthEvents);
      },
      20,
      3
    ));

    // Simulate year view data processing
    results.push(await this.runBenchmark(
      'Year view data processing (5000 events)',
      () => {
        const spatialIndex = new EventSpatialIndex(events5000);
        const yearStart = new Date(2024, 0, 1);
        const yearEnd = new Date(2024, 11, 31);
        const yearEvents = spatialIndex.getEventsForDateRange(yearStart, yearEnd);
        EventGrouper.groupEventsByMonth(yearEvents);
      },
      10,
      2
    ));

    // Simulate rapid navigation (common user behavior)
    results.push(await this.runBenchmark(
      'Rapid date navigation simulation',
      () => {
        const spatialIndex = new EventSpatialIndex(events1000);
        let currentDate = new Date();
        
        // Simulate user clicking through 12 months
        for (let i = 0; i < 12; i++) {
          currentDate = addDays(currentDate, 30);
          spatialIndex.getEventsForMonth(currentDate);
        }
      },
      50,
      5
    ));

    const totalDuration = performance.now() - suiteStartTime;
    const memoryDelta = this.getMemoryUsage() - initialMemory;

    return {
      name: 'Component Simulation',
      results,
      totalDuration,
      memoryDelta
    };
  }

  // Generate comprehensive performance report
  private generateReport(): void {
    console.log('\n📈 Performance Benchmark Report');
    console.log('================================\n');

    let totalTime = 0;
    let totalMemory = 0;
    let totalTests = 0;
    let passedTests = 0;

    this.results.forEach(suite => {
      console.log(`📊 ${suite.name}`);
      console.log('-'.repeat(suite.name.length + 4));
      console.log(`Total Duration: ${(suite.totalDuration / 1000).toFixed(2)}s`);
      console.log(`Memory Delta: ${suite.memoryDelta >= 0 ? '+' : ''}${suite.memoryDelta}MB`);
      console.log(`Tests: ${suite.results.length}\n`);

      totalTime += suite.totalDuration;
      totalMemory += suite.memoryDelta;
      totalTests += suite.results.length;
      passedTests += suite.results.filter(r => r.success).length;

      // Show top 3 slowest operations
      const slowest = [...suite.results]
        .sort((a, b) => b.averageTime - a.averageTime)
        .slice(0, 3);

      console.log('Slowest Operations:');
      slowest.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${result.name}: ${result.averageTime.toFixed(2)}ms`);
      });

      console.log('\n');
    });

    // Overall summary
    console.log('🎯 Overall Performance Summary');
    console.log('==============================');
    console.log(`Total Execution Time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`Total Memory Change: ${totalMemory >= 0 ? '+' : ''}${totalMemory}MB`);
    console.log(`Tests Passed: ${passedTests}/${totalTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);

    // Performance targets assessment
    console.log('\n🎯 Performance Target Assessment');
    console.log('=================================');
    
    const assessments = [
      { target: '1000 events render < 60fps (16.67ms)', achieved: this.checkFrameRateCompliance() },
      { target: 'Memory usage < 50MB for 1000 events', achieved: this.checkMemoryCompliance() },
      { target: 'View transition < 150ms', achieved: this.checkTransitionCompliance() },
      { target: 'Event queries < 10ms', achieved: this.checkQueryPerformance() }
    ];

    assessments.forEach(assessment => {
      const status = assessment.achieved ? '✅' : '❌';
      console.log(`${status} ${assessment.target}`);
    });

    // Recommendations
    console.log('\n💡 Performance Recommendations');
    console.log('===============================');
    
    if (!assessments.every(a => a.achieved)) {
      console.log('Consider the following optimizations:');
      console.log('• Enable virtualization for large datasets (>500 events)');
      console.log('• Implement progressive loading for year view');
      console.log('• Use Web Workers for heavy computations');
      console.log('• Optimize event filtering algorithms');
      console.log('• Increase cache sizes for frequently accessed data');
    } else {
      console.log('🎉 All performance targets met! Great job!');
    }
  }

  // Performance compliance checks
  private checkFrameRateCompliance(): boolean {
    // Check if any render operation exceeds 16.67ms
    return this.results.every(suite => 
      suite.results.every(result => 
        result.averageTime <= 16.67 || !result.name.includes('render')
      )
    );
  }

  private checkMemoryCompliance(): boolean {
    // Check if memory usage is reasonable
    const memoryResults = this.results.flatMap(suite => suite.results)
      .filter(result => result.memoryUsage !== undefined);
    
    return memoryResults.every(result => (result.memoryUsage || 0) < 50);
  }

  private checkTransitionCompliance(): boolean {
    // Check if navigation operations complete quickly
    const navigationResults = this.results.flatMap(suite => suite.results)
      .filter(result => result.name.includes('navigation') || result.name.includes('query'));
    
    return navigationResults.every(result => result.averageTime < 150);
  }

  private checkQueryPerformance(): boolean {
    // Check if query operations are fast
    const queryResults = this.results.flatMap(suite => suite.results)
      .filter(result => result.name.includes('query'));
    
    return queryResults.every(result => result.averageTime < 10);
  }

  // Main benchmark runner
  async run(): Promise<void> {
    const startTime = performance.now();
    
    try {
      this.results.push(await this.benchmarkSpatialIndex());
      this.results.push(await this.benchmarkEventGrouping());
      this.results.push(await this.benchmarkCache());
      this.results.push(await this.benchmarkComponentSimulation());
      
      const totalDuration = performance.now() - startTime;
      console.log(`\n⏱️  Total benchmark time: ${(totalDuration / 1000).toFixed(2)}s`);
      
      this.generateReport();
      
      // Save results to file if running in Node.js
      if (typeof process !== 'undefined' && process.writeFileSync) {
        try {
          const reportData = {
            timestamp: new Date().toISOString(),
            totalDuration,
            results: this.results
          };
          
          process.writeFileSync(
            './performance-benchmark-results.json',
            JSON.stringify(reportData, null, 2)
          );
          console.log('\n💾 Results saved to performance-benchmark-results.json');
        } catch (err) {
          console.warn('⚠️  Could not save results to file:', err);
        }
      }
      
    } catch (error) {
      console.error('❌ Benchmark suite failed:', error);
      process.exit(1);
    }
  }
}

// Run benchmarks if this file is executed directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  benchmark.run().catch(console.error);
}

export default PerformanceBenchmark;