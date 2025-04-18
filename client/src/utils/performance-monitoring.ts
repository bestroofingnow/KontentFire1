/**
 * A utility for basic performance monitoring and tracking
 * This is a lightweight alternative to more comprehensive solutions like New Relic or Sentry
 */

/**
 * An interface for defining custom performance metrics
 */
export interface PerformanceMetric {
  name: string;
  startTime: number;
  duration?: number;
  data?: Record<string, any>;
}

/**
 * A class for tracking performance metrics
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private ongoing: Map<string, PerformanceMetric> = new Map();
  private enabled: boolean = true;
  private samplingRate: number = 1.0; // 1.0 = 100% of metrics are recorded
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  /**
   * Enable or disable performance tracking
   * @param enabled Whether tracking is enabled
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Set the sampling rate (0.0 to 1.0)
   * @param rate The sampling rate (0.0 to 1.0)
   */
  public setSamplingRate(rate: number): void {
    this.samplingRate = Math.max(0, Math.min(1, rate));
  }
  
  /**
   * Start tracking a performance metric
   * @param name The name of the metric
   * @param data Optional data to associate with the metric
   * @returns The name of the metric (for use with endMetric)
   */
  public startMetric(name: string, data?: Record<string, any>): string {
    if (!this.enabled || Math.random() > this.samplingRate) {
      return name;
    }
    
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      data
    };
    this.ongoing.set(name, metric);
    return name;
  }
  
  /**
   * End tracking a performance metric
   * @param name The name of the metric
   * @param additionalData Optional additional data to merge with the metric's data
   * @returns The duration of the metric in milliseconds, or undefined if the metric wasn't found
   */
  public endMetric(name: string, additionalData?: Record<string, any>): number | undefined {
    if (!this.enabled) {
      return undefined;
    }
    
    const metric = this.ongoing.get(name);
    if (!metric) {
      console.warn(`No ongoing metric found with name: ${name}`);
      return undefined;
    }
    
    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    metric.duration = duration;
    
    if (additionalData) {
      metric.data = { ...metric.data, ...additionalData };
    }
    
    this.metrics.push(metric);
    this.ongoing.delete(name);
    
    return duration;
  }
  
  /**
   * Record a metric with a known duration
   * @param name The name of the metric
   * @param duration The duration in milliseconds
   * @param data Optional data to associate with the metric
   */
  public recordMetric(name: string, duration: number, data?: Record<string, any>): void {
    if (!this.enabled || Math.random() > this.samplingRate) {
      return;
    }
    
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now() - duration,
      duration,
      data
    };
    
    this.metrics.push(metric);
  }
  
  /**
   * Get all recorded metrics
   * @returns The recorded metrics
   */
  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
  
  /**
   * Clear all recorded metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
  }
  
  /**
   * Get metrics filtered by name
   * @param name The name to filter by
   * @returns The filtered metrics
   */
  public getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }
  
  /**
   * Get the average duration of metrics with a given name
   * @param name The name to filter by
   * @returns The average duration, or undefined if no metrics match
   */
  public getAverageDuration(name: string): number | undefined {
    const filtered = this.metrics.filter(
      metric => metric.name === name && typeof metric.duration === 'number'
    );
    
    if (filtered.length === 0) {
      return undefined;
    }
    
    const sum = filtered.reduce(
      (acc, metric) => acc + (metric.duration as number), 0
    );
    
    return sum / filtered.length;
  }
}

// Export a singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Decorator for measuring method performance
 * Note: This requires TypeScript's experimentalDecorators to be enabled
 * 
 * @example
 * class MyService {
 *   @measure()
 *   public async fetchData() {
 *     // Method implementation
 *   }
 * }
 */
export function measure() {
  return function (
    target: Object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const metricName = `${target.constructor.name}.${propertyKey}`;
      performanceMonitor.startMetric(metricName);
      
      try {
        const result = originalMethod.apply(this, args);
        
        // Handle promise results
        if (result instanceof Promise) {
          return result.finally(() => {
            performanceMonitor.endMetric(metricName);
          });
        }
        
        performanceMonitor.endMetric(metricName);
        return result;
      } catch (error: any) {
        // Type assertion with any to safely access message property
        const errorMessage = error && typeof error === 'object' && 'message' in error 
          ? error.message 
          : String(error);
          
        performanceMonitor.endMetric(metricName, { error: errorMessage });
        throw error;
      }
    };
    
    return descriptor;
  };
}