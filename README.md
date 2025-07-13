# DTRIS - Digital Transportation Registration and Inspection System

A comprehensive digital platform for managing vehicle registration, inspections, and traffic violations in Liberia.

## 🚀 Features

### **User Management**
- Role-based access (Admin, Inspector, Owner)
- User registration and authentication
- Profile management with status tracking

### **Vehicle Management**
- Vehicle registration and documentation
- License plate tracking
- Document upload and management
- Barcode/QR code generation

### **Inspection System**
- Digital inspection forms
- Pass/fail status tracking
- Violation recording
- Inspection history

### **Violation Management**
- Traffic violation reporting
- Severity classification
- Status tracking (reported, investigating, resolved)
- Location-based reporting

### **Reports & Analytics**
- Comprehensive reporting system
- Statistical dashboards
- Export functionality

### **Real-time Updates**
- Live data synchronization
- Push notifications
- Real-time status updates

## 🛠️ Tech Stack

- **Frontend**: React Native + Expo
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (Web) + EAS Build (Mobile)

## 📱 Platforms

- **Web App**: Deployed on Vercel
- **Mobile App**: Android APK + iOS (coming soon)
- **Responsive Design**: Works on all devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/dtris.git
   cd dtris
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Add your Supabase credentials
   ```

4. **Set up database**
   ```bash
   npm run setup:supabase
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🏗️ Building

### Web App
```bash
npm run build:web
```

### Android APK
```bash
npx eas build --platform android --profile development
```

## 🌐 Deployment

### Web Deployment (Vercel)
```bash
node deploy-vercel.js
```

### Mobile Deployment
```bash
npx eas build --platform android --profile production
```

## 📊 Database Schema

The system uses PostgreSQL with the following main tables:
- `users` - User profiles and authentication
- `vehicles` - Vehicle registration data
- `inspections` - Inspection records
- `incidents` - Traffic violations and incidents
- `announcements` - System announcements
- `payments` - Payment records

## 🔐 Security

- Row Level Security (RLS) policies
- Role-based access control
- Secure API endpoints
- Environment variable protection

## 📈 Roadmap

- [ ] iOS app deployment
- [ ] Advanced analytics dashboard
- [ ] Payment integration
- [ ] Offline mode support
- [ ] Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, email support@dtris.gov.lr or create an issue in this repository.

---

**Built with ❤️ for Liberia's transportation sector**