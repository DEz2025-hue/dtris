import { Platform } from 'react-native';

export const config = {
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  appVersion: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  
  // Feature flags
  features: {
    enablePushNotifications: true,
    enableRealTimeUpdates: true,
    enableFileUploads: true,
    enablePayments: process.env.EXPO_PUBLIC_ENVIRONMENT !== 'development',
    enableAnalytics: process.env.EXPO_PUBLIC_ENVIRONMENT === 'production',
  },
  
  // Performance settings
  performance: {
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    maxRetries: 3,
    retryDelay: 1000,
    pageSize: 20,
  },
  
  // Platform-specific settings
  platform: {
    isWeb: Platform.OS === 'web',
    isMobile: Platform.OS !== 'web',
    isProduction: process.env.EXPO_PUBLIC_ENVIRONMENT === 'production',
    isDevelopment: process.env.EXPO_PUBLIC_ENVIRONMENT === 'development',
  },
};

export default config;