import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { config } from './config';
import { monitoring } from './monitoring';

// Analytics event types
export type AnalyticsEvent = 
  | 'app_opened'
  | 'user_login'
  | 'user_login_failed'
  | 'user_logout'
  | 'user_registered'
  | 'vehicle_registered'
  | 'vehicle_updated'
  | 'vehicle_deleted'
  | 'inspection_created'
  | 'inspection_completed'
  | 'inspection_failed'
  | 'violation_reported'
  | 'violation_resolved'
  | 'payment_initiated'
  | 'payment_completed'
  | 'report_generated'
  | 'document_uploaded'
  | 'notification_received'
  | 'search_performed'
  | 'filter_applied'
  | 'export_data'
  | 'screen_viewed'
  | 'error_occurred'
  | 'performance_metric'
  | 'business_metrics'
  | 'app_closed'
  | 'user_engagement'
  | 'feature_used'
  | 'conversion';

// Analytics properties interface
export interface AnalyticsProperties {
  [key: string]: string | number | boolean | null;
}

// Business metrics interface
export interface BusinessMetrics {
  totalUsers: number;
  activeUsers: number;
  totalVehicles: number;
  activeVehicles: number;
  totalInspections: number;
  passedInspections: number;
  failedInspections: number;
  totalViolations: number;
  resolvedViolations: number;
  revenue: number;
  complianceRate: number;
  passRate: number;
}

// Analytics event data
interface AnalyticsEventData {
  event: AnalyticsEvent;
  properties?: AnalyticsProperties;
  timestamp: string;
  sessionId: string;
  userId?: string;
  screen: string | null;
  platform: string;
  appVersion: string;
  deviceModel: string;
}

// Utility to sanitize analytics properties
function sanitizeProperties(obj?: AnalyticsProperties): AnalyticsProperties {
  if (!obj) return {};
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : v])
  );
}

class AnalyticsService {
  private isInitialized = false;
  private sessionStartTime: number;
  private currentScreen: string = '';
  private userProperties: Record<string, any> = {};
  private sessionId: string;
  private userId?: string;
  private events: AnalyticsEventData[] = [];
  private maxEventsInMemory = 100;

  constructor() {
    this.sessionStartTime = Date.now();
    this.sessionId = this.generateSessionId();
  }

  // Initialize analytics
  async init() {
    if (this.isInitialized) return;

    try {
      if (config.features.enableAnalytics) {
        // Set default user properties
        await this.setUserProperties({
          platform: Platform.OS,
          deviceModel: Device.modelName || 'Unknown',
          appVersion: Application.nativeApplicationVersion || '1.0.0',
          buildVersion: Application.nativeBuildVersion || '1',
          environment: config.environment,
        });

        this.isInitialized = true;
        console.log('Analytics initialized successfully');
        
        // Track app opened event
        await this.trackEvent('app_opened', {
          session_id: this.sessionId,
        });
      }
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      monitoring.logError(error as Error, { context: 'analytics_init' });
    }
  }

  // Track custom events
  async trackEvent(event: AnalyticsEvent, properties?: AnalyticsProperties) {
    if (!config.features.enableAnalytics) {
      console.log('Analytics event (disabled):', event, properties);
      return;
    }

    try {
      const eventData: AnalyticsEventData = {
        event,
        properties: {
          ...sanitizeProperties(properties),
          session_duration: Date.now() - this.sessionStartTime,
          current_screen: this.currentScreen || null,
          ...sanitizeProperties(this.userProperties),
        },
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        userId: this.userId,
        screen: this.currentScreen || null,
        platform: Platform.OS,
        appVersion: Application.nativeApplicationVersion || '1.0.0',
        deviceModel: Device.modelName || 'Unknown',
      };

      // Store event in memory
      this.events.push(eventData);
      
      // Keep only the latest events in memory
      if (this.events.length > this.maxEventsInMemory) {
        this.events = this.events.slice(-this.maxEventsInMemory);
      }

      // Log to console in development
      if (config.platform.isDevelopment) {
        console.log('Analytics event tracked:', event, eventData);
      }

      // Send to monitoring service
      monitoring.logEvent(event, eventData.properties);

      // In production, you would send this to your analytics service
      if (config.platform.isProduction) {
        await this.sendToAnalyticsService(eventData);
      }
    } catch (error) {
      console.error('Failed to track analytics event:', error);
      monitoring.logError(error as Error, { 
        context: 'analytics_track',
        event,
        properties 
      });
    }
  }

