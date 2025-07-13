# ClaMax DTRIS Deployment Guide

This guide covers the complete deployment process for the ClaMax DTRIS system, from development to production.

## Prerequisites

- Node.js 18+
- Expo CLI
- Supabase account
- GitHub account (for CI/CD)
- Netlify account (for web deployment)
- EAS account (for mobile deployment)

## Environment Setup

### 1. Supabase Configuration

1. **Create Supabase Project**:
   ```bash
   # Go to https://supabase.com/dashboard
   # Create new project
   # Note down your project URL and anon key
   ```

2. **Run Database Migrations**:
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Link to your project
   supabase link --project-ref YOUR_PROJECT_REF
   
   # Run migrations
   supabase db push
   ```

3. **Set up Storage Buckets**:
   ```sql
   -- Run in Supabase SQL Editor
   INSERT INTO storage.buckets (id, name, public) VALUES 
   ('vehicle-documents', 'vehicle-documents', false),
   ('incident-photos', 'incident-photos', false),
   ('profile-images', 'profile-images', false);
   ```

### 2. Environment Variables

Create environment files for each stage:

**.env.development**:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_APP_VERSION=1.0.0
```

**.env.staging**:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
EXPO_PUBLIC_API_URL=https://staging-api.dtris.gov.lr
EXPO_PUBLIC_ENVIRONMENT=staging
EXPO_PUBLIC_APP_VERSION=1.0.0
```

**.env.production**:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
EXPO_PUBLIC_API_URL=https://api.dtris.gov.lr
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

## Deployment Stages

### 1. Development

```bash
# Install dependencies
npm install

# Set up demo data
node scripts/setup-demo-data.js

# Start development server
npm run dev
```

### 2. Staging Deployment

#### Web (Netlify)

1. **Connect GitHub Repository**:
   - Go to Netlify Dashboard
   - Connect your GitHub repository
   - Set build command: `npm run build:web`
   - Set publish directory: `dist`

2. **Configure Environment Variables**:
   ```bash
   # In Netlify dashboard, add environment variables from .env.staging
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   # etc.
   ```

3. **Deploy**:
   ```bash
   # Push to staging branch triggers automatic deployment
   git push origin staging
   ```

#### Mobile (EAS)

1. **Configure EAS**:
   ```bash
   # Install EAS CLI
   npm install -g @expo/eas-cli

   # Login to EAS
   eas login

   # Configure project
   eas build:configure
   ```

2. **Build for Staging**:
   ```bash
   # Build for internal testing
   eas build --platform all --profile preview
   ```

3. **Submit to Internal Testing**:
   ```bash
   # Submit to TestFlight (iOS) and Internal Testing (Android)
   eas submit --platform all --profile preview
   ```

### 3. Production Deployment

#### Web (Netlify)

1. **Production Build**:
   ```bash
   # Merge to main branch
   git checkout main
   git merge staging
   git push origin main
   ```

2. **Custom Domain**:
   - Configure custom domain in Netlify
   - Set up SSL certificate
   - Configure DNS records

#### Mobile (App Stores)

1. **Production Build**:
   ```bash
   # Build production version
   eas build --platform all --profile production
   ```

2. **Submit to App Stores**:
   ```bash
   # Submit to App Store and Google Play
   eas submit --platform all --profile production
   ```

## CI/CD Pipeline

The GitHub Actions workflow automatically:

1. **On Pull Request**:
   - Runs tests
   - Builds the application
   - Runs security checks

2. **On Merge to Staging**:
   - Deploys to staging environment
   - Runs integration tests
   - Notifies team

3. **On Merge to Main**:
   - Deploys to production
   - Creates release notes
   - Monitors deployment

## Monitoring and Maintenance

### 1. Error Tracking

```bash
# Set up Sentry
npm install @sentry/react-native

# Configure in app
import * as Sentry from '@sentry/react-native';
Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN });
```

### 2. Performance Monitoring

- Monitor API response times
- Track user engagement
- Monitor crash rates
- Set up alerts for critical issues

### 3. Database Maintenance

```sql
-- Regular maintenance tasks
VACUUM ANALYZE;
REINDEX DATABASE your_database;

-- Monitor table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 4. Backup Strategy

1. **Database Backups**:
   - Supabase provides automatic backups
   - Set up additional backup schedule if needed

2. **File Storage Backups**:
   - Configure Supabase Storage backup
   - Consider cross-region replication

## Security Checklist

- [ ] Environment variables secured
- [ ] Row Level Security policies implemented
- [ ] API endpoints authenticated
- [ ] File upload validation in place
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Regular security audits scheduled

## Performance Optimization

1. **Database**:
   - Indexes on frequently queried columns
   - Connection pooling configured
   - Query optimization

2. **Frontend**:
   - Code splitting implemented
   - Images optimized
   - Caching strategy in place

3. **API**:
   - Rate limiting configured
   - Response compression enabled
   - CDN for static assets

## Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Clear cache and reinstall
   npm run clean
   npm install
   ```

2. **Environment Variable Issues**:
   ```bash
   # Verify environment variables
   node scripts/test-env.js
   ```

3. **Database Connection Issues**:
   ```bash
   # Test Supabase connection
   npx supabase status
   ```

### Support Contacts

- **Technical Issues**: tech-support@dtris.gov.lr
- **Deployment Issues**: devops@dtris.gov.lr
- **Security Issues**: security@dtris.gov.lr

## Rollback Procedures

### Web Application

1. **Immediate Rollback**:
   ```bash
   # Revert to previous deployment in Netlify dashboard
   # Or deploy previous commit
   git revert HEAD
   git push origin main
   ```

### Mobile Application

1. **Emergency Rollback**:
   - Use app store rollback features
   - Deploy hotfix build if needed

### Database

1. **Schema Rollback**:
   ```bash
   # Use Supabase migration rollback
   supabase db reset
   ```

2. **Data Rollback**:
   - Restore from backup
   - Apply data fixes manually

This deployment guide ensures a smooth transition from development to production while maintaining security, performance, and reliability standards.