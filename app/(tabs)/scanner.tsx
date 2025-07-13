import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useAuth } from '@/contexts/AuthContext';
import { Vehicle, Inspection } from '@/types';
import { supabaseService } from '@/utils/supabaseService';
import { notificationService } from '@/utils/notifications';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Camera, Car, CircleCheck as CheckCircle, Circle as XCircle, TriangleAlert as AlertTriangle, Calendar, User, MapPin, Flashlight, FlashlightOff } from 'lucide-react-native';

export default function ScannerScreen() {
  const { user } = useAuth();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedVehicle, setScannedVehicle] = useState<Vehicle | null>(null);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inspectionForm, setInspectionForm] = useState({
    status: 'pass' as 'pass' | 'fail' | 'conditional',
    notes: '',
    violations: [] as string[],
    location: '',
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setError(null);
      const allVehicles = await supabaseService.getVehicles();
      setVehicles(allVehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setError('Failed to load vehicles. Please try again.');
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera size={64} color="#6B7280" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan vehicle barcodes for inspections.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (!isScanning) return;

    try {
      setIsScanning(false);
      
      // Try to find vehicle by barcode first, then by license plate
      let vehicle = vehicles.find(v => v.barcode === data);
      
      if (!vehicle) {
        // Try to find by license plate if barcode doesn't match
        vehicle = vehicles.find(v => v.licensePlate === data);
      }
      
      if (vehicle) {
        setScannedVehicle(vehicle);
        setShowInspectionModal(true);
        setError(null);
      } else {
        setError(`No vehicle found with barcode/license plate: ${data}`);
        setIsScanning(true);
      }
    } catch (error) {
      setError('Failed to process barcode scan.');
      setIsScanning(true);
    }
  };

  const handleInspectionSubmit = async () => {
    if (!scannedVehicle || !inspectionForm.location) {
      setError('Please fill in all required fields.');
      return;
    }

    const inspection: Inspection = {
      id: Date.now().toString(),
      vehicleId: scannedVehicle.id,
      inspectorId: user?.id || '',
      inspectorName: user?.name || '',
      date: new Date(),
      status: inspectionForm.status,
      notes: inspectionForm.notes,
      violations: inspectionForm.violations,
      location: inspectionForm.location,
      nextInspectionDue: inspectionForm.status === 'pass' 
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
        : undefined,
    };

    try {
      await supabaseService.addInspection(inspection);
      
      // Update vehicle status based on inspection result
      const newStatus = inspectionForm.status === 'pass' ? 'active' : 
                       inspectionForm.status === 'fail' ? 'suspended' : 'active';
      
      await supabaseService.updateVehicle(scannedVehicle.id, {
        status: newStatus,
        expirationDate: inspection.nextInspectionDue || scannedVehicle.expirationDate,
      });

      // Send notification to vehicle owner
      await notificationService.sendInspectionResult(
        scannedVehicle.licensePlate,
        inspectionForm.status
      );

      // Schedule next inspection reminder if passed
      if (inspectionForm.status === 'pass' && inspection.nextInspectionDue) {
        await notificationService.scheduleInspectionReminder(
          scannedVehicle.id,
          scannedVehicle.licensePlate,
          inspection.nextInspectionDue
        );
      }

      setShowInspectionModal(false);
      setScannedVehicle(null);
      setInspectionForm({
        status: 'pass',
        notes: '',
        violations: [],
        location: '',
      });
      setIsScanning(true);
      setError(null);
    } catch (error) {
      setError('Failed to save inspection. Please try again.');
    }
  };

  const toggleViolation = (violation: string) => {
    setInspectionForm(prev => ({
      ...prev,
      violations: prev.violations.includes(violation)
        ? prev.violations.filter(v => v !== violation)
        : [...prev.violations, violation]
    }));
  };

  const commonViolations = [
    'Defective brake lights',
    'Worn tires',
    'Cracked windshield',
    'Non-functioning headlights',
    'Expired registration',
    'Missing safety equipment',
    'Emissions failure',
    'Structural damage',
    'Faulty steering',
    'Broken mirrors',
    'Excessive noise',
    'Illegal modifications',
  ];

  // Simulate barcode scanning for web platform
  const simulateScan = () => {
    if (Platform.OS === 'web') {
      // Use first vehicle for demo
      if (vehicles.length > 0) {
        handleBarcodeScanned({ type: 'qr', data: vehicles[0].barcode });
      } else {
        setError('No vehicles available for demo scan');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Vehicle Scanner</Text>
          <Text style={styles.subtitle}>Scan barcode or QR code to inspect vehicle</Text>
          <ErrorDisplay error={error} onDismiss={() => setError(null)} />
        </View>

        <View style={styles.cameraContainer}>
          {Platform.OS === 'web' ? (
            // Web fallback UI
            <View style={styles.webFallback}>
              <Camera size={64} color="#6B7280" />
              <Text style={styles.webFallbackText}>Camera scanning not available on web</Text>
              <TouchableOpacity style={styles.simulateButton} onPress={simulateScan}>
                <Text style={styles.simulateButtonText}>Simulate Scan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <CameraView 
              style={styles.camera} 
              facing={facing}
              onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'pdf417', 'code128', 'code39', 'code93', 'ean13', 'ean8'],
              }}
              enableTorch={flashEnabled}
            >
              <View style={styles.overlay}>
                <View style={styles.scanFrame} />
                <Text style={styles.scanText}>
                  {isScanning ? 'Align barcode within the frame' : 'Processing...'}
                </Text>
                
                <View style={styles.scanControls}>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => setFlashEnabled(!flashEnabled)}
                  >
                    {flashEnabled ? (
                      <FlashlightOff size={24} color="#FFFFFF" />
                    ) : (
                      <Flashlight size={24} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </CameraView>
          )}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={() => setFacing(current => current === 'back' ? 'front' : 'back')}
          >
            <Camera size={24} color="#1E40AF" />
            <Text style={styles.flipButtonText}>Flip Camera</Text>
          </TouchableOpacity>
          
          {!isScanning && (
            <TouchableOpacity
              style={styles.resumeButton}
              onPress={() => setIsScanning(true)}
            >
              <Text style={styles.resumeButtonText}>Resume Scanning</Text>
            </TouchableOpacity>
          )}
        </View>

        <Modal
          visible={showInspectionModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setShowInspectionModal(false);
                setIsScanning(true);
              }}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Vehicle Inspection</Text>
              <TouchableOpacity onPress={handleInspectionSubmit}>
                <Text style={styles.saveButton}>Submit</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <ErrorDisplay error={error} onDismiss={() => setError(null)} />
              
              {scannedVehicle && (
                <View style={styles.vehicleInfo}>
                  <View style={styles.vehicleHeader}>
                    <Car size={24} color="#1E40AF" />
                    <Text style={styles.vehiclePlate}>{scannedVehicle.licensePlate}</Text>
                    <View style={[
                      styles.vehicleStatusBadge,
                      { backgroundColor: scannedVehicle.status === 'active' ? '#10B981' : '#F59E0B' }
                    ]}>
                      <Text style={styles.vehicleStatusText}>
                        {scannedVehicle.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.vehicleDetails}>
                    {scannedVehicle.year} {scannedVehicle.make} {scannedVehicle.model}
                  </Text>
                  <Text style={styles.vehicleColor}>{scannedVehicle.color}</Text>
                  
                  <View style={styles.vehicleStatus}>
                    <View style={styles.statusItem}>
                      <Calendar size={16} color="#6B7280" />
                      <Text style={styles.statusText}>
                        Expires: {scannedVehicle.expirationDate.toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.statusItem}>
                      <User size={16} color="#6B7280" />
                      <Text style={styles.statusText}>
                        Inspections: {scannedVehicle.inspections.length}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.inspectionSection}>
                <Text style={styles.sectionTitle}>Inspection Result</Text>
                <View style={styles.statusButtons}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      inspectionForm.status === 'pass' && styles.passButton
                    ]}
                    onPress={() => setInspectionForm({...inspectionForm, status: 'pass'})}
                  >
                    <CheckCircle size={20} color={inspectionForm.status === 'pass' ? '#FFFFFF' : '#10B981'} />
                    <Text style={[
                      styles.statusButtonText,
                      inspectionForm.status === 'pass' && styles.activeButtonText
                    ]}>Pass</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      inspectionForm.status === 'fail' && styles.failButton
                    ]}
                    onPress={() => setInspectionForm({...inspectionForm, status: 'fail'})}
                  >
                    <XCircle size={20} color={inspectionForm.status === 'fail' ? '#FFFFFF' : '#EF4444'} />
                    <Text style={[
                      styles.statusButtonText,
                      inspectionForm.status === 'fail' && styles.activeButtonText
                    ]}>Fail</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      inspectionForm.status === 'conditional' && styles.conditionalButton
                    ]}
                    onPress={() => setInspectionForm({...inspectionForm, status: 'conditional'})}
                  >
                    <AlertTriangle size={20} color={inspectionForm.status === 'conditional' ? '#FFFFFF' : '#F59E0B'} />
                    <Text style={[
                      styles.statusButtonText,
                      inspectionForm.status === 'conditional' && styles.activeButtonText
                    ]}>Conditional</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inspectionSection}>
                <Text style={styles.sectionTitle}>Location *</Text>
                <TextInput
                  style={styles.input}
                  value={inspectionForm.location}
                  onChangeText={(text) => setInspectionForm({...inspectionForm, location: text})}
                  placeholder="Enter inspection location"
                />
              </View>

              <View style={styles.inspectionSection}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={inspectionForm.notes}
                  onChangeText={(text) => setInspectionForm({...inspectionForm, notes: text})}
                  placeholder="Add inspection notes..."
                  multiline
                  numberOfLines={4}
                />
              </View>

              {inspectionForm.status !== 'pass' && (
                <View style={styles.inspectionSection}>
                  <Text style={styles.sectionTitle}>Violations</Text>
                  <View style={styles.violationsList}>
                    {commonViolations.map((violation) => (
                      <TouchableOpacity
                        key={violation}
                        style={[
                          styles.violationItem,
                          inspectionForm.violations.includes(violation) && styles.selectedViolation
                        ]}
                        onPress={() => toggleViolation(violation)}
                      >
                        <Text style={[
                          styles.violationText,
                          inspectionForm.violations.includes(violation) && styles.selectedViolationText
                        ]}>
                          {violation}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
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
  cameraContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  webFallbackText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  simulateButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  simulateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scanText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginTop: 20,
    textAlign: 'center',
  },
  scanControls: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    gap: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
  },
  flipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  flipButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1E40AF',
  },
  resumeButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resumeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
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
  modalContent: {
    flex: 1,
    padding: 16,
  },
  vehicleInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  vehiclePlate: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    flex: 1,
  },
  vehicleStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vehicleStatusText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  vehicleDetails: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  vehicleColor: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  vehicleStatus: {
    marginTop: 12,
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  inspectionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  passButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  failButton: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  conditionalButton: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  statusButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  activeButtonText: {
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  violationsList: {
    gap: 8,
  },
  violationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedViolation: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  violationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  selectedViolationText: {
    color: '#DC2626',
    fontFamily: 'Inter-Medium',
  },
});