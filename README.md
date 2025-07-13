# ClaMax DTRIS - Digital Transportation Registration & Inspection System

A comprehensive digital platform for vehicle registration, inspection, and management for the Republic of Liberia's Ministry of Transport.

## 🚀 Features

- **Multi-role Authentication** (Vehicle Owners, Inspectors, Administrators)
- **Vehicle Registration & Management** with QR code generation
- **Digital Document Storage** with cloud file management
- **Barcode Scanning** for vehicle inspections
- **Real-time Notifications** for renewals and updates
- **Payment Processing** for registrations and fees
- **Incident Reporting** with photo documentation
- **Administrative Dashboard** with analytics
- **Mobile & Web Support** with responsive design and adaptive navigation (drawer/sidebar)

## 🛠 Tech Stack

- **Frontend**: React Native with Expo Router
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Real-time)
- **Payments**: RevenueCat (for local development)
- **Notifications**: Expo Notifications + Supabase Edge Functions
- **Testing**: Jest + React Native Testing Library
- **CI/CD**: GitHub Actions + Netlify

## 📱 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/clamax-dtris.git
   cd clamax-dtris
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Set up Supabase database and demo users**
   ```bash
   # Complete setup (recommended)
   npm run setup:supabase
   
   # Or just create demo users (if database is already set up)
   npm run setup:demo
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

### Navigation

The application uses adaptive navigation:
- **Web**: Permanent sidebar navigation for easy access to all features
- **Mobile**: Slide-out drawer navigation optimized for touch interaction
- **Role-based**: Navigation items are filtered based on user permissions

### Environment Configuration

Create environment files for different stages:

- `.env` - Development
- `.env.staging` - Staging environment  
- `.env.production` - Production environment

Required environment variables:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=your_api_url
EXPO_PUBLIC_ENVIRONMENT=development|staging|production
```

## 🧪 Demo Accounts

For testing different user roles, the following demo accounts are available:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **Vehicle Owner** | `john.doe@example.com` | `demo123` | Can register vehicles, view inspections, report incidents |
| **Inspector** | `inspector@dtris.gov.lr` | `demo123` | Can scan vehicles, conduct inspections, manage violations |
| **Administrator** | `admin@dtris.gov.lr` | `demo123` | Full system access, user management, system reports |

### Creating Demo Users

**Method 1: In-App (Development Only)**
1. Start the application in development mode
2. On the login screen, click "Create Test Users in Database"
3. Wait for the users to be created in your Supabase database

**Method 2: Node.js Script**
```bash
# Ensure your .env file has SUPABASE_SERVICE_ROLE_KEY set
node scripts/add-demo-users.js
```

**Note**: Demo user creation is only available in development environment for security.

## 🏗 Architecture

### Frontend Structure
```
app/
├── (tabs)/           # Main app screens
├── auth/            # Authentication screens
├── api/             # API routes
└── _layout.tsx      # Root layout

components/          # Reusable components
contexts/           # React contexts
utils/              # Utility functions
types/              # TypeScript types
```

### Backend (Supabase)
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Built-in auth with email/password
- **Storage**: File uploads for documents and photos
- **Real-time**: Live updates for inspections and incidents
- **Edge Functions**: Server-side notifications

## 🧪 Testing

Run the test suite:
```bash
npm run test           # Run tests once
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage
```

## 🚀 Deployment

### Web Deployment (Netlify)
```bash
npm run build:web
# Deploy dist/ folder to Netlify
```

### Mobile Deployment (EAS)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Build for production
eas build --platform all --profile production

# Submit to app stores
eas submit --platform all
```

## 💳 Payment Integration (RevenueCat)

For payment processing, RevenueCat integration requires local development:

1. **Export your project**
   ```bash
   npx expo export
   ```

2. **Set up local development**
   ```bash
   npx expo run:ios
   npx expo run:android
   ```

3. **Install RevenueCat SDK**
   ```bash
   npm install react-native-purchases
   ```

4. **Configure in app.json**
   ```json
   {
     "expo": {
       "plugins": [
         ["react-native-purchases", {
           "iosAppStoreConnectSharedSecret": "your_shared_secret"
         }]
       ]
     }
   }
   ```

See `utils/revenueCat.ts` for detailed integration instructions.

## 🔧 Development

### Code Quality
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Jest** for unit testing

### Performance Optimizations
- **Caching** with AsyncStorage
- **Pagination** for large data sets
- **Real-time subscriptions** with cleanup
- **Image optimization** and lazy loading

### Security Features
- **Row Level Security** in Supabase
- **Role-based access control**
- **File upload validation**
- **Input sanitization**

## 📊 Monitoring & Analytics

- **Error Tracking**: Sentry integration ready
- **Performance Monitoring**: Built-in metrics
- **User Analytics**: Privacy-focused tracking
- **Crash Reporting**: Automatic error collection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏛 Government Partnership

Developed in partnership with the Republic of Liberia's Ministry of Transport to modernize vehicle registration and inspection processes.

## 📞 Support

For technical support or questions:
- Email: support@dtris.gov.lr
- Documentation: [docs.dtris.gov.lr](https://docs.dtris.gov.lr)
- Issues: [GitHub Issues](https://github.com/your-org/clamax-dtris/issues)

---

**ClaMax DTRIS** - Modernizing transportation management for Liberia 🇱🇷