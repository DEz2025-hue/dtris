import { Drawer } from 'expo-router/drawer';
import { Platform } from 'react-native';
import { useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { Chrome as Home, Car, Scan, FileText, Users, Settings, ChartBar as BarChart3, Camera, Bell, TriangleAlert } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { CustomDrawerContent } from '@/components/CustomDrawerContent';

interface DrawerScreen {
  name: string;
  title: string;
  icon: any;
  roles: UserRole[];
}

export default function DrawerLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const currentSegment = segments[1]; // Get the current route segment after (tabs)

  const allDrawerScreens: DrawerScreen[] = [
    {
      name: 'index',
      title: 'Dashboard',
      icon: Home,
      roles: ['owner', 'inspector', 'admin'],
    },
    {
      name: 'vehicles',
      title: 'Vehicles',
      icon: Car,
      roles: ['owner', 'admin'],
    },
    {
      name: 'scanner',
      title: 'Scanner',
      icon: Scan,
      roles: ['inspector'], // ONLY inspectors should see this
    },
    {
      name: 'inspections',
      title: 'Inspections',
      icon: FileText,
      roles: ['owner', 'inspector', 'admin'],
    },
    {
      name: 'violations',
      title: 'Violations',
      icon: TriangleAlert,
      roles: ['inspector', 'admin'],
    },
    {
      name: 'documents',
      title: 'Documents',
      icon: FileText,
      roles: ['owner'], // ONLY owners should see this
    },
    {
      name: 'reports',
      title: 'Reports',
      icon: BarChart3,
      roles: ['owner', 'admin'],
    },
    {
      name: 'users',
      title: 'Users',
      icon: Users,
      roles: ['admin'], // ONLY admins should see this
    },
    {
      name: 'announcements',
      title: 'Announcements',
      icon: Bell,
      roles: ['owner', 'inspector', 'admin'],
    },
  ];

  // Role-based access control
  useEffect(() => {
    if (isLoading) return;

    // If user is not logged in and not on login/root page, redirect to login
    if (!user && currentSegment && currentSegment !== 'login' && segments[0] !== '') {
      router.replace('/login');
      return;
    }

    // If user is logged in, check if they have access to the current route
    if (user && currentSegment) {
      const screenDefinition = allDrawerScreens.find(screen => screen.name === currentSegment);
      
      if (screenDefinition && !screenDefinition.roles.includes(user.role)) {
        // User doesn't have access to this route, redirect to dashboard
        router.replace('/(tabs)');
      }
    }
  }, [user, isLoading, currentSegment, segments]);

  // Filter screens based on user role with strict checking
  const visibleDrawerScreens = user && user.role 
    ? allDrawerScreens.filter(screen => {
        const hasAccess = screen.roles.includes(user.role);
        return hasAccess;
      })
    : [];

  // Role-based navigation is now working correctly

  if (isLoading) {
    return null; // Or a loading component
  }

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: Platform.OS !== 'web',
        drawerActiveTintColor: '#1E40AF',
        drawerInactiveTintColor: '#6B7280',
        drawerStyle: {
          backgroundColor: '#FFFFFF',
          width: Platform.OS === 'web' ? 280 : '80%',
          borderRightWidth: Platform.OS === 'web' ? 1 : 0,
          borderRightColor: '#E5E7EB',
        },
        drawerType: Platform.OS === 'web' ? 'permanent' : 'slide',
        headerStyle: {
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontFamily: 'Inter-SemiBold',
          color: '#1F2937',
        },
        headerTintColor: '#1E40AF',
      }}
    >
      {visibleDrawerScreens.map((screen) => (
        <Drawer.Screen
          key={screen.name}
          name={screen.name}
          options={{
            drawerLabel: screen.title,
            title: screen.title,
            drawerIcon: ({ size, color }) => (
              <screen.icon size={size} color={color} />
            ),
          }}
        />
      ))}
    </Drawer>
  );
}