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
import { Announcement, UserRole } from '@/types';
import { supabaseService } from '@/utils/supabaseService';
import { notificationService } from '@/utils/notifications';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Bell, Plus, Calendar, Users, AlertTriangle, Info, CheckCircle } from 'lucide-react-native';

export default function AnnouncementsScreen() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    targetRole: null as UserRole | null,
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allAnnouncements = await supabaseService.getAnnouncements();
      setAnnouncements(allAnnouncements);
    } catch (error) {
      console.error('Error loading announcements:', error);
      setError('Failed to load announcements. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnnouncements();
    setRefreshing(false);
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const announcement: Announcement = {
        id: Date.now().toString(),
        title: newAnnouncement.title.trim(),
        content: newAnnouncement.content.trim(),
        date: new Date(),
        priority: newAnnouncement.priority,
        targetRole: newAnnouncement.targetRole,
      };

      await supabaseService.addAnnouncement(announcement);
      
      // Send push notification to all users
      await notificationService.sendSystemAnnouncement(
        announcement.title,
        announcement.content
      );

      setAnnouncements(prev => [announcement, ...prev]);
      setShowCreateModal(false);
      setNewAnnouncement({
        title: '',
        content: '',
        priority: 'medium',
        targetRole: null,
      });
      setError(null);
    } catch (error) {
      console.error('Error creating announcement:', error);
      setError('Failed to create announcement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle size={16} color="#DC2626" />;
      case 'medium':
        return <Info size={16} color="#F59E0B" />;
      case 'low':
        return <CheckCircle size={16} color="#059669" />;
      default:
        return <Info size={16} color="#6B7280" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getTargetRoleLabel = (targetRole: UserRole | null) => {
    if (!targetRole) return 'All Users';
    switch (targetRole) {
      case 'owner':
        return 'Vehicle Owners';
      case 'inspector':
        return 'Inspectors';
      case 'admin':
        return 'Administrators';
      default:
        return 'All Users';
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    if (user?.role === 'admin') return true; // Admins see all announcements
    return !announcement.targetRole || announcement.targetRole === user?.role;
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Announcements</Text>
            <Text style={styles.subtitle}>System announcements and updates</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E40AF" />
            <Text style={styles.loadingText}>Loading announcements...</Text>
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
            <Text style={styles.title}>Announcements</Text>
            {user?.role === 'admin' && (
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.subtitle}>System announcements and updates</Text>
          <ErrorDisplay error={error} onDismiss={() => setError(null)} />
        </View>

        <ScrollView 
          style={styles.announcementsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredAnnouncements.length > 0 ? (
            filteredAnnouncements.map((announcement) => (
              <View key={announcement.id} style={styles.announcementCard}>
                <View style={styles.announcementHeader}>
                  <View style={styles.announcementTitleRow}>
                    <Bell size={20} color={getPriorityColor(announcement.priority)} />
                    <Text style={styles.announcementTitle}>{announcement.title}</Text>
                  </View>
                  
                  <View style={styles.announcementMeta}>
                    <View style={[
                      styles.priorityBadge,
                      { backgroundColor: `${getPriorityColor(announcement.priority)}20` }
                    ]}>
                      {getPriorityIcon(announcement.priority)}
                      <Text style={[
                        styles.priorityText,
                        { color: getPriorityColor(announcement.priority) }
                      ]}>
                        {announcement.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.announcementContent}>
                  {announcement.content}
                </Text>

                <View style={styles.announcementFooter}>
                  <View style={styles.announcementDetails}>
                    <View style={styles.detailRow}>
                      <Calendar size={14} color="#6B7280" />
                      <Text style={styles.detailText}>
                        {announcement.date.toLocaleDateString()} at {announcement.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Users size={14} color="#6B7280" />
                      <Text style={styles.detailText}>
                        Target: {getTargetRoleLabel(announcement.targetRole)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Bell size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No announcements</Text>
              <Text style={styles.emptySubtitle}>
                {user?.role === 'admin' 
                  ? 'Create your first announcement to notify users'
                  : 'No announcements have been posted yet'
                }
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Create Announcement Modal */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create Announcement</Text>
              <TouchableOpacity 
                onPress={handleCreateAnnouncement}
                disabled={isSubmitting}
              >
                <Text style={[styles.saveButton, isSubmitting && styles.disabledButton]}>
                  {isSubmitting ? 'Publishing...' : 'Publish'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <ErrorDisplay error={error} onDismiss={() => setError(null)} />
              
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={newAnnouncement.title}
                  onChangeText={(text) => setNewAnnouncement({...newAnnouncement, title: text})}
                  placeholder="Enter announcement title"
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Content *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newAnnouncement.content}
                  onChangeText={(text) => setNewAnnouncement({...newAnnouncement, content: text})}
                  placeholder="Enter announcement content..."
                  multiline
                  numberOfLines={8}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Priority</Text>
                <View style={styles.priorityOptions}>
                  {[
                    { key: 'low', label: 'Low', color: '#059669', icon: CheckCircle },
                    { key: 'medium', label: 'Medium', color: '#F59E0B', icon: Info },
                    { key: 'high', label: 'High', color: '#DC2626', icon: AlertTriangle },
                  ].map((priority) => (
                    <TouchableOpacity
                      key={priority.key}
                      style={[
                        styles.priorityOption,
                        newAnnouncement.priority === priority.key && { 
                          backgroundColor: priority.color,
                          borderColor: priority.color 
                        }
                      ]}
                      onPress={() => setNewAnnouncement({...newAnnouncement, priority: priority.key as any})}
                    >
                      <priority.icon 
                        size={16} 
                        color={newAnnouncement.priority === priority.key ? '#FFFFFF' : priority.color} 
                      />
                      <Text style={[
                        styles.priorityOptionText,
                        newAnnouncement.priority === priority.key && styles.selectedPriorityText
                      ]}>
                        {priority.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Target Audience</Text>
                <View style={styles.targetOptions}>
                  {[
                    { key: null, label: 'All Users', icon: Users },
                    { key: 'owner', label: 'Vehicle Owners', icon: Users },
                    { key: 'inspector', label: 'Inspectors', icon: Users },
                    { key: 'admin', label: 'Administrators', icon: Users },
                  ].map((target) => (
                    <TouchableOpacity
                      key={target.key || 'all'}
                      style={[
                        styles.targetOption,
                        newAnnouncement.targetRole === target.key && styles.selectedTargetOption
                      ]}
                      onPress={() => setNewAnnouncement({...newAnnouncement, targetRole: target.key as any})}
                    >
                      <target.icon 
                        size={16} 
                        color={newAnnouncement.targetRole === target.key ? '#FFFFFF' : '#6B7280'} 
                      />
                      <Text style={[
                        styles.targetOptionText,
                        newAnnouncement.targetRole === target.key && styles.selectedTargetText
                      ]}>
                        {target.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {isSubmitting && (
                <View style={styles.submittingContainer}>
                  <ActivityIndicator size="large" color="#1E40AF" />
                  <Text style={styles.submittingText}>Publishing announcement...</Text>
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
  announcementsList: {
    flex: 1,
  },
  announcementCard: {
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
  announcementHeader: {
    marginBottom: 12,
  },
  announcementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    flex: 1,
  },
  announcementMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  priorityText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  announcementContent: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  announcementFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  announcementDetails: {
    gap: 6,
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
  priorityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  priorityOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  selectedPriorityText: {
    color: '#FFFFFF',
  },
  targetOptions: {
    gap: 8,
  },
  targetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  selectedTargetOption: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  targetOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  selectedTargetText: {
    color: '#FFFFFF',
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