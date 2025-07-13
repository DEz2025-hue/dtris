import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Incident, Vehicle } from '@/types';
import { supabaseService } from '@/utils/supabaseService';
import { documentService } from '@/utils/documentPicker';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { reportGenerator, ReportData } from '@/utils/reportGenerator';
import { TriangleAlert as AlertTriangle, Car, FileText, Plus, MapPin, Calendar, Camera, ChartBar as BarChart3, Download, Share, Filter } from 'lucide-react-native';

export default function ReportsScreen() {
  const { user } = useAuth();
  const [showReportModal, setShowReportModal] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'reported' | 'investigating' | 'resolved'>('all');
  const [error, setError] = useState<string | null>(null);
  const [reportForm, setReportForm] = useState({
    type: 'accident' as 'accident' | 'violation' | 'theft' | 'other',
    description: '',
    location: '',
    vehicleId: '',
    photos: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [allIncidents, allVehicles] = await Promise.all([
        supabaseService.getIncidents(),
        supabaseService.getVehicles()
      ]);

      setIncidents(allIncidents);
      setVehicles(allVehicles);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load reports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const incidentTypes = [
    { type: 'accident', label: 'Traffic Accident', icon: AlertTriangle, color: '#EF4444' },
    { type: 'violation', label: 'Traffic Violation', icon: Car, color: '#F59E0B' },
    { type: 'theft', label: 'Vehicle Theft', icon: AlertTriangle, color: '#DC2626' },
    { type: 'other', label: 'Other Incident', icon: FileText, color: '#6B7280' },
  ];

  const handleSubmitReport = async () => {
    if (!reportForm.description || !reportForm.location) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const incident: Incident = {
        id: Date.now().toString(),
        vehicleId: reportForm.vehicleId || '',
        reporterId: user?.id || '',
        type: reportForm.type,
        description: reportForm.description,
        location: reportForm.location,
        date: new Date(),
        photos: reportForm.photos,
        status: 'reported',
      };

      await supabaseService.addIncident(incident);
      setIncidents(prev => [incident, ...prev]);

      setShowReportModal(false);
      setReportForm({
        type: 'accident',
        description: '',
        location: '',
        vehicleId: '',
        photos: [],
      });
      setError(null);
    } catch (error) {
      console.error('Error submitting report:', error);
      setError('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPhoto = async () => {
    try {
      const photo = await documentService.takePhoto();
      if (photo) {
        const savedUri = await documentService.saveDocument(photo, 'incident_' + Date.now());
        setReportForm(prev => ({
          ...prev,
          photos: [...prev.photos, savedUri]
        }));
      }
    } catch (error) {
      console.error('Error adding photo:', error);
      setError('Failed to add photo');
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

  const getIncidentStats = () => {
    const total = incidents.length;
    const reported = incidents.filter(i => i.status === 'reported').length;
    const investigating = incidents.filter(i => i.status === 'investigating').length;
    const resolved = incidents.filter(i => i.status === 'resolved').length;
    
    return { total, reported, investigating, resolved };
  };

  const filteredIncidents = incidents.filter(incident => 
    filterStatus === 'all' || incident.status === filterStatus
  );

  const exportData = async (reportType: string) => {
    setIsExporting(true);
    try {
      const [allInspections, allPayments, allUsers] = await Promise.all([
        supabaseService.getInspections(),
        supabaseService.getPayments(),
        supabaseService.getUsers()
      ]);

      const reportData: ReportData = {
        vehicles,
        inspections: allInspections,
        incidents: filteredIncidents,
        users: allUsers.data,
        payments: allPayments,
        generatedAt: new Date(),
        generatedBy: user?.name || 'Unknown User',
      };

      switch (reportType) {
        case 'vehicles':
          await reportGenerator.exportVehicleReport(vehicles);
          break;
        case 'inspections':
          await reportGenerator.exportInspectionReport(allInspections, vehicles);
          break;
        case 'compliance':
          await reportGenerator.exportComplianceReport(vehicles, allInspections);
          break;
        case 'analytics':
          await reportGenerator.exportAnalyticsReport(reportData);
          break;
        case 'system':
          await reportGenerator.exportSystemReport(reportData);
          break;
        default:
          throw new Error('Unknown report type');
      }

      // Show success message
      if (Platform.OS === 'web') {
        Alert.alert(
          'Export Complete',
          'Your report has been downloaded successfully.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Export Complete',
          'Your report has been prepared for sharing.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export report. Please try again.');
      Alert.alert(
        'Export Failed',
        'There was an error generating your report. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const renderOwnerReports = () => {
    const userIncidents = incidents.filter(i => i.reporterId === user?.id);
    const stats = {
      total: userIncidents.length,
      reported: userIncidents.filter(i => i.status === 'reported').length,
      investigating: userIncidents.filter(i => i.status === 'investigating').length,
      resolved: userIncidents.filter(i => i.status === 'resolved').length,
    };

    return (
      <ScrollView style={styles.content}>
        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Reports</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, styles.reportedCard]}>
              <Text style={styles.statNumber}>{stats.reported}</Text>
              <Text style={styles.statLabel}>Reported</Text>
            </View>
            <View style={[styles.statCard, styles.investigatingCard]}>
              <Text style={styles.statNumber}>{stats.investigating}</Text>
              <Text style={styles.statLabel}>Investigating</Text>
            </View>
            <View style={[styles.statCard, styles.resolvedCard]}>
              <Text style={styles.statNumber}>{stats.resolved}</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Incident</Text>
          <TouchableOpacity 
            style={styles.reportButton}
            onPress={() => setShowReportModal(true)}
          >
            <View style={styles.reportButtonContent}>
              <View style={styles.reportButtonIcon}>
                <Plus size={24} color="#FFFFFF" />
              </View>
              <View style={styles.reportButtonText}>
                <Text style={styles.reportButtonTitle}>New Incident Report</Text>
                <Text style={styles.reportButtonSubtitle}>Report accidents, violations, or theft</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Reports */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          {userIncidents.length > 0 ? (
            userIncidents.slice(0, 5).map((incident) => {
              const incidentType = incidentTypes.find(t => t.type === incident.type);
              const vehicle = vehicles.find(v => v.id === incident.vehicleId);
              
              return (
                <View key={incident.id} style={styles.incidentCard}>
                  <View style={styles.incidentHeader}>
                    <View style={styles.incidentInfo}>
                      <View style={styles.incidentTitleRow}>
                        <View style={[styles.incidentIcon, { backgroundColor: `${incidentType?.color}20` }]}>
                          {incidentType && <incidentType.icon size={20} color={incidentType.color} />}
                        </View>
                        <Text style={styles.incidentTitle}>{incidentType?.label}</Text>
                      </View>
                      
                      <View style={styles.incidentDetails}>
                        <View style={styles.detailRow}>
                          <MapPin size={14} color="#6B7280" />
                          <Text style={styles.detailText}>{incident.location}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Calendar size={14} color="#6B7280" />
                          <Text style={styles.detailText}>{incident.date.toLocaleDateString()}</Text>
                        </View>
                        {vehicle && (
                          <View style={styles.detailRow}>
                            <Car size={14} color="#6B7280" />
                            <Text style={styles.detailText}>{vehicle.licensePlate}</Text>
                          </View>
                        )}
                      </View>
                      
                      <Text style={styles.incidentDescription}>{incident.description}</Text>
                    </View>
                    
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(incident.status) }]}>
                      <Text style={styles.statusText}>{incident.status.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <FileText size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No reports submitted</Text>
              <Text style={styles.emptySubtitle}>
                Report incidents to help keep our roads safe
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderAdminReports = () => {
    const stats = getIncidentStats();

    return (
      <ScrollView style={styles.content}>
        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Analytics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <BarChart3 size={24} color="#1E40AF" />
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Reports</Text>
            </View>
            
            <View style={[styles.statCard, styles.reportedCard]}>
              <AlertTriangle size={24} color="#F59E0B" />
              <Text style={styles.statNumber}>{stats.reported}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            
            <View style={[styles.statCard, styles.investigatingCard]}>
              <Car size={24} color="#3B82F6" />
              <Text style={styles.statNumber}>{stats.investigating}</Text>
              <Text style={styles.statLabel}>Investigating</Text>
            </View>

            <View style={[styles.statCard, styles.resolvedCard]}>
              <Car size={24} color="#10B981" />
              <Text style={styles.statNumber}>{stats.resolved}</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
          </View>
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Reports</Text>
          <View style={styles.exportOptions}>
            <TouchableOpacity 
              style={[styles.exportButton, isExporting && styles.exportButtonDisabled]} 
              onPress={() => exportData('vehicles')}
              disabled={isExporting}
            >
              <Download size={20} color="#1E40AF" />
              <Text style={styles.exportButtonText}>Vehicle Report (CSV)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.exportButton, isExporting && styles.exportButtonDisabled]} 
              onPress={() => exportData('inspections')}
              disabled={isExporting}
            >
              <Download size={20} color="#1E40AF" />
              <Text style={styles.exportButtonText}>Inspection Report (CSV)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.exportButton, isExporting && styles.exportButtonDisabled]} 
              onPress={() => exportData('compliance')}
              disabled={isExporting}
            >
              <Download size={20} color="#1E40AF" />
              <Text style={styles.exportButtonText}>Compliance Report (CSV)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.exportButton, isExporting && styles.exportButtonDisabled]} 
              onPress={() => exportData('analytics')}
              disabled={isExporting}
            >
              <BarChart3 size={20} color="#1E40AF" />
              <Text style={styles.exportButtonText}>Analytics Report (CSV)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.exportButton, styles.systemExportButton, isExporting && styles.exportButtonDisabled]} 
              onPress={() => exportData('system')}
              disabled={isExporting}
            >
              <Share size={20} color="#FFFFFF" />
              <Text style={styles.systemExportButtonText}>
                {isExporting ? 'Generating...' : 'Complete System Report'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter */}
        <View style={styles.section}>
          <View style={styles.filterHeader}>
            <Text style={styles.sectionTitle}>All Incidents</Text>
            <View style={styles.filterButtons}>
              {[
                { key: 'all', label: 'All' },
                { key: 'reported', label: 'Reported' },
                { key: 'investigating', label: 'Investigating' },
                { key: 'resolved', label: 'Resolved' },
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
          </View>

          {filteredIncidents.map((incident) => {
            const incidentType = incidentTypes.find(t => t.type === incident.type);
            const vehicle = vehicles.find(v => v.id === incident.vehicleId);
            
            return (
              <View key={incident.id} style={styles.incidentCard}>
                <View style={styles.incidentHeader}>
                  <View style={styles.incidentInfo}>
                    <View style={styles.incidentTitleRow}>
                      <View style={[styles.incidentIcon, { backgroundColor: `${incidentType?.color}20` }]}>
                        {incidentType && <incidentType.icon size={20} color={incidentType.color} />}
                      </View>
                      <Text style={styles.incidentTitle}>{incidentType?.label}</Text>
                    </View>
                    
                    <View style={styles.incidentDetails}>
                      <View style={styles.detailRow}>
                        <MapPin size={14} color="#6B7280" />
                        <Text style={styles.detailText}>{incident.location}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Calendar size={14} color="#6B7280" />
                        <Text style={styles.detailText}>{incident.date.toLocaleDateString()}</Text>
                      </View>
                      {vehicle && (
                        <View style={styles.detailRow}>
                          <Car size={14} color="#6B7280" />
                          <Text style={styles.detailText}>{vehicle.licensePlate}</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={styles.incidentDescription}>{incident.description}</Text>
                  </View>
                  
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(incident.status) }]}>
                    <Text style={styles.statusText}>{incident.status.toUpperCase()}</Text>
                  </View>
                </View>

                {/* Admin Actions */}
                {user?.role === 'admin' && incident.status !== 'resolved' && (
                  <View style={styles.adminActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => {
                        // Update incident status
                        const newStatus = incident.status === 'reported' ? 'investigating' : 'resolved';
                        supabaseService.updateIncident(incident.id, { status: newStatus });
                        setIncidents(prev => prev.map(i => 
                          i.id === incident.id ? { ...i, status: newStatus } : i
                        ));
                      }}
                    >
                      <Text style={styles.actionButtonText}>
                        {incident.status === 'reported' ? 'Start Investigation' : 'Mark Resolved'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {user?.role === 'admin' ? 'System Reports' : 'Incident Reports'}
            </Text>
            <Text style={styles.subtitle}>
              {user?.role === 'admin' 
                ? 'Analytics and system reports' 
                : 'Report incidents and view history'
              }
            </Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E40AF" />
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {user?.role === 'admin' ? 'System Reports' : 'Incident Reports'}
          </Text>
          <Text style={styles.subtitle}>
            {user?.role === 'admin' 
              ? 'Analytics and system reports' 
              : 'Report incidents and view history'
            }
          </Text>
          <ErrorDisplay error={error} onDismiss={() => setError(null)} />
        </View>

        {user?.role === 'admin' ? renderAdminReports() : renderOwnerReports()}

        {/* Report Modal */}
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
              <Text style={styles.modalTitle}>Report Incident</Text>
              <TouchableOpacity 
                onPress={handleSubmitReport}
                disabled={isSubmitting}
              >
                <Text style={[styles.saveButton, isSubmitting && styles.disabledButton]}>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
             <ErrorDisplay error={error} onDismiss={() => setError(null)} />
             
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Incident Type</Text>
                <View style={styles.typeOptions}>
                  {incidentTypes.map((type) => (
                    <TouchableOpacity
                      key={type.type}
                      style={[
                        styles.typeOption,
                        reportForm.type === type.type && styles.selectedType
                      ]}
                      onPress={() => setReportForm({...reportForm, type: type.type as any})}
                    >
                      <type.icon size={20} color={reportForm.type === type.type ? '#FFFFFF' : type.color} />
                      <Text style={[
                        styles.typeOptionText,
                        reportForm.type === type.type && styles.selectedTypeText
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Vehicle Selection */}
              {vehicles.length > 0 && (
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Vehicle (Optional)</Text>
                  <View style={styles.vehicleSelection}>
                    <TouchableOpacity
                      style={[
                        styles.vehicleOption,
                        !reportForm.vehicleId && styles.selectedVehicleOption
                      ]}
                      onPress={() => setReportForm({...reportForm, vehicleId: ''})}
                    >
                      <Text style={[
                        styles.vehicleOptionText,
                        !reportForm.vehicleId && styles.selectedVehicleOptionText
                      ]}>
                        No Vehicle
                      </Text>
                    </TouchableOpacity>
                    {vehicles.filter(v => v.ownerId === user?.id).map((vehicle) => (
                      <TouchableOpacity
                        key={vehicle.id}
                        style={[
                          styles.vehicleOption,
                          reportForm.vehicleId === vehicle.id && styles.selectedVehicleOption
                        ]}
                        onPress={() => setReportForm({...reportForm, vehicleId: vehicle.id})}
                      >
                        <Text style={[
                          styles.vehicleOptionText,
                          reportForm.vehicleId === vehicle.id && styles.selectedVehicleOptionText
                        ]}>
                          {vehicle.licensePlate}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Location *</Text>
                <TextInput
                  style={styles.input}
                  value={reportForm.location}
                  onChangeText={(text) => setReportForm({...reportForm, location: text})}
                  placeholder="Enter incident location"
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={reportForm.description}
                  onChangeText={(text) => setReportForm({...reportForm, description: text})}
                  placeholder="Describe what happened..."
                  multiline
                  numberOfLines={6}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Photos ({reportForm.photos.length})</Text>
                <TouchableOpacity style={styles.photoButton} onPress={handleAddPhoto}>
                  <Camera size={20} color="#6B7280" />
                  <Text style={styles.photoButtonText}>Add Photos</Text>
                </TouchableOpacity>
              </View>

              {isSubmitting && (
                <View style={styles.submittingContainer}>
                  <ActivityIndicator size="large" color="#1E40AF" />
                  <Text style={styles.submittingText}>Submitting report...</Text>
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
    marginBottom: 24,
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
  content: {
    flex: 1,
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
  reportedCard: {
    backgroundColor: '#FFFBEB',
  },
  investigatingCard: {
    backgroundColor: '#EBF4FF',
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
  reportButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  reportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportButtonIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  reportButtonText: {
    flex: 1,
  },
  reportButtonTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  reportButtonSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  exportOptions: {
    gap: 12,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exportButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1E40AF',
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  systemExportButton: {
    backgroundColor: '#1E40AF',
  },
  systemExportButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  activeFilterButton: {
    backgroundColor: '#1E40AF',
  },
  filterButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  incidentCard: {
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
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  incidentInfo: {
    flex: 1,
    marginRight: 12,
  },
  incidentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  incidentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incidentTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  incidentDetails: {
    gap: 4,
    marginBottom: 8,
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
  incidentDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  adminActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
  typeOptions: {
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    gap: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedType: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  typeOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  selectedTypeText: {
    color: '#FFFFFF',
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
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  photoButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
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