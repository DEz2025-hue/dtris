import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseService } from '@/utils/supabaseService';
import { notificationService } from '@/utils/notifications';
import { Vehicle, Inspection, Announcement } from '@/types';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Car, Calendar, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Circle as XCircle, Bell, ChartBar as BarChart3, Users, LogOut } from 'lucide-react-native';
import { router } from 'expo-router';
import { analytics } from '@/utils/analytics';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    initializeNotifications();
    setupRealtimeSubscriptions();
    analytics.screen('Dashboard');
    
    return () => {
      // Cleanup subscriptions on unmount
      supabaseService.subscribeToVehicles(() => {}).unsubscribe();
      supabaseService.subscribeToInspections(() => {}).unsubscribe();
      supabaseService.subscribeToAnnouncements(() => {}).unsubscribe();
    };
  }, []);

  const setupRealtimeSubscriptions = () => {
    // Subscribe to real-time updates
    supabaseService.subscribeToVehicles((payload) => {
      console.log('Vehicle update:', payload);
      loadData(); // Refresh data when changes occur
    });

    supabaseService.subscribeToInspections((payload) => {
      console.log('Inspection update:', payload);
      loadData();
    });

    supabaseService.subscribeToAnnouncements((payload) => {
      console.log('Announcement update:', payload);
      loadData();
    });
  };
  const loadData = async () => {
    try {
      setError(null);
      
      const allVehicles = await supabaseService.getVehicles();
      const allInspections = await supabaseService.getInspections();
      const allAnnouncements = await supabaseService.getAnnouncements();
      
      setVehicles(allVehicles.data);
      setInspections(allInspections);
      setAnnouncements(allAnnouncements);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeNotifications = async () => {
    try {
      await notificationService.requestPermissions();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderOwnerDashboard = () => {
    const userVehicles = vehicles.filter(v => v.ownerId === user?.id);
    const activeVehicles = userVehicles.filter(v => v.status === 'active');
    const expiredVehicles = userVehicles.filter(v => v.status === 'expired');
    const recentInspections = inspections.filter(i => 
      userVehicles.some(v => v.id === i.vehicleId)
    ).slice(0, 3);

    return (
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <ErrorDisplay error={error} onDismiss={() => setError(null)} />
        
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.primaryStat]}>
            <Car size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{activeVehicles.length}</Text>
            <Text style={styles.statLabel}>Active Vehicles</Text>
          </View>
          
          <View style={[styles.statCard, styles.warningStat]}>
            <AlertTriangle size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{expiredVehicles.length}</Text>
            <Text style={styles.statLabel}>Expired</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Inspections</Text>
          {recentInspections.length > 0 ? (
            recentInspections.map((inspection) => (
              <View key={inspection.id} style={styles.inspectionCard}>
                <View style={styles.inspectionHeader}>
                  <Text style={styles.inspectionVehicle}>
                    {vehicles.find(v => v.id === inspection.vehicleId)?.licensePlate}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    inspection.status === 'pass' ? styles.passBadge : styles.failBadge
                  ]}>
                    {inspection.status === 'pass' ? (
                      <CheckCircle size={16} color="#FFFFFF" />
                    ) : (
                      <XCircle size={16} color="#FFFFFF" />
                    )}
                    <Text style={styles.statusText}>{inspection.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.inspectionDate}>
                  {inspection.date.toLocaleDateString()}
                </Text>
                <Text style={styles.inspectionNotes}>{inspection.notes}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No recent inspections</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Announcements</Text>
          {announcements.filter(a => !a.targetRole || a.targetRole === 'owner').slice(0, 2).map((announcement) => (
            <View key={announcement.id} style={styles.announcementCard}>
              <View style={styles.announcementHeader}>
                <Bell size={16} color="#F59E0B" />
                <Text style={styles.announcementTitle}>{announcement.title}</Text>
              </View>
              <Text style={styles.announcementContent}>{announcement.content}</Text>
              <Text style={styles.announcementDate}>
                {announcement.date.toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderInspectorDashboard = () => {
    const todayInspections = inspections.filter(i => 
      i.date.toDateString() === new Date().toDateString()
    );
    const passedInspections = inspections.filter(i => i.status === 'pass');
    const failedInspections = inspections.filter(i => i.status === 'fail');

    return (
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <ErrorDisplay error={error} onDismiss={() => setError(null)} />
        
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.userName}>Inspector {user?.name}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.primaryStat]}>
            <Calendar size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{todayInspections.length}</Text>
            <Text style={styles.statLabel}>Today's Inspections</Text>
          </View>
          
          <View style={[styles.statCard, styles.successStat]}>
            <CheckCircle size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{passedInspections.length}</Text>
            <Text style={styles.statLabel}>Passed</Text>
          </View>
          
          <View style={[styles.statCard, styles.errorStat]}>
            <XCircle size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{failedInspections.length}</Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.quickAction}>
          <View style={styles.quickActionContent}>
            <View style={styles.quickActionIcon}>
              <Car size={24} color="#1E40AF" />
            </View>
            <View style={styles.quickActionText}>
              <Text style={styles.quickActionTitle}>Start Vehicle Inspection</Text>
              <Text style={styles.quickActionSubtitle}>Scan vehicle barcode to begin</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Inspections</Text>
          {inspections.slice(0, 5).map((inspection) => (
            <View key={inspection.id} style={styles.inspectionCard}>
              <View style={styles.inspectionHeader}>
                <Text style={styles.inspectionVehicle}>
                  {vehicles.find(v => v.id === inspection.vehicleId)?.licensePlate}
                </Text>
                <View style={[
                  styles.statusBadge,
                  inspection.status === 'pass' ? styles.passBadge : styles.failBadge
                ]}>
                  {inspection.status === 'pass' ? (
                    <CheckCircle size={16} color="#FFFFFF" />
                  ) : (
                    <XCircle size={16} color="#FFFFFF" />
                  )}
                  <Text style={styles.statusText}>{inspection.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.inspectionDate}>
                {inspection.date.toLocaleDateString()} • {inspection.location}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderAdminDashboard = () => {
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.status === 'active').length;
    const expiredVehicles = vehicles.filter(v => v.status === 'expired').length;
    const totalInspections = inspections.length;

    return (
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <ErrorDisplay error={error} onDismiss={() => setError(null)} />
        
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Admin Dashboard</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.primaryStat]}>
            <Car size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{totalVehicles}</Text>
            <Text style={styles.statLabel}>Total Vehicles</Text>
          </View>
          
          <View style={[styles.statCard, styles.successStat]}>
            <CheckCircle size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{activeVehicles}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          
          <View style={[styles.statCard, styles.warningStat]}>
            <AlertTriangle size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{expiredVehicles}</Text>
            <Text style={styles.statLabel}>Expired</Text>
          </View>
          
          <View style={[styles.statCard, styles.infoBadge]}>
            <BarChart3 size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{totalInspections}</Text>
            <Text style={styles.statLabel}>Inspections</Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionContent}>
              <View style={styles.quickActionIcon}>
                <Users size={24} color="#1E40AF" />
              </View>
              <View style={styles.quickActionText}>
                <Text style={styles.quickActionTitle}>Manage Users</Text>
                <Text style={styles.quickActionSubtitle}>View and manage system users</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionContent}>
              <View style={styles.quickActionIcon}>
                <BarChart3 size={24} color="#1E40AF" />
              </View>
              <View style={styles.quickActionText}>
                <Text style={styles.quickActionTitle}>Generate Reports</Text>
                <Text style={styles.quickActionSubtitle}>Export system analytics</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewTitle}>Compliance Rate</Text>
            <Text style={styles.overviewValue}>
              {totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0}%
            </Text>
            <Text style={styles.overviewSubtitle}>
              {activeVehicles} of {totalVehicles} vehicles compliant
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderDashboard = () => {
    switch (user?.role) {
      case 'owner':
        return renderOwnerDashboard();
      case 'inspector':
        return renderInspectorDashboard();
      case 'admin':
        return renderAdminDashboard();
      default:
        return (
          <View style={styles.container}>
            <Text style={styles.sectionTitle}>Welcome</Text>
            <Text>Role: {user?.role || 'Unknown'}</Text>
            <Text>Please contact support if you see this message.</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderDashboard()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  logoutButton: {
    padding: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryStat: {
    backgroundColor: '#1E40AF',
  },
  successStat: {
    backgroundColor: '#10B981',
  },
  warningStat: {
    backgroundColor: '#F59E0B',
  },
  errorStat: {
    backgroundColor: '#EF4444',
  },
  infoBadge: {
    backgroundColor: '#6366F1',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
  },
  quickActions: {
    gap: 12,
    marginBottom: 24,
  },
  quickAction: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#EBF4FF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  quickActionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  inspectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inspectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inspectionVehicle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  passBadge: {
    backgroundColor: '#10B981',
  },
  failBadge: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  inspectionDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  inspectionNotes: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  announcementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    flex: 1,
  },
  announcementContent: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginBottom: 8,
  },
  announcementDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  overviewTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 8,
  },
  overviewValue: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  overviewSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
});