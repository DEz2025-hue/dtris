import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react-native';
import { router } from 'expo-router';
import { UserRole } from '@/types';

interface CustomDrawerContentProps {
  state: any;
  navigation: any;
  descriptors: any;
}

export function CustomDrawerContent({ state, navigation, descriptors }: CustomDrawerContentProps) {
  const { user, logout } = useAuth();

  // Define role-based screen access
  const allDrawerScreens = [
    { name: 'index', title: 'Dashboard', roles: ['owner', 'inspector', 'admin'] },
    { name: 'vehicles', title: 'Vehicles', roles: ['owner', 'admin'] },
    { name: 'scanner', title: 'Scanner', roles: ['inspector'] },
    { name: 'inspections', title: 'Inspections', roles: ['owner', 'inspector', 'admin'] },
    { name: 'violations', title: 'Violations', roles: ['inspector', 'admin'] },
    { name: 'documents', title: 'Documents', roles: ['owner'] },
    { name: 'reports', title: 'Reports', roles: ['owner', 'admin'] },
    { name: 'users', title: 'Users', roles: ['admin'] },
    { name: 'announcements', title: 'Announcements', roles: ['owner', 'inspector', 'admin'] },
  ];

  // Filter routes based on user role
  const visibleRoutes = user && user.role 
    ? state.routes.filter(route => {
        const screenDefinition = allDrawerScreens.find(screen => screen.name === route.name);
        return screenDefinition ? screenDefinition.roles.includes(user.role) : false;
      })
    : [];

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView style={styles.scrollView}>
        {/* User Profile Section */}
        <View style={styles.userSection}>
          <View style={styles.userAvatar}>
            <User size={32} color="#1E40AF" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userRole}>{user?.role?.toUpperCase() || 'USER'}</Text>
          </View>
        </View>

        {/* Navigation Items */}
        <View style={styles.navigationSection}>
          {visibleRoutes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const label = options.drawerLabel || route.name;
            const Icon = options.drawerIcon?.({ size: 24, color: state.index === index ? '#1E40AF' : '#6B7280' }) || null;
            const isFocused = state.index === index;

            return (
              <TouchableOpacity
                key={route.key}
                style={[
                  styles.drawerItem,
                  isFocused && styles.drawerItemActive
                ]}
                onPress={() => navigation.navigate(route.name)}
              >
                <View style={styles.drawerItemContent}>
                  {Icon}
                  <Text style={[
                    styles.drawerItemText,
                    isFocused && styles.drawerItemTextActive
                  ]}>
                    {label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </DrawerContentScrollView>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  userSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    gap: 4,
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  userRole: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  navigationSection: {
    paddingHorizontal: 16,
  },
  drawerItem: {
    marginVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  drawerItemActive: {
    backgroundColor: '#EBF4FF',
  },
  drawerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 16, // Proper spacing between icon and text
  },
  drawerItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    flex: 1, // Take remaining space
  },
  drawerItemTextActive: {
    color: '#1E40AF',
    fontFamily: 'Inter-SemiBold',
  },
  logoutSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#EF4444',
  },
}); 