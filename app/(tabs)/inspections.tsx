import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Inspection, Vehicle } from '@/types';
import { supabaseService } from '@/utils/supabaseService';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { CircleCheck as CheckCircle, Circle as XCircle, TriangleAlert as AlertTriangle, Calendar, MapPin, Search, Filter, Car, User } from 'lucide-react-native';

export default function InspectionsScreen() {
  const { user } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pass' | 'fail' | 'conditional'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [allInspections, allVehicles] = await Promise.all([
        supabaseService.getInspections(),
        supabaseService.getVehicles()
      ]);

      setInspections(allInspections);
      setVehicles(allVehicles);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load inspections. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle size={20} color="#10B981" />;
      case 'fail':
        return <XCircle size={20} color="#EF4444" />;
      case 'conditional':
        return <AlertTriangle size={20} color="#F59E0B" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return '#10B981';
      case 'fail':
        return '#EF4444';
      case 'conditional':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const filteredInspections = inspections.filter(inspection => {
    const vehicle = vehicles.find(v => v.id === inspection.vehicleId);
    const matchesSearch = !searchQuery || 
      vehicle?.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inspection.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inspection.inspectorName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || inspection.status === filterStatus;
    
    // Filter by user role
    if (user?.role === 'owner') {
      const userVehicles = vehicles.filter(v => v.ownerId === user.id);
      return matchesSearch && matchesFilter && userVehicles.some(v => v.id === inspection.vehicleId);
    }
    
    return matchesSearch && matchesFilter;
  });

  const getInspectionStats = () => {
    const relevantInspections = user?.role === 'owner' 
      ? inspections.filter(i => {
          const vehicle = vehicles.find(v => v.id === i.vehicleId);
          return vehicle?.ownerId === user.id;
        })
      : inspections;

    const total = relevantInspections.length;
    const passed = relevantInspections.filter(i => i.status === 'pass').length;
    const failed = relevantInspections.filter(i => i.status === 'fail').length;
    const conditional = relevantInspections.filter(i => i.status === 'conditional').length;
    
    return { total, passed, failed, conditional };
  };

  const stats = getInspectionStats();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Inspections</Text>
            <Text style={styles.subtitle}>
              {user?.role === 'owner' 
                ? 'Your vehicle inspection history and results'
                : 'Vehicle inspection history and results'
              }
            </Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E40AF" />
            <Text style={styles.loadingText}>Loading inspections...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Inspections</Text>
          <Text style={styles.subtitle}>
            {user?.role === 'owner' 
              ? 'Your vehicle inspection history and results'
              : 'Vehicle inspection history and results'
            }
          </Text>
          <ErrorDisplay error={error} onDismiss={() => setError(null)} />
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            
            <View style={[styles.statCard, styles.passCard]}>
              <CheckCircle size={20} color="#10B981" />
              <Text style={styles.statNumber}>{stats.passed}</Text>
              <Text style={styles.statLabel}>Passed</Text>
            </View>
            
            <View style={[styles.statCard, styles.failCard]}>
              <XCircle size={20} color="#EF4444" />
              <Text style={styles.statNumber}>{stats.failed}</Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
            
            <View style={[styles.statCard, styles.conditionalCard]}>
              <AlertTriangle size={20} color="#F59E0B" />
              <Text style={styles.statNumber}>{stats.conditional}</Text>
              <Text style={styles.statLabel}>Conditional</Text>
            </View>
          </View>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by license plate, location, or inspector..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterButtons}>
              {[
                { key: 'all', label: 'All' },
                { key: 'pass', label: 'Passed' },
                { key: 'fail', label: 'Failed' },
                { key: 'conditional', label: 'Conditional' },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterButton,
                    filterStatus === filter.key && styles.activeFilterButton
                  ]}
                  onPress={() => setFilterStatus(filter.key as any)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    filterStatus === filter.key && styles.activeFilterButtonText
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Inspections List */}
        <ScrollView 
          style={styles.inspectionsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredInspections.length > 0 ? (
            filteredInspections.map((inspection) => {
              const vehicle = vehicles.find(v => v.id === inspection.vehicleId);
              
              return (
                <View key={inspection.id} style={styles.inspectionCard}>
                  <View style={styles.inspectionHeader}>
                    <View style={styles.vehicleInfo}>
                      <View style={styles.vehiclePlateRow}>
                        <Car size={16} color="#6B7280" />
                        <Text style={styles.vehiclePlate}>
                          {vehicle?.licensePlate || 'Unknown Vehicle'}
                        </Text>
                      </View>
                      {vehicle && (
                        <Text style={styles.vehicleDetails}>
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </Text>
                      )}
                    </View>
                    
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(inspection.status) }
                    ]}>
                      {getStatusIcon(inspection.status)}
                      <Text style={styles.statusText}>
                        {inspection.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.inspectionDetails}>
                    <View style={styles.detailRow}>
                      <Calendar size={16} color="#6B7280" />
                      <Text style={styles.detailText}>
                        {inspection.date.toLocaleDateString()} at {inspection.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <MapPin size={16} color="#6B7280" />
                      <Text style={styles.detailText}>{inspection.location}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <User size={16} color="#6B7280" />
                      <Text style={styles.detailText}>Inspector: {inspection.inspectorName}</Text>
                    </View>
                  </View>

                  {inspection.notes && (
                    <View style={styles.notesSection}>
                      <Text style={styles.notesLabel}>Notes:</Text>
                      <Text style={styles.notesText}>{inspection.notes}</Text>
                    </View>
                  )}

                  {inspection.violations && inspection.violations.length > 0 && (
                    <View style={styles.violationsSection}>
                      <Text style={styles.violationsLabel}>Violations:</Text>
                      {inspection.violations.map((violation, index) => (
                        <View key={index} style={styles.violationItem}>
                          <View style={styles.violationDot} />
                          <Text style={styles.violationText}>{violation}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {inspection.nextInspectionDue && (
                    <View style={styles.nextInspectionSection}>
                      <Text style={styles.nextInspectionLabel}>
                        Next inspection due: {inspection.nextInspectionDue.toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <CheckCircle size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No inspections found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : user?.role === 'owner'
                  ? 'No vehicle inspections have been recorded for your vehicles yet'
                  : 'No vehicle inspections have been recorded yet'
                }
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
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
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  passCard: {
    backgroundColor: '#F0FDF4',
  },
  failCard: {
    backgroundColor: '#FEF2F2',
  },
  conditionalCard: {
    backgroundColor: '#FFFBEB',
  },
  statNumber: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 2,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilterButton: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  inspectionsList: {
    flex: 1,
  },
  inspectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inspectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vehicleInfo: {
    flex: 1,
    marginRight: 12,
  },
  vehiclePlateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  vehiclePlate: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  vehicleDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  inspectionDetails: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  notesSection: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  notesLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
  },
  violationsSection: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  violationsLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#DC2626',
    marginBottom: 8,
  },
  violationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  violationDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DC2626',
    marginTop: 8,
  },
  violationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#DC2626',
    lineHeight: 20,
  },
  nextInspectionSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextInspectionLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#059669',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
});