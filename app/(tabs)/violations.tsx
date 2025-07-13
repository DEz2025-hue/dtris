import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Incident, Vehicle } from '@/types';
import { supabaseService } from '@/utils/supabaseService';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { TriangleAlert as AlertTriangle, Car, Calendar, MapPin, Search, Flag, CircleCheck as CheckCircle, Circle as XCircle, Plus, User } from 'lucide-react-native';

export default function ViolationsScreen() {
  const { user } = useAuth();
  const [violations, setViolations] = useState<Incident[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [showReportModal, setShowReportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newViolation, setNewViolation] = useState({
    vehicleId: '',
    type: 'violation' as 'violation' | 'accident' | 'theft' | 'other',
    description: '',
    location: '',
    severity: 'medium' as 'low' | 'medium' | 'high',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [allIncidents, allVehiclesResult] = await Promise.all([
        supabaseService.getIncidents(),
        supabaseService.getVehicles()
      ]);

      // Filter for violation-type incidents only
      const violationIncidents = allIncidents.filter(incident => 
        incident.type === 'violation' || incident.description.toLowerCase().includes('violation')
      );

      setViolations(violationIncidents);
      setVehicles(allVehiclesResult.data);
    } catch (error) {
      console.error('Error loading violations:', error);
      setError('Failed to load violations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getSeverityFromDescription = (description: string): 'low' | 'medium' | 'high' => {
    const desc = description.toLowerCase();
    if (desc.includes('reckless') || desc.includes('dangerous') || desc.includes('speeding')) {
      return 'high';
    } else if (desc.includes('red light') || desc.includes('expired') || desc.includes('insurance')) {
      return 'medium';
    }
    return 'low';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#DC2626';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#059669';
      default:
        return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported':
        return '#F59E0B';
      case 'investigating':
        return '#3B82F6';
      case 'resolved':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle size={16} color="#10B981" />;
      case 'investigating':
        return <AlertTriangle size={16} color="#3B82F6" />;
      default:
        return <Flag size={16} color="#F59E0B" />;
    }
  };

  const handleReportViolation = async () => {
    if (!newViolation.vehicleId || !newViolation.description || !newViolation.location) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const violationData = {
        vehicleId: newViolation.vehicleId,
        reporterId: user?.id || '',
        type: newViolation.type,
        description: `${newViolation.severity.toUpperCase()} SEVERITY: ${newViolation.description}`,
        location: newViolation.location,
        photos: [],
        status: 'reported' as 'reported',
      };

      const newViolationRecord = await supabaseService.addIncident(violationData);
      setViolations(prev => [newViolationRecord, ...prev]);
      setShowReportModal(false);
      setNewViolation({
        vehicleId: '',
        type: 'violation',
        description: '',
        location: '',
        severity: 'medium',
      });
      setError(null);
    } catch (error) {
      console.error('Error reporting violation:', error);
      setError('Failed to report violation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (violationId: string, newStatus: 'investigating' | 'resolved') => {
    try {
      await supabaseService.updateIncident(violationId, { status: newStatus });
      setViolations(prev => prev.map(v => 
        v.id === violationId ? { ...v, status: newStatus } : v
      ));
    } catch (error) {
      console.error('Error updating violation status:', error);
      setError('Failed to update violation status.');
    }
  };

  const filteredViolations = violations.filter(violation => {
    const vehicle = vehicles.find(v => v.id === violation.vehicleId);
    const severity = getSeverityFromDescription(violation.description);
    
    const matchesSearch = !searchQuery || 
      vehicle?.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      violation.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      violation.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterSeverity === 'all' || severity === filterSeverity;
    
    return matchesSearch && matchesFilter;
  });

  const getViolationStats = () => {
    const total = violations.length;
    const high = violations.filter(v => getSeverityFromDescription(v.description) === 'high').length;
    const medium = violations.filter(v => getSeverityFromDescription(v.description) === 'medium').length;
    const low = violations.filter(v => getSeverityFromDescription(v.description) === 'low').length;
    const resolved = violations.filter(v => v.status === 'resolved').length;
    
    return { total, high, medium, low, resolved };
  };

  const stats = getViolationStats();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Traffic Violations</Text>
            <Text style={styles.subtitle}>Monitor and manage traffic violations</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E40AF" />
            <Text style={styles.loadingText}>Loading violations...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Traffic Violations</Text>
            {user?.role === 'inspector' && (
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setShowReportModal(true)}
              >
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.subtitle}>Monitor and manage traffic violations</Text>
          <ErrorDisplay error={error} onDismiss={() => setError(null)} />
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            
            <View style={[styles.statCard, styles.highSeverityCard]}>
              <AlertTriangle size={20} color="#DC2626" />
              <Text style={styles.statNumber}>{stats.high}</Text>
              <Text style={styles.statLabel}>High</Text>
            </View>
            
            <View style={[styles.statCard, styles.mediumSeverityCard]}>
              <AlertTriangle size={20} color="#F59E0B" />
              <Text style={styles.statNumber}>{stats.medium}</Text>
              <Text style={styles.statLabel}>Medium</Text>
            </View>
            
            <View style={[styles.statCard, styles.resolvedCard]}>
              <CheckCircle size={20} color="#10B981" />
              <Text style={styles.statNumber}>{stats.resolved}</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by license plate, violation type, or location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Filter */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterButtons}>
              {[
                { key: 'all', label: 'All Severity' },
                { key: 'high', label: 'High' },
                { key: 'medium', label: 'Medium' },
                { key: 'low', label: 'Low' },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterButton,
                    filterSeverity === filter.key && styles.activeFilterButton
                  ]}
                  onPress={() => setFilterSeverity(filter.key as any)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    filterSeverity === filter.key && styles.activeFilterButtonText
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Violations List */}
        <ScrollView 
          style={styles.violationsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredViolations.length > 0 ? (
            filteredViolations.map((violation) => {
              const vehicle = vehicles.find(v => v.id === violation.vehicleId);
              const severity = getSeverityFromDescription(violation.description);
              
              return (
                <View key={violation.id} style={styles.violationCard}>
                  <View style={styles.violationHeader}>
                    <View style={styles.violationInfo}>
                      <View style={styles.violationTitleRow}>
                        <Car size={16} color="#6B7280" />
                        <Text style={styles.licensePlate}>
                          {vehicle?.licensePlate || 'Unknown Vehicle'}
                        </Text>
                        <View style={[
                          styles.severityBadge,
                          { backgroundColor: getSeverityColor(severity) }
                        ]}>
                          <Text style={styles.severityText}>
                            {severity.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={styles.violationType}>Traffic Violation</Text>
                    </View>
                    
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(violation.status) }
                    ]}>
                      {getStatusIcon(violation.status)}
                      <Text style={styles.statusText}>
                        {violation.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.violationDescription}>
                    {violation.description}
                  </Text>

                  <View style={styles.violationDetails}>
                    <View style={styles.detailRow}>
                      <MapPin size={14} color="#6B7280" />
                      <Text style={styles.detailText}>{violation.location}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Calendar size={14} color="#6B7280" />
                      <Text style={styles.detailText}>
                        {new Date(violation.date).toLocaleDateString()} at {new Date(violation.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <User size={14} color="#6B7280" />
                      <Text style={styles.detailText}>
                        Reported by: Inspector
                      </Text>
                    </View>
                  </View>

                  {(user?.role === 'inspector' || user?.role === 'admin') && violation.status !== 'resolved' && (
                    <View style={styles.actionButtons}>
                      {violation.status === 'reported' && (
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleUpdateStatus(violation.id, 'investigating')}
                        >
                          <Text style={styles.actionButtonText}>Start Investigation</Text>
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.resolveButton]}
                        onPress={() => handleUpdateStatus(violation.id, 'resolved')}
                      >
                        <Text style={styles.resolveButtonText}>Mark Resolved</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <AlertTriangle size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No violations found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || filterSeverity !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No traffic violations have been reported yet'
                }
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Report Violation Modal */}
        <Modal
          visible={showReportModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Report Violation</Text>
              <TouchableOpacity 
                onPress={handleReportViolation}
                disabled={isSubmitting}
              >
                <Text style={[styles.saveButton, isSubmitting && styles.disabledButton]}>
                  {isSubmitting ? 'Reporting...' : 'Report'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <ErrorDisplay error={error} onDismiss={() => setError(null)} />
              
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Vehicle *</Text>
                <View style={styles.vehicleSelection}>
                  {vehicles.map((vehicle) => (
                    <TouchableOpacity
                      key={vehicle.id}
                      style={[
                        styles.vehicleOption,
                        newViolation.vehicleId === vehicle.id && styles.selectedVehicleOption
                      ]}
                      onPress={() => setNewViolation({...newViolation, vehicleId: vehicle.id})}
                    >
                      <Text style={[
                        styles.vehicleOptionText,
                        newViolation.vehicleId === vehicle.id && styles.selectedVehicleOptionText
                      ]}>
                        {vehicle.licensePlate}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Severity *</Text>
                <View style={styles.severityOptions}>
                  {[
                    { key: 'low', label: 'Low', color: '#059669' },
                    { key: 'medium', label: 'Medium', color: '#F59E0B' },
                    { key: 'high', label: 'High', color: '#DC2626' },
                  ].map((severity) => (
                    <TouchableOpacity
                      key={severity.key}
                      style={[
                        styles.severityOption,
                        newViolation.severity === severity.key && { backgroundColor: severity.color }
                      ]}
                      onPress={() => setNewViolation({...newViolation, severity: severity.key as any})}
                    >
                      <Text style={[
                        styles.severityOptionText,
                        newViolation.severity === severity.key && styles.selectedSeverityText
                      ]}>
                        {severity.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Location *</Text>
                <TextInput
                  style={styles.input}
                  value={newViolation.location}
                  onChangeText={(text) => setNewViolation({...newViolation, location: text})}
                  placeholder="Enter violation location"
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newViolation.description}
                  onChangeText={(text) => setNewViolation({...newViolation, description: text})}
                  placeholder="Describe the violation..."
                  multiline
                  numberOfLines={6}
                />
              </View>

              {isSubmitting && (
                <View style={styles.submittingContainer}>
                  <ActivityIndicator size="large" color="#1E40AF" />
                  <Text style={styles.submittingText}>Reporting violation...</Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  highSeverityCard: {
    backgroundColor: '#FEF2F2',
  },
  mediumSeverityCard: {
    backgroundColor: '#FFFBEB',
  },
  resolvedCard: {
    backgroundColor: '#F0FDF4',
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
  violationsList: {
    flex: 1,
  },
  violationCard: {
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
  violationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  violationInfo: {
    flex: 1,
    marginRight: 12,
  },
  violationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  licensePlate: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  violationType: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#DC2626',
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
  violationDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  violationDetails: {
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  resolveButton: {
    backgroundColor: '#D1FAE5',
  },
  resolveButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#065F46',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  cancelButton: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  saveButton: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E40AF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginBottom: 8,
  },
  vehicleSelection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedVehicleOption: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  vehicleOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  selectedVehicleOptionText: {
    color: '#FFFFFF',
  },
  severityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  severityOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  severityOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  selectedSeverityText: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submittingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  submittingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1E40AF',
    marginTop: 12,
  },
});