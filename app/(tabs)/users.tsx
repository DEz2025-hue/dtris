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
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole } from '@/types';
import { supabaseService } from '@/utils/supabaseService';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { DatabaseSetupGuide } from '@/components/DatabaseSetupGuide';
import { Users, Search, Plus, User as UserIcon, Shield, Car, Settings, Mail, Phone, MapPin, Filter, MoveVertical as MoreVertical, Edit, Trash2, UserX } from 'lucide-react-native';

export default function UsersScreen() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [databaseNotSetUp, setDatabaseNotSetUp] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'owner' as UserRole,
    phone: '',
    address: '',
  });
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    role: 'owner' as UserRole,
    phone: '',
    address: '',
    status: 'active' as 'active' | 'suspended',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setDatabaseNotSetUp(false);
      
      const allUsers = await supabaseService.getUsers();
      setUsers(allUsers.data);
    } catch (error: any) {
      console.error('Error loading users:', error);
      
      // Check if it's a database setup issue
      if (error.message && error.message.includes('Database tables not set up')) {
        setDatabaseNotSetUp(true);
        setError(null);
      } else {
        setError('Failed to load users. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Settings size={16} color="#DC2626" />;
      case 'inspector':
        return <Shield size={16} color="#1E40AF" />;
      case 'owner':
        return <Car size={16} color="#059669" />;
      default:
        return <UserIcon size={16} color="#6B7280" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return '#DC2626';
      case 'inspector':
        return '#1E40AF';
      case 'owner':
        return '#059669';
      default:
        return '#6B7280';
    }
  };

  const getStatusColor = (status: 'active' | 'suspended') => {
    switch (status) {
      case 'active':
        return '#059669';
      case 'suspended':
        return '#DC2626';
      default:
        return '#6B7280';
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) {
      setError('Please fill in all required fields');
      return;
    }

    if (!validateEmail(newUser.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if email already exists
    const existingUser = users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (existingUser) {
      setError('A user with this email already exists');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create user object without ID and createdAt (will be set by the service)
      const userData = {
        name: newUser.name.trim(),
        email: newUser.email.toLowerCase().trim(),
        role: newUser.role,
        phone: newUser.phone.trim(),
        address: newUser.address.trim(),
        status: 'active' as 'active' | 'suspended',
      };

      let newUserRecord;
      
      try {
        // Try the regular addUser method first
        newUserRecord = await supabaseService.addUser(userData);
      } catch (error: any) {
        console.log('Regular addUser failed, trying createUserWithAuth...');
        
        // If that fails, try creating with auth
        if (error.message.includes('row-level security policy') || 
            error.message.includes('permission denied')) {
          newUserRecord = await supabaseService.createUserWithAuth(userData);
        } else {
          throw error;
        }
      }
      
      // Add to local state
      setUsers(prev => [newUserRecord, ...prev]);
      
      // Reset form
      setShowAddModal(false);
      setNewUser({
        name: '',
        email: '',
        role: 'owner',
        phone: '',
        address: '',
      });
      setError(null);
      
    } catch (error: any) {
      console.error('Error adding user:', error);
      setError(error.message || 'Failed to add user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser?.id) {
      setError('You cannot delete your own account');
      return;
    }

    // Check if current user is admin
    if (currentUser?.role !== 'admin') {
      setError('Only administrators can delete users');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Current user:', currentUser);
              console.log('Attempting to delete user:', user.id, user.name);
              await supabaseService.deleteUser(user.id);
              console.log('User deleted successfully from backend');
              // Remove from local state
              setUsers(prev => prev.filter(u => u.id !== user.id));
              Alert.alert('Success', `${user.name} has been deleted`);
            } catch (error: any) {
              console.error('Error deleting user:', error);
              setError(error.message || 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const handleSuspendUser = (user: User) => {
    if (user.id === currentUser?.id) {
      setError('You cannot suspend your own account');
      return;
    }

    const action = user.status === 'active' ? 'suspend' : 'activate';
    const newStatus = user.status === 'active' ? 'suspended' : 'active';

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action.charAt(0).toUpperCase() + action.slice(1), 
          style: action === 'suspend' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await supabaseService.updateUser(user.id, { status: newStatus });
              // Update local state
              setUsers(prev => prev.map(u => 
                u.id === user.id ? { ...u, status: newStatus } : u
              ));
              Alert.alert('Success', `${user.name} has been ${action}ed`);
            } catch (error: any) {
              console.error(`Error ${action}ing user:`, error);
              setError(error.message || `Failed to ${action} user`);
            }
          }
        }
      ]
    );
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUser({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      address: user.address || '',
      status: user.status,
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    if (!editUser.name || !editUser.email) {
      setError('Please fill in all required fields');
      return;
    }

    if (!validateEmail(editUser.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if email already exists (excluding current user)
    const existingUser = users.find(u => 
      u.email.toLowerCase() === editUser.email.toLowerCase() && u.id !== editingUser.id
    );
    if (existingUser) {
      setError('A user with this email already exists');
      return;
    }

    setIsEditing(true);
    try {
      await supabaseService.updateUser(editingUser.id, {
        name: editUser.name.trim(),
        email: editUser.email.toLowerCase().trim(),
        role: editUser.role,
        phone: editUser.phone.trim(),
        address: editUser.address.trim(),
        status: editUser.status,
      });

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === editingUser.id ? { ...u, ...editUser } : u
      ));

      setShowEditModal(false);
      setEditingUser(null);
      setError(null);
      Alert.alert('Success', 'User updated successfully');
      
    } catch (error: any) {
      console.error('Error updating user:', error);
      setError(error.message || 'Failed to update user. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleExportUsers = async () => {
    try {
      const csvContent = generateUsersCSV(users);
      const filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      if (Platform.OS === 'web') {
        downloadCSV(csvContent, filename);
        Alert.alert('Export Complete', 'Users data has been downloaded');
      } else {
        // For mobile, you would use expo-sharing
        Alert.alert('Export Complete', 'Users data has been prepared for sharing');
      }
    } catch (error) {
      setError('Failed to export users data');
    }
  };



  const generateUsersCSV = (users: User[]): string => {
    const headers = ['Name', 'Email', 'Role', 'Phone', 'Address', 'Created Date'];
    const rows = users.map(user => [
      user.name,
      user.email,
      user.role,
      user.phone || '',
      user.address || '',
      new Date(user.createdAt).toLocaleDateString()
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    if (Platform.OS !== 'web') return;
    
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone && user.phone.includes(searchQuery));
    
    const matchesFilter = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesFilter;
  });

  const getUserStats = () => {
    const total = users.length;
    const admins = users.filter(u => u.role === 'admin').length;
    const inspectors = users.filter(u => u.role === 'inspector').length;
    const owners = users.filter(u => u.role === 'owner').length;
    
    return { total, admins, inspectors, owners };
  };

  const stats = getUserStats();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>User Management</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E40AF" />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (databaseNotSetUp) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>User Management</Text>
          </View>
          <DatabaseSetupGuide onRetry={loadUsers} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>User Management</Text>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={handleExportUsers}
          >
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ErrorDisplay error={error} onDismiss={() => setError(null)} />

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Users size={20} color="#1E40AF" />
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            
            <View style={[styles.statCard, styles.adminCard]}>
              <Settings size={20} color="#DC2626" />
              <Text style={styles.statNumber}>{stats.admins}</Text>
              <Text style={styles.statLabel}>Admins</Text>
            </View>
            
            <View style={[styles.statCard, styles.inspectorCard]}>
              <Shield size={20} color="#1E40AF" />
              <Text style={styles.statNumber}>{stats.inspectors}</Text>
              <Text style={styles.statLabel}>Inspectors</Text>
            </View>
            
            <View style={[styles.statCard, styles.ownerCard]}>
              <Car size={20} color="#059669" />
              <Text style={styles.statNumber}>{stats.owners}</Text>
              <Text style={styles.statLabel}>Owners</Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email, or phone..."
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
                { key: 'all', label: 'All Users' },
                { key: 'admin', label: 'Admins' },
                { key: 'inspector', label: 'Inspectors' },
                { key: 'owner', label: 'Owners' },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterButton,
                    filterRole === filter.key && styles.activeFilterButton
                  ]}
                  onPress={() => setFilterRole(filter.key as any)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    filterRole === filter.key && styles.activeFilterButtonText
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Users List */}
        <ScrollView style={styles.usersList}>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <View style={[
                        styles.roleBadge,
                        { backgroundColor: `${getRoleColor(user.role)}20` }
                      ]}>
                        {getRoleIcon(user.role)}
                        <Text style={[
                          styles.roleText,
                          { color: getRoleColor(user.role) }
                        ]}>
                          {user.role.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.userDetails}>
                      <View style={styles.detailRow}>
                        <Mail size={14} color="#6B7280" />
                        <Text style={styles.detailText}>{user.email}</Text>
                      </View>
                      
                      {user.phone && (
                        <View style={styles.detailRow}>
                          <Phone size={14} color="#6B7280" />
                          <Text style={styles.detailText}>{user.phone}</Text>
                        </View>
                      )}
                      
                      {user.address && (
                        <View style={styles.detailRow}>
                          <MapPin size={14} color="#6B7280" />
                          <Text style={styles.detailText}>{user.address}</Text>
                        </View>
                      )}
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.joinedLabel}>
                          Joined: {new Date(user.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: `${getStatusColor(user.status)}20` }
                        ]}>
                          <View style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor(user.status) }
                          ]} />
                          <Text style={[
                            styles.statusText,
                            { color: getStatusColor(user.status) }
                          ]}>
                            {user.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {currentUser?.id !== user.id && (
                    <TouchableOpacity 
                      style={styles.menuButton}
                      onPress={() => {
                        // In a production app, this would show a context menu
                        console.log('User actions for:', user.name);
                      }}
                    >
                      <MoreVertical size={20} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                </View>

                {currentUser?.id !== user.id && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => handleEditUser(user)}
                    >
                      <Edit size={16} color="#1E40AF" />
                      <Text style={[styles.actionButtonText, { color: '#1E40AF' }]}>Edit</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteUser(user)}
                    >
                      <Trash2 size={16} color="#DC2626" />
                      <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>Delete</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, user.status === 'active' ? styles.suspendButton : styles.activateButton]}
                      onPress={() => handleSuspendUser(user)}
                    >
                      <UserX size={16} color={user.status === 'active' ? '#DC2626' : '#059669'} />
                      <Text style={[
                        styles.actionButtonText,
                        { color: user.status === 'active' ? '#DC2626' : '#059669' }
                      ]}>
                        {user.status === 'active' ? 'Suspend' : 'Activate'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Users size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No users found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || filterRole !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No users in the system'
                }
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Add User Modal */}
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
              <Text style={styles.modalTitle}>Add User</Text>
              <TouchableOpacity 
                onPress={handleAddUser}
                disabled={isSubmitting}
              >
                <Text style={[styles.saveButton, isSubmitting && styles.disabledButton]}>
                  {isSubmitting ? 'Adding...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <ErrorDisplay error={error} onDismiss={() => setError(null)} />
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newUser.name}
                  onChangeText={(text) => setNewUser({...newUser, name: text})}
                  placeholder="Enter full name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  value={newUser.email}
                  onChangeText={(text) => setNewUser({...newUser, email: text})}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Role *</Text>
                <View style={styles.roleOptions}>
                  {(['owner', 'inspector', 'admin'] as UserRole[]).map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleOption,
                        newUser.role === role && styles.selectedRole
                      ]}
                      onPress={() => setNewUser({...newUser, role})}
                    >
                      {getRoleIcon(role)}
                      <Text style={[
                        styles.roleOptionText,
                        newUser.role === role && styles.selectedRoleText
                      ]}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={newUser.phone}
                  onChangeText={(text) => setNewUser({...newUser, phone: text})}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={newUser.address}
                  onChangeText={(text) => setNewUser({...newUser, address: text})}
                  placeholder="Enter address"
                />
              </View>

              {isSubmitting && (
                <View style={styles.submittingContainer}>
                  <ActivityIndicator size="large" color="#1E40AF" />
                  <Text style={styles.submittingText}>Adding user...</Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Edit User Modal */}
        <Modal
          visible={showEditModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit User</Text>
              <TouchableOpacity 
                onPress={handleUpdateUser}
                disabled={isEditing}
              >
                <Text style={[styles.saveButton, isEditing && styles.disabledButton]}>
                  {isEditing ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <ErrorDisplay error={error} onDismiss={() => setError(null)} />
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={editUser.name}
                  onChangeText={(text) => setEditUser({...editUser, name: text})}
                  placeholder="Enter full name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  value={editUser.email}
                  onChangeText={(text) => setEditUser({...editUser, email: text})}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Role *</Text>
                <View style={styles.roleOptions}>
                  {(['owner', 'inspector', 'admin'] as UserRole[]).map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleOption,
                        editUser.role === role && styles.selectedRole
                      ]}
                      onPress={() => setEditUser({...editUser, role})}
                    >
                      {getRoleIcon(role)}
                      <Text style={[
                        styles.roleOptionText,
                        editUser.role === role && styles.selectedRoleText
                      ]}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={editUser.phone}
                  onChangeText={(text) => setEditUser({...editUser, phone: text})}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

                             <View style={styles.inputGroup}>
                 <Text style={styles.inputLabel}>Address</Text>
                 <TextInput
                   style={styles.input}
                   value={editUser.address}
                   onChangeText={(text) => setEditUser({...editUser, address: text})}
                   placeholder="Enter address"
                 />
               </View>

               <View style={styles.inputGroup}>
                 <Text style={styles.inputLabel}>Status *</Text>
                 <View style={styles.roleOptions}>
                   {(['active', 'suspended'] as const).map((status) => (
                     <TouchableOpacity
                       key={status}
                       style={[
                         styles.roleOption,
                         editUser.status === status && styles.selectedRole
                       ]}
                       onPress={() => setEditUser({...editUser, status})}
                     >
                       <View style={[
                         styles.statusDot,
                         { backgroundColor: getStatusColor(status) }
                       ]} />
                       <Text style={[
                         styles.roleOptionText,
                         editUser.status === status && styles.selectedRoleText
                       ]}>
                         {status.charAt(0).toUpperCase() + status.slice(1)}
                       </Text>
                     </TouchableOpacity>
                   ))}
                 </View>
               </View>

              {isEditing && (
                <View style={styles.submittingContainer}>
                  <ActivityIndicator size="large" color="#1E40AF" />
                  <Text style={styles.submittingText}>Saving changes...</Text>
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
  exportButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
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
  adminCard: {
    backgroundColor: '#FEF2F2',
  },
  inspectorCard: {
    backgroundColor: '#EBF4FF',
  },
  ownerCard: {
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
  usersList: {
    flex: 1,
  },
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    flex: 1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  userDetails: {
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
  joinedLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  menuButton: {
    padding: 8,
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  suspendButton: {
    backgroundColor: '#FEF2F2',
  },
  activateButton: {
    backgroundColor: '#F0FDF4',
  },
  editButton: {
    backgroundColor: '#EBF4FF',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  suspendButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
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
  roleOptions: {
    gap: 8,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    gap: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedRole: {
    backgroundColor: '#EBF4FF',
    borderColor: '#1E40AF',
  },
  roleOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  selectedRoleText: {
    color: '#1E40AF',
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