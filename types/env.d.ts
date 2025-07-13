declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      EXPO_PUBLIC_API_URL: string;
      EXPO_PUBLIC_ENVIRONMENT: 'development' | 'staging' | 'production';
      EXPO_PUBLIC_APP_VERSION: string;
      EXPO_PUBLIC_SENTRY_DSN?: string;
    }
  }
}

// Ensure this file is treated as a module
export {};