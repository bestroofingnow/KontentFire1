/**
 * Analytics utility for tracking user behavior and performance
 * This is a lightweight implementation that can be integrated with more robust services
 */

type EventCategory = 
  | 'page_view'
  | 'interaction'
  | 'content_operation'
  | 'authentication'
  | 'error'
  | 'performance'
  | 'subscription';

interface AnalyticsEvent {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

interface AnalyticsConfig {
  enabled: boolean;
  sampleRate: number; // 0.0 to 1.0
  userId?: string | null;
  debug: boolean;
}

class Analytics {
  private static instance: Analytics;
  private config: AnalyticsConfig = {
    enabled: true,
    sampleRate: 1.0,
    userId: null,
    debug: false
  };
  
  private queue: AnalyticsEvent[] = [];
  private flushInterval: number | null = null;
  private lastPageViewPath: string | null = null;
  
  constructor() {
    // Initialize flush interval
    this.flushInterval = window.setInterval(() => this.flush(), 30000) as unknown as number;
    
    // Add event listeners for page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }
    
    // Add event listener for before unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }
  
  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }
  
  /**
   * Configure the analytics service
   */
  public configure(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Set the user ID for analytics tracking
   */
  public setUserId(userId: string | null): void {
    this.config.userId = userId;
  }
  
  /**
   * Track a page view
   */
  public trackPageView(path: string, title?: string): void {
    // Avoid duplicate page views for the same path
    if (path === this.lastPageViewPath) {
      return;
    }
    
    this.lastPageViewPath = path;
    
    this.track({
      category: 'page_view',
      action: 'view',
      label: title || path,
      metadata: {
        path,
        title,
        referrer: document.referrer,
      }
    });
  }
  
  /**
   * Track a user interaction
   */
  public trackInteraction(action: string, label?: string, value?: number, metadata?: Record<string, any>): void {
    this.track({
      category: 'interaction',
      action,
      label,
      value,
      metadata
    });
  }
  
  /**
   * Track a content operation (create, update, delete, publish)
   */
  public trackContentOperation(action: string, contentType: string, contentId: string | number, metadata?: Record<string, any>): void {
    this.track({
      category: 'content_operation',
      action,
      label: contentType,
      metadata: {
        ...metadata,
        contentId
      }
    });
  }
  
  /**
   * Track an authentication event
   */
  public trackAuth(action: string, metadata?: Record<string, any>): void {
    this.track({
      category: 'authentication',
      action,
      metadata
    });
  }
  
  /**
   * Track an error
   */
  public trackError(action: string, message: string, metadata?: Record<string, any>): void {
    this.track({
      category: 'error',
      action,
      label: message,
      metadata
    });
  }
  
  /**
   * Track a performance event
   */
  public trackPerformance(action: string, duration: number, metadata?: Record<string, any>): void {
    this.track({
      category: 'performance',
      action,
      value: duration,
      metadata
    });
  }
  
  /**
   * Track a subscription event
   */
  public trackSubscription(action: string, plan: string, metadata?: Record<string, any>): void {
    this.track({
      category: 'subscription',
      action,
      label: plan,
      metadata
    });
  }
  
  /**
   * Generic track method for custom events
   */
  public track(event: AnalyticsEvent): void {
    // Skip if analytics is disabled
    if (!this.config.enabled) {
      return;
    }
    
    // Apply sampling rate
    if (Math.random() > this.config.sampleRate) {
      return;
    }
    
    // Add common metadata
    const enrichedEvent = {
      ...event,
      metadata: {
        ...event.metadata,
        timestamp: new Date().toISOString(),
        userId: this.config.userId,
        path: window.location.pathname,
        userAgent: navigator.userAgent,
      }
    };
    
    // Add to queue
    this.queue.push(enrichedEvent);
    
    // Log if debug mode is enabled
    if (this.config.debug) {
      console.log('[Analytics]', enrichedEvent);
    }
    
    // Flush if queue gets too big
    if (this.queue.length >= 20) {
      this.flush();
    }
  }
  
  /**
   * Send queued events to the analytics service
   */
  private flush(): void {
    if (!this.config.enabled || this.queue.length === 0) {
      return;
    }
    
    // Make a copy of the queue and clear it
    const events = [...this.queue];
    this.queue = [];
    
    // In a real implementation, this would send the data to an analytics service
    // For now, we'll just log it in debug mode
    if (this.config.debug) {
      console.log('[Analytics] Flushing events:', events);
    }
    
    // In a real implementation, we would send the data to an analytics service
    // For example:
    //
    // fetch('/api/analytics/events', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ events }),
    // }).catch(error => {
    //   console.error('[Analytics] Failed to send events:', error);
    //   // Add events back to the queue
    //   this.queue = [...events, ...this.queue];
    // });
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.flushInterval !== null) {
      window.clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    this.flush();
  }
}

// Create and export a singleton instance
export const analytics = Analytics.getInstance();

// Create a hook for easy use in React components
import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Hook for tracking page views
 * 
 * @example
 * function MyComponent() {
 *   usePageView();
 *   
 *   return <div>My Component</div>;
 * }
 */
export function usePageView(title?: string): void {
  const [location] = useLocation();
  
  useEffect(() => {
    analytics.trackPageView(location, title);
  }, [location, title]);
}