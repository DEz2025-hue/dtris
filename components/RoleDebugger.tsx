import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export function RoleDebugger() {
  const { user } = useAuth();

  if (!user) return null;

  const allScreens = [
    { name: 'Dashboard', roles: ['owner', 'inspector', 'admin'] },
    { name: 'Vehicles', roles: ['owner', 'admin'] },
    { name: 'Scanner', roles: ['inspector'] },
    { name: 'Inspections', roles: ['owner', 'inspector', 'admin'] },
    { name: 'Violations', roles: ['inspector', 'admin'] },
    { name: 'Documents', roles: ['owner'] },
    { name: 'Reports', roles: ['owner', 'admin'] },
    { name: 'Users', roles: ['admin'] },
    { name: 'Announcements', roles: ['owner', 'inspector', 'admin'] },
  ];

  const visibleScreens = allScreens.filter(screen => 
    screen.roles.includes(user.role)
  );

  const expectedScreensForRole = {
    admin: ['Dashboard', 'Vehicles', 'Inspections', 'Violations', 'Reports', 'Users', 'Announcements'],
    inspector: ['Dashboard', 'Scanner', 'Inspections', 'Violations', 'Announcements'],
    owner: ['Dashboard', 'Vehicles', 'Inspections', 'Documents', 'Reports', 'Announcements'],
  };

  const expectedScreens = expectedScreensForRole[user.role as keyof typeof expectedScreensForRole] || [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Role Debugger</Text>
      <Text style={styles.info}>User: {user.name}</Text>
      <Text style={styles.info}>Email: {user.email}</Text>
      <Text style={styles.info}>Role: {user.role}</Text>
      <Text style={styles.info}>Visible Screens: {visibleScreens.length}</Text>
      <Text style={styles.screens}>
        Current: {visibleScreens.map(screen => screen.name).join(', ')}
      </Text>
      <Text style={styles.screens}>
        Expected: {expectedScreens.join(', ')}
      </Text>
      <Text style={styles.status}>
        Status: {visibleScreens.length === expectedScreens.length ? '✅ Correct' : '❌ Incorrect'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#92400E',
    marginBottom: 8,
  },
  info: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#92400E',
    marginBottom: 4,
  },
  screens: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#92400E',
    marginTop: 4,
  },
  status: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#92400E',
    marginTop: 8,
  },
}); 