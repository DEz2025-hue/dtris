import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { VehicleDocument, Vehicle } from '@/types';
import { supabaseService } from '@/utils/supabaseService';
import { documentService, DocumentResult } from '@/utils/documentPicker';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { FileText, Upload, Calendar, Shield, Car, TriangleAlert as AlertTriangle, Download, Eye, Camera, FolderOpen } from 'lucide-react-native';

export default function DocumentsScreen() {
  const { user } = useAuth();
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allVehicles = await supabaseService.getVehicles();
      const userVehicles = user?.role === 'admin' 
        ? allVehicles 
        : allVehicles.filter(v => v.ownerId === user?.id);
      
      setVehicles(userVehicles);
      
      // Load documents for user's vehicles
      const allDocuments: VehicleDocument[] = [];
      for (const vehicle of userVehicles) {
        allDocuments.push(...vehicle.documents);
      }
      setDocuments(allDocuments);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load documents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const documentTypes = [
    { type: 'insurance', label: 'Insurance Policy', icon: Shield, color: '#10B981' },
    { type: 'registration', label: 'Vehicle Registration', icon: Car, color: '#1E40AF' },
    { type: 'license', label: 'Driver\'s License', icon: FileText, color: '#F59E0B' },
    { type: 'other', label: 'Other Documents', icon: FileText, color: '#6B7280' },
  ];

  const isExpiringSoon = (date: Date) => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return date < thirtyDaysFromNow;
  };

  const handleUpload = (type: string) => {
    if (vehicles.length === 0) {
      setError('Please register a vehicle first before uploading documents.');
      return;
    }
    
    setSelectedDocType(type);
    setSelectedVehicleId(vehicles[0].id); // Default to first vehicle
    setShowUploadModal(true);
  };

  const handleDocumentPick = async () => {
    try {
      setIsUploading(true);
      
      const document = await documentService.pickDocument();
      if (!document) {
        setIsUploading(false);
        return;
      }

      // Validate file
      if (!documentService.validateFileSize(document.size)) {
        setError('File too large. Please select a file smaller than 10MB.');
        setIsUploading(false);
        return;
      }

      if (!documentService.validateFileType(document.mimeType)) {
        setError('Invalid file type. Please select a PDF, JPG, or PNG file.');
        setIsUploading(false);
        return;
      }

      // Save document
      const savedUri = await documentService.saveDocument(document, selectedVehicleId);
      
      // Create document record
      const newDocument: VehicleDocument = {
        id: Date.now().toString(),
        vehicleId: selectedVehicleId,
        type: selectedDocType as any,
        fileName: document.name,
        fileUrl: savedUri,
        mimeType: document.mimeType,
        uploadedAt: new Date(),
        // Set expiration date for certain document types
        expirationDate: selectedDocType === 'insurance' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
          : selectedDocType === 'license'
          ? new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000) // 5 years
          : undefined,
      };

      // Add document to Supabase
      await supabaseService.addVehicleDocument(newDocument);

      setDocuments(prev => [...prev, newDocument]);
      setShowUploadModal(false);
      setIsUploading(false);
      setError(null);
      
    } catch (error) {
      console.error('Error uploading document:', error);
      setError('Failed to upload document. Please try again.');
      setIsUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      setIsUploading(true);
      
      const photo = await documentService.takePhoto();
      if (!photo) {
        setIsUploading(false);
        return;
      }

      // Save photo
      const savedUri = await documentService.saveDocument(photo, selectedVehicleId);
      
      // Create document record
      const newDocument: VehicleDocument = {
        id: Date.now().toString(),
        vehicleId: selectedVehicleId,
        type: selectedDocType as any,
        fileName: photo.name,
        fileUrl: savedUri,
        mimeType: photo.mimeType,
        uploadedAt: new Date(),
      };

      // Add document to Supabase
      await supabaseService.addVehicleDocument(newDocument);

      setDocuments(prev => [...prev, newDocument]);
      setShowUploadModal(false);
      setIsUploading(false);
      setError(null);
      
    } catch (error) {
      console.error('Error taking photo:', error);
      setError('Failed to take photo. Please try again.');
      setIsUploading(false);
    }
  };

  const handleViewDocument = (document: VehicleDocument) => {
    // In a production app, this would open the document viewer
    console.log('View document:', document.fileName);
  };

  const handleDownloadDocument = (document: VehicleDocument) => {
    // In a production app, this would download the document
    console.log('Download document:', document.fileName);
  };

  const getVehicleForDocument = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Documents</Text>
          <Text style={styles.subtitle}>Manage your vehicle documents</Text>
          <ErrorDisplay error={error} onDismiss={() => setError(null)} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading documents...</Text>
          </View>
        ) : (
        <ScrollView style={styles.content}>
          {/* Document Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upload Documents</Text>
            <View style={styles.documentTypes}>
              {documentTypes.map((docType) => (
                <TouchableOpacity
                  key={docType.type}
                  style={styles.documentTypeCard}
                  onPress={() => handleUpload(docType.type)}
                >
                  <View style={[styles.documentTypeIcon, { backgroundColor: `${docType.color}20` }]}>
                    <docType.icon size={24} color={docType.color} />
                  </View>
                  <Text style={styles.documentTypeLabel}>{docType.label}</Text>
                  <Upload size={16} color="#6B7280" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Uploaded Documents */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Documents</Text>
            {documents.length > 0 ? (
              documents.map((document) => {
                const docType = documentTypes.find(t => t.type === document.type);
                const isExpiring = document.expirationDate && isExpiringSoon(document.expirationDate);
                const vehicle = getVehicleForDocument(document.vehicleId);
                
                return (
                  <View key={document.id} style={styles.documentCard}>
                    <View style={styles.documentHeader}>
                      <View style={styles.documentInfo}>
                        <View style={styles.documentTitleRow}>
                          <View style={[styles.documentIcon, { backgroundColor: `${docType?.color}20` }]}>
                            {docType && <docType.icon size={20} color={docType.color} />}
                          </View>
                          <View style={styles.documentTitleContainer}>
                            <Text style={styles.documentTitle}>{document.fileName}</Text>
                            <Text style={styles.documentVehicle}>
                              {vehicle?.licensePlate || 'Unknown Vehicle'}
                            </Text>
                          </View>
                          {isExpiring && (
                            <AlertTriangle size={16} color="#F59E0B" />
                          )}
                        </View>
                        
                        <Text style={styles.documentType}>
                          {docType?.label || 'Document'}
                        </Text>
                        
                        <View style={styles.documentDetails}>
                          <Text style={styles.documentDate}>
                            Uploaded: {document.uploadedAt.toLocaleDateString()}
                          </Text>
                          {document.expirationDate && (
                            <Text style={[
                              styles.documentExpiry,
                              isExpiring && styles.documentExpiryWarning
                            ]}>
                              Expires: {document.expirationDate.toLocaleDateString()}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                    
                    {/* Document Preview */}
                    {document.fileUrl && document.mimeType && document.mimeType.startsWith('image/') && (
                      <View style={styles.documentPreview}>
                        <Image 
                          source={{ uri: document.fileUrl }} 
                          style={styles.previewImage}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                    
                    <View style={styles.documentActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleViewDocument(document)}
                      >
                        <Eye size={16} color="#1E40AF" />
                        <Text style={styles.actionButtonText}>View</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                          // Open document in new tab/window
                          if (Platform.OS === 'web') {
                            window.open(document.fileUrl, '_blank');
                          } else {
                            handleDownloadDocument(document);
                          }
                        }}
                      >
                        <Download size={16} color="#1E40AF" />
                        <Text style={styles.actionButtonText}>
                          {Platform.OS === 'web' ? 'Open' : 'Download'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <FileText size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No documents uploaded</Text>
                <Text style={styles.emptySubtitle}>
                  Upload your vehicle documents to keep them organized and accessible
                </Text>
              </View>
            )}
          </View>

          {/* Reminders */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reminders</Text>
            <View style={styles.reminderCard}>
              <View style={styles.reminderHeader}>
                <Calendar size={20} color="#F59E0B" />
                <Text style={styles.reminderTitle}>Document Renewals</Text>
              </View>
              <Text style={styles.reminderText}>
                Keep your documents up to date. Check expiration dates regularly and renew before they expire.
              </Text>
            </View>
          </View>
        </ScrollView>
        )}

        {/* Upload Modal */}
        <Modal
          visible={showUploadModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Upload Document</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.modalContent}>
              <ErrorDisplay error={error} onDismiss={() => setError(null)} />
              
              {/* Vehicle Selection */}
              {vehicles.length > 1 && (
                <View style={styles.vehicleSelection}>
                  <Text style={styles.selectionTitle}>Select Vehicle</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.vehicleOptions}>
                      {vehicles.map((vehicle) => (
                        <TouchableOpacity
                          key={vehicle.id}
                          style={[
                            styles.vehicleOption,
                            selectedVehicleId === vehicle.id && styles.selectedVehicleOption
                          ]}
                          onPress={() => setSelectedVehicleId(vehicle.id)}
                        >
                          <Text style={[
                            styles.vehicleOptionText,
                            selectedVehicleId === vehicle.id && styles.selectedVehicleOptionText
                          ]}>
                            {vehicle.licensePlate}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              <View style={styles.uploadOptions}>
                <TouchableOpacity 
                  style={styles.uploadOption}
                  onPress={handleDocumentPick}
                  disabled={isUploading}
                >
                  <FolderOpen size={32} color="#1E40AF" />
                  <Text style={styles.uploadOptionTitle}>Choose File</Text>
                  <Text style={styles.uploadOptionSubtitle}>Select from device storage</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.uploadOption}
                  onPress={handleTakePhoto}
                  disabled={isUploading}
                >
                  <Camera size={32} color="#1E40AF" />
                  <Text style={styles.uploadOptionTitle}>Take Photo</Text>
                  <Text style={styles.uploadOptionSubtitle}>Capture with camera</Text>
                </TouchableOpacity>
              </View>

              {isUploading && (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="large" color="#1E40AF" />
                  <Text style={styles.uploadingText}>Uploading document...</Text>
                </View>
              )}

              <View style={styles.uploadInfo}>
                <Text style={styles.uploadInfoTitle}>Supported Formats</Text>
                <Text style={styles.uploadInfoText}>PDF, JPG, PNG (Max 10MB)</Text>
              </View>
            </View>
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
  documentTypes: {
    gap: 12,
  },
  documentTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  documentTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentTypeLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  documentCard: {
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
  documentHeader: {
    marginBottom: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  documentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentTitleContainer: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  documentVehicle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  documentType: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 8,
  },
  documentDetails: {
    gap: 4,
  },
  documentDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  documentExpiry: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  documentExpiryWarning: {
    color: '#F59E0B',
    fontFamily: 'Inter-Medium',
  },
  documentPreview: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 120,
  },
  documentActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1E40AF',
  },
  reminderCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  reminderTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#92400E',
  },
  reminderText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#92400E',
    lineHeight: 20,
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
    paddingHorizontal: 20,
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
  placeholder: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  vehicleSelection: {
    marginBottom: 24,
  },
  selectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  vehicleOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  vehicleOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
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
  uploadOptions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  uploadOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  uploadOptionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 12,
  },
  uploadOptionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  uploadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  uploadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1E40AF',
    marginTop: 12,
  },
  uploadInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  uploadInfoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  uploadInfoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
});