  // Send events to analytics service (implement based on your needs)
  private async sendToAnalyticsService(eventData: AnalyticsEventData) {
    try {
      // Example: Send to your own analytics endpoint
      // await fetch('https://your-analytics-api.com/events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(eventData),
      // });
      
      // For now, just log to console
      console.log('Analytics event sent to service:', eventData.event);
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  // Track screen views
  async trackScreenView(screenName: string, properties?: AnalyticsProperties) {
    this.currentScreen = screenName;
    await this.trackEvent('screen_viewed', {
      screen_name: typeof screenName === 'string' ? screenName : null,
      ...sanitizeProperties(properties),
    });
  }

  // Track user actions
  async trackUserAction(action: string, properties?: AnalyticsProperties) {
    await this.trackEvent(action as AnalyticsEvent, properties);
  }

  // Track business metrics
  async trackBusinessMetrics(metrics: BusinessMetrics) {
    await this.trackEvent('business_metrics', {
      total_users: metrics.totalUsers,
      active_users: metrics.activeUsers,
      total_vehicles: metrics.totalVehicles,
      active_vehicles: metrics.activeVehicles,
      total_inspections: metrics.totalInspections,
      passed_inspections: metrics.passedInspections,
      failed_inspections: metrics.failedInspections,
      total_violations: metrics.totalViolations,
      resolved_violations: metrics.resolvedViolations,
      revenue: metrics.revenue,
      compliance_rate: metrics.complianceRate,
      pass_rate: metrics.passRate,
    });
  }

  // Track performance metrics
  async trackPerformance(metric: string, value: number, tags?: Record<string, string>) {
    await this.trackEvent('performance_metric', {
      metric_name: metric,
      metric_value: value,
      metric_unit: 'ms',
      ...tags,
    });
  }

  // Track errors
  async trackError(error: Error, context?: Record<string, any>) {
    await this.trackEvent('error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      ...context,
    });
  }

  // Set user properties
  async setUserProperties(properties: Record<string, any>) {
    this.userProperties = { ...this.userProperties, ...properties };
  }

  // Set user ID
  setUserId(userId: string) {
    this.userId = userId;
  }

  // Track user session
  async trackSessionStart() {
    this.sessionStartTime = Date.now();
    this.sessionId = this.generateSessionId();
    await this.trackEvent('app_opened', {
      session_id: this.sessionId,
    });
  }

  // Track session end
  async trackSessionEnd() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    await this.trackEvent('app_closed', {
      session_duration: sessionDuration,
    });
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Track user engagement
  async trackEngagement(action: string, duration?: number) {
    await this.trackEvent('user_engagement', {
      action,
      duration: duration || 0,
      timestamp: new Date().toISOString(),
    });
  }

  // Track feature usage
  async trackFeatureUsage(feature: string, properties?: AnalyticsProperties) {
    await this.trackEvent('feature_used', {
      feature_name: feature,
      ...properties,
    });
  }

  // Track conversion events
  async trackConversion(conversionType: string, value?: number) {
    await this.trackEvent('conversion', {
      conversion_type: conversionType,
      conversion_value: value || 0,
    });
  }

  // Get analytics data for reporting
  getAnalyticsData() {
    return {
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.sessionStartTime,
      events: this.events,
      userProperties: this.userProperties,
      currentScreen: this.currentScreen,
    };
  }

  // Clear analytics data
  clearAnalyticsData() {
    this.events = [];
  }
}

// Create singleton instance
export const analyticsService = new AnalyticsService();

// Convenience functions for common tracking
export const analytics = {
  // Initialize analytics
  init: () => analyticsService.init(),

  // Track events
  track: (event: AnalyticsEvent, properties?: AnalyticsProperties) => 
    analyticsService.trackEvent(event, properties),

  // Track screen views
  screen: (screenName: string, properties?: AnalyticsProperties) => 
    analyticsService.trackScreenView(screenName, properties),

  // Track user actions
  action: (action: string, properties?: AnalyticsProperties) => 
    analyticsService.trackUserAction(action, properties),

  // Track business metrics
  metrics: (metrics: BusinessMetrics) => 
    analyticsService.trackBusinessMetrics(metrics),

  // Track performance
  performance: (metric: string, value: number, tags?: Record<string, string>) => 
    analyticsService.trackPerformance(metric, value, tags),

  // Track errors
  error: (error: Error, context?: Record<string, any>) => 
    analyticsService.trackError(error, context),

  // Set user properties
  setUser: (properties: Record<string, any>) => 
    analyticsService.setUserProperties(properties),

  // Set user ID
  setUserId: (userId: string) => analyticsService.setUserId(userId),

  // Track sessions
  sessionStart: () => analyticsService.trackSessionStart(),
  sessionEnd: () => analyticsService.trackSessionEnd(),

  // Track engagement
  engagement: (action: string, duration?: number) => 
    analyticsService.trackEngagement(action, duration),

  // Track feature usage
  feature: (feature: string, properties?: AnalyticsProperties) => 
    analyticsService.trackFeatureUsage(feature, properties),

  // Track conversions
  conversion: (type: string, value?: number) => 
    analyticsService.trackConversion(type, value),

  // Get analytics data
  getData: () => analyticsService.getAnalyticsData(),

  // Clear analytics data
  clear: () => analyticsService.clearAnalyticsData(),
};

// Hook for tracking screen views automatically
export const useAnalytics = () => {
  return {
    trackScreen: (screenName: string, properties?: AnalyticsProperties) => 
      analytics.screen(screenName, properties),
    trackEvent: (event: AnalyticsEvent, properties?: AnalyticsProperties) => 
      analytics.track(event, properties),
    trackAction: (action: string, properties?: AnalyticsProperties) => 
      analytics.action(action, properties),
  };
}; 