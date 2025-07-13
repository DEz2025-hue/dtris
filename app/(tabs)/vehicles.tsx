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
  Image,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Vehicle } from '@/types';
import { supabaseService } from '@/utils/supabaseService';
import { notificationService } from '@/utils/notifications';
import { paymentService } from '@/utils/payments';
import { generateBarcode } from '@/utils/barcode';
import { qrCodeGenerator } from '@/utils/qrCodeGenerator';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Car, Plus, Calendar, Shield, CircleAlert as AlertCircle, CircleCheck as CheckCircle, QrCode, CreditCard } from 'lucide-react-native';

export default function VehiclesScreen() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newVehicle, setNewVehicle] = useState({
    licensePlate: '',
    make: '',
    model: '',
    year: '',
    color: '',
    vin: '',
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const vehiclesResult = await supabaseService.getVehicles();
      const allVehicles = vehiclesResult.data; // Extract the data array from the paginated result
      
      if (user?.role === 'admin') {
        setVehicles(allVehicles);
      } else {
        const userVehicles = allVehicles.filter(v => v.ownerId === user?.id);
        setVehicles(userVehicles);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setError('Failed to load vehicles. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVehicle = async () => {
    if (!newVehicle.licensePlate || !newVehicle.make || !newVehicle.model || !newVehicle.year) {
      setError('Please fill in all required fields');
      return;
    }

    const vehicle: Vehicle = {
      id: Date.now().toString(),
      ownerId: user?.id || '',
      licensePlate: newVehicle.licensePlate.toUpperCase(),
      make: newVehicle.make,
      model: newVehicle.model,
      year: parseInt(newVehicle.year),
      color: newVehicle.color,
      vin: newVehicle.vin.toUpperCase(),
      registrationDate: new Date(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      status: 'active',
      barcode: generateBarcode(newVehicle.licensePlate),
      documents: [],
      inspections: [],
    };

    try {
      await supabaseService.addVehicle(vehicle);
      
      // Schedule inspection reminder
      await notificationService.scheduleInspectionReminder(
        vehicle.id,
        vehicle.licensePlate,
        vehicle.expirationDate
      );

      setVehicles(prev => [...prev, vehicle]);
      setShowAddModal(false);
      setNewVehicle({
        licensePlate: '',
        make: '',
        model: '',
        year: '',
        color: '',
        vin: '',
      });
      
      setError(null);
    } catch (error) {
      console.error('Error adding vehicle:', error);
      setError('Failed to register vehicle. Please try again.');
    }
  };

  const handleRenewRegistration = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowPaymentModal(true);
  };

  const processRegistrationPayment = async () => {
    if (!selectedVehicle) return;

    setIsProcessingPayment(true);
    
    try {
      const fee = paymentService.getRegistrationFee(selectedVehicle.year);
      
      const payment = await paymentService.processPayment(
        user?.id || '',
        selectedVehicle.id,
        fee,
        'registration',
        `Registration renewal for ${selectedVehicle.licensePlate}`
      );

      if (payment.status === 'completed') {
        // Update vehicle expiration date
        const newExpirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        
        await supabaseService.updateVehicle(selectedVehicle.id, {
          status: 'active',
          expirationDate: newExpirationDate,
        });

        // Schedule new inspection reminder
        await notificationService.scheduleInspectionReminder(
          selectedVehicle.id,
          selectedVehicle.licensePlate,
          newExpirationDate
        );

        // Update local state
        setVehicles(prev => prev.map(v => 
          v.id === selectedVehicle.id 
            ? { ...v, status: 'active', expirationDate: newExpirationDate }
            : v
        ));

        setShowPaymentModal(false);
        setError(null);
      } else {
        setError('Payment could not be processed. Please try again.');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('An error occurred while processing payment.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleShowQR = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowQRModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'expired':
        return '#F59E0B';
      case 'suspended':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} color="#10B981" />;
      case 'expired':
        return <AlertCircle size={16} color="#F59E0B" />;
      case 'suspended':
        return <AlertCircle size={16} color="#EF4444" />;
      default:
        return null;
    }
  };

  const isExpiringSoon = (date: Date) => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return date < thirtyDaysFromNow;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {user?.role === 'admin' ? 'All Vehicles' : 'My Vehicles'}
            </Text>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading vehicles...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ErrorDisplay error={error} onDismiss={() => setError(null)} />
        
        <View style={styles.header}>
          <Text style={styles.title}>
            {user?.role === 'admin' ? 'All Vehicles' : 'My Vehicles'}
          </Text>
          {user?.role === 'owner' && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.vehiclesList}>
          {vehicles.map((vehicle) => {
            const isExpiring = isExpiringSoon(vehicle.expirationDate);
            
            return (
              <View key={vehicle.id} style={styles.vehicleCard}>
                <View style={styles.vehicleHeader}>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.licensePlate}>{vehicle.licensePlate}</Text>
                    <Text style={styles.vehicleDetails}>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </Text>
                    <Text style={styles.vehicleColor}>{vehicle.color}</Text>
                  </View>
                  <View style={styles.statusContainer}>
                    {getStatusIcon(vehicle.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(vehicle.status) }]}>
                      {vehicle.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.vehicleDetails}>
                  <View style={styles.detailRow}>
                    <Calendar size={16} color="#6B7280" />
                    <Text style={[
                      styles.detailText,
                      isExpiring && styles.expiringText
                    ]}>
                      Expires: {vehicle.expirationDate.toLocaleDateString()}
                      {isExpiring && ' (Soon)'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Shield size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      Inspections: {vehicle.inspections.length}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <QrCode size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      Barcode: {vehicle.barcode}
                    </Text>
                    <TouchableOpacity 
                      style={styles.qrButton}
                      onPress={() => handleShowQR(vehicle)}
                    >
                      <QrCode size={14} color="#1E40AF" />
                      <Text style={styles.qrButtonText}>View QR Code</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  {user?.role === 'owner' && (vehicle.status === 'expired' || isExpiring) && (
                    <TouchableOpacity 
                      style={styles.renewButton}
                      onPress={() => handleRenewRegistration(vehicle)}
                    >
                      <CreditCard size={16} color="#FFFFFF" />
                      <Text style={styles.renewButtonText}>Renew Registration</Text>
                    </TouchableOpacity>
                  )}
                  
                  {user?.role === 'admin' && (
                    <View style={styles.adminActions}>
                      <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>View Details</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionButton, styles.flagButton]}>
                        <Text style={styles.flagButtonText}>Flag Vehicle</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {vehicles.length === 0 && (
            <View style={styles.emptyState}>
              <Car size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No vehicles found</Text>
              <Text style={styles.emptySubtitle}>
                {user?.role === 'owner' 
                  ? 'Register your first vehicle to get started' 
                  : 'No vehicles in the system'
                }
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Add Vehicle Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Register Vehicle</Text>
              <TouchableOpacity onPress={handleAddVehicle}>
                <Text style={styles.saveButton}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>License Plate *</Text>
                <TextInput
                  style={styles.input}
                  value={newVehicle.licensePlate}
                  onChangeText={(text) => setNewVehicle({...newVehicle, licensePlate: text})}
                  placeholder="e.g., LR-2024-001"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Make *</Text>
                <TextInput
                  style={styles.input}
                  value={newVehicle.make}
                  onChangeText={(text) => setNewVehicle({...newVehicle, make: text})}
                  placeholder="e.g., Toyota"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Model *</Text>
                <TextInput
                  style={styles.input}
                  value={newVehicle.model}
                  onChangeText={(text) => setNewVehicle({...newVehicle, model: text})}
                  placeholder="e.g., Camry"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Year *</Text>
                <TextInput
                  style={styles.input}
                  value={newVehicle.year}
                  onChangeText={(text) => setNewVehicle({...newVehicle, year: text})}
                  placeholder="e.g., 2020"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Color</Text>
                <TextInput
                  style={styles.input}
                  value={newVehicle.color}
                  onChangeText={(text) => setNewVehicle({...newVehicle, color: text})}
                  placeholder="e.g., Silver"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>VIN</Text>
                <TextInput
                  style={styles.input}
                  value={newVehicle.vin}
                  onChangeText={(text) => setNewVehicle({...newVehicle, vin: text})}
                  placeholder="Vehicle Identification Number"
                  autoCapitalize="characters"
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Payment Modal */}
        <Modal
          visible={showPaymentModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Renew Registration</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.paymentContent}>
              {selectedVehicle && (
                <>
                  <View style={styles.paymentSummary}>
                    <Text style={styles.paymentTitle}>Payment Summary</Text>
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Vehicle:</Text>
                      <Text style={styles.summaryValue}>
                        {selectedVehicle.licensePlate}
                      </Text>
                    </View>
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Registration Fee:</Text>
                      <Text style={styles.summaryValue}>
                        {paymentService.formatCurrency(paymentService.getRegistrationFee(selectedVehicle.year))}
                      </Text>
                    </View>
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Valid Until:</Text>
                      <Text style={styles.summaryValue}>
                        {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.payButton, isProcessingPayment && styles.payButtonDisabled]}
                    onPress={processRegistrationPayment}
                    disabled={isProcessingPayment}
                  >
                    <CreditCard size={20} color="#FFFFFF" />
                    <Text style={styles.payButtonText}>
                      {isProcessingPayment ? 'Processing...' : 'Pay Now'}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.paymentNote}>
                    Payment will be processed securely. You will receive a confirmation once the transaction is complete.
                  </Text>
                </>
              )}
            </View>
          </SafeAreaView>
        </Modal>

        {/* QR Code Modal */}
        <Modal
          visible={showQRModal}
          animationType="fade"
          transparent={true}
        >
          <View style={styles.qrModalOverlay}>
            <View style={styles.qrModalContainer}>
              <View style={styles.qrModalHeader}>
                <Text style={styles.qrModalTitle}>Vehicle QR Code</Text>
                <TouchableOpacity onPress={() => setShowQRModal(false)}>
                  <Text style={styles.qrModalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {selectedVehicle && (
                <View style={styles.qrModalContent}>
                  <Text style={styles.qrVehicleInfo}>
                    {selectedVehicle.licensePlate} - {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                  </Text>
                  <Image 
                    source={{ uri: qrCodeGenerator.generateRegistrationQR(selectedVehicle) }}
                    style={styles.qrCodeImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.qrInstructions}>
                    Show this QR code to inspectors for quick vehicle identification
                  </Text>
                </View>
              )}
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  vehiclesList: {
    flex: 1,
  },
  vehicleCard: {
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
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  licensePlate: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 2,
  },
  vehicleColor: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  expiringText: {
    color: '#F59E0B',
    fontFamily: 'Inter-Medium',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  qrButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1E40AF',
  },
  actionButtons: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  renewButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  adminActions: {
    flexDirection: 'row',
    gap: 12,
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
  flagButton: {
    backgroundColor: '#FEF2F2',
  },
  flagButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#DC2626',
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
  placeholder: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginBottom: 8,
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
  paymentContent: {
    flex: 1,
    padding: 16,
  },
  paymentSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  paymentTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  paymentNote: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
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
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  qrModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  qrModalClose: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  qrModalContent: {
    alignItems: 'center',
  },
  qrVehicleInfo: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  qrCodeImage: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  qrInstructions: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});