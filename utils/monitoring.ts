import { config } from './config';

// Error tracking and monitoring utilities
export const monitoring = {
  // Initialize monitoring services
  init() {
    if (config.platform.isProduction && config.sentryDsn) {
      // Initialize Sentry for error tracking
      console.log('Initializing Sentry for error tracking');
      // In a real implementation, you would initialize Sentry here
      // import * as Sentry from '@sentry/react-native';
      // Sentry.init({ dsn: config.sentryDsn });
    }

    if (config.features.enableAnalytics) {
      // Initialize analytics
      console.log('Initializing analytics');
      // In a real implementation, you would initialize your analytics service here
    }
  },

  // Log errors with context
  logError(error: Error, context?: Record<string, any>) {
    console.error('Application Error:', error, context);
    
    if (config.platform.isProduction) {
      // Send to error tracking service
      // Sentry.captureException(error, { extra: context });
    }
  },

  // Log performance metrics
  logPerformance(metric: string, value: number, tags?: Record<string, string>) {
    console.log(`Performance: ${metric} = ${value}ms`, tags);
    
    if (config.features.enableAnalytics) {
      // Send to analytics service
      // analytics.track('performance', { metric, value, ...tags });
    }
  },

  // Log user events
  logEvent(event: string, properties?: Record<string, any>) {
    console.log(`Event: ${event}`, properties);
    
    if (config.features.enableAnalytics) {
      // Send to analytics service
      // analytics.track(event, properties);
    }
  },

  // Log API calls for debugging
  logApiCall(method: string, url: string, duration: number, status: number) {
    console.log(`API: ${method} ${url} - ${status} (${duration}ms)`);
    
    if (config.platform.isDevelopment) {
      // Additional debug logging in development
      console.debug('API Call Details:', { method, url, duration, status });
    }
  },

  // Health check for monitoring services
  async healthCheck(): Promise<boolean> {
    try {
      // Check if monitoring services are responsive
      // This could ping your monitoring endpoints
      return true;
    } catch (error) {
      console.error('Monitoring health check failed:', error);
      return false;
    }
  },
};

// Performance measurement utility
export class PerformanceTimer {
  private startTime: number;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.startTime = Date.now();
  }

  end(tags?: Record<string, string>) {
    const duration = Date.now() - this.startTime;
    monitoring.logPerformance(this.name, duration, tags);
    return duration;
  }
}

// API call wrapper with monitoring
export async function monitoredFetch(url: string, options?: RequestInit): Promise<Response> {
  const timer = new PerformanceTimer('api_call');
  const method = options?.method || 'GET';
  
  try {
    const response = await fetch(url, options);
    timer.end({ method, status: response.status.toString() });
    monitoring.logApiCall(method, url, timer.end(), response.status);
    return response;
  } catch (error) {
    timer.end({ method, status: 'error' });
    monitoring.logError(error as Error, { url, method });
    throw error;
  }
}

// Error boundary helper
export function withErrorBoundary<T>(
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  return fn().catch((error) => {
    monitoring.logError(error, context);
    throw error;
  });
}