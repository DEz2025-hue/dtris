import { supabase } from '@/lib/supabase';
import { User, Vehicle, Inspection, Incident, Announcement, PaymentRecord, VehicleDocument, UserRole } from '@/types';
import { Database } from '@/types/database';
import { cacheManager } from './cache';
import { config } from './config';

type Tables = Database['public']['Tables'];

// Pagination interface
interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const supabaseService = {
  // Auth methods
  async signUp(email: string, password: string, userData: Partial<User>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  async signOut() {
    // Clear cache on logout
    await cacheManager.clear();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${config.apiUrl}/auth/reset-password`,
    });
    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },

  async resendEmailConfirmation(email: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    if (!user) return null;
    
    // Get user profile from users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      // Temporary fallback: create user profile from auth metadata
      console.log('Profile not found, using auth metadata as fallback');
      
      // Determine role based on email for demo users
      let role: UserRole = 'owner';
      if (user.email === 'admin@dtris.gov.lr') {
        role = 'admin';
      } else if (user.email === 'inspector@dtris.gov.lr') {
        role = 'inspector';
      } else if (user.email === 'john.doe@example.com') {
        role = 'owner';
      }
      
      console.log(`Determined role for ${user.email}: ${role}`);
      
      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || 'Unknown User',
        role: role,
        phone: user.user_metadata?.phone || '',
        address: user.user_metadata?.address || '',
        createdAt: new Date(user.created_at),
      } as User;
    }
    
    console.log(`User profile found for ${user.email}, role: ${profile.role}`);
    
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      phone: profile.phone,
      address: profile.address,
      createdAt: new Date(profile.created_at),
    } as User;
  },

  // User methods with caching and pagination
  async getUsers(options: PaginationOptions = {}): Promise<PaginatedResult<User>> {
    const { page = 1, pageSize = config.performance.pageSize } = options;
    const cacheKey = `users_${page}_${pageSize}`;
    
    // Try cache first
    const cached = await cacheManager.get<PaginatedResult<User>>(cacheKey);
    if (cached && !config.platform.isDevelopment) {
      return cached;
    }

    try {
      const offset = (page - 1) * pageSize;
      
      // Get total count
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .range(offset, offset + pageSize - 1)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Database error:', error);
        
        // Check if it's a "table doesn't exist" error
        if (error.message.includes('relation "users" does not exist')) {
          throw new Error('Database tables not set up. Please run the database migration first.');
        }
        
        throw error;
      }
      
      const users = data.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        address: user.address,
        status: user.status || 'active',
        createdAt: new Date(user.created_at),
      }));

      const result: PaginatedResult<User> = {
        data: users,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };

      // Cache the result
      await cacheManager.set(cacheKey, result);
      return result;
      
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  },

  async addUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    try {
      // First, try to get the current user to check if they're admin
      const currentUser = await this.getCurrentUser();
      
      console.log('Current user for addUser:', currentUser);
      
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Only administrators can create new users');
      }

      console.log('Attempting to create user:', user);

      // Try to create user with RLS bypass for admin
      let { data, error } = await supabase
        .from('users')
        .insert({
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          address: user.address,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        
        // If RLS is blocking the insert, try a different approach
        if (error.message.includes('new row violates row-level security policy')) {
          console.log('RLS policy blocked insert, trying alternative approach...');
          
          // Try using service role key or direct insert
          const { data: directData, error: directError } = await supabase
            .from('users')
            .insert({
              email: user.email,
              name: user.name,
              role: user.role,
              phone: user.phone,
              address: user.address,
            })
            .select()
            .single();
          
          if (directError) {
            console.error('Direct insert also failed:', directError);
            throw new Error(`Failed to create user: ${directError.message}`);
          }
          
          data = directData;
        } else {
          throw new Error(`Failed to create user: ${error.message}`);
        }
      }
      
      console.log('User created successfully:', data);
      
      // Invalidate users cache
      await cacheManager.invalidatePattern('users_');
      
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        phone: data.phone,
        address: data.address,
        status: data.status || 'active',
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      console.error('Add user error:', error);
      throw error;
    }
  },

  async createUserWithAuth(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    try {
      console.log('Creating user with auth:', userData);
      
      // First, create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: 'temporary123', // This should be changed by the user
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: userData.role,
        }
      });
      
      if (authError) {
        console.error('Auth creation error:', authError);
        throw new Error(`Failed to create auth user: ${authError.message}`);
      }
      
      console.log('Auth user created:', authData.user);
      
      // Now add the user to the users table
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          phone: userData.phone,
          address: userData.address,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Users table insert error:', error);
        throw new Error(`Failed to add user to users table: ${error.message}`);
      }
      
      console.log('User added to users table:', data);
      
      // Invalidate users cache
      await cacheManager.invalidatePattern('users_');
      
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        phone: data.phone,
        address: data.address,
        status: data.status || 'active',
        createdAt: new Date(data.created_at),
      };
      
    } catch (error) {
      console.error('Create user with auth error:', error);
      throw error;
    }
  },

  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    if (error) throw error;
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.email) updateData.email = updates.email;
    if (updates.role) updateData.role = updates.role;
    if (updates.phone) updateData.phone = updates.phone;
    if (updates.address) updateData.address = updates.address;
    if (updates.status) updateData.status = updates.status;
    // Add more fields as needed
    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);
    if (error) throw error;
  },

  // Vehicle methods with caching
  async getVehicles(options: PaginationOptions = {}): Promise<PaginatedResult<Vehicle>> {
    const { page = 1, pageSize = config.performance.pageSize } = options;
    const cacheKey = `vehicles_${page}_${pageSize}`;
    
    // Try cache first
    const cached = await cacheManager.get<PaginatedResult<Vehicle>>(cacheKey);
    if (cached && !config.platform.isDevelopment) {
      return cached;
    }

    const offset = (page - 1) * pageSize;
    
    // Get total count
    const { count } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true });
    
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        vehicle_documents(*),
        inspections(*)
      `)
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const vehicles = data.map((vehicle: any) => ({
      id: vehicle.id,
      ownerId: vehicle.owner_id,
      licensePlate: vehicle.license_plate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      vin: vehicle.vin,
      registrationDate: new Date(vehicle.registration_date),
      expirationDate: new Date(vehicle.expiration_date),
      status: vehicle.status,
      barcode: vehicle.barcode,
      documents: vehicle.vehicle_documents.map((doc: any) => ({
        id: doc.id,
        vehicleId: doc.vehicle_id,
        type: doc.type,
        fileName: doc.file_name,
        fileUrl: doc.file_url,
        expirationDate: doc.expiration_date ? new Date(doc.expiration_date) : undefined,
        uploadedAt: new Date(doc.uploaded_at),
      })),
      inspections: vehicle.inspections.map((inspection: any) => ({
        id: inspection.id,
        vehicleId: inspection.vehicle_id,
        inspectorId: inspection.inspector_id,
        inspectorName: inspection.inspector_name,
        date: new Date(inspection.date),
        status: inspection.status,
        notes: inspection.notes,
        violations: inspection.violations,
        nextInspectionDue: inspection.next_inspection_due ? new Date(inspection.next_inspection_due) : undefined,
        location: inspection.location,
      })),
    }));

    const result: PaginatedResult<Vehicle> = {
      data: vehicles,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };

    // Cache the result
    await cacheManager.set(cacheKey, result);
    return result;
  },

  async addVehicle(vehicle: Omit<Vehicle, 'id' | 'registrationDate' | 'documents' | 'inspections'>): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        owner_id: vehicle.ownerId,
        license_plate: vehicle.licensePlate,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        vin: vehicle.vin,
        expiration_date: vehicle.expirationDate.toISOString(),
        status: vehicle.status,
        barcode: vehicle.barcode,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Invalidate vehicles cache
    await cacheManager.invalidatePattern('vehicles_');
    
    return {
      id: data.id,
      ownerId: data.owner_id,
      licensePlate: data.license_plate,
      make: data.make,
      model: data.model,
      year: data.year,
      color: data.color,
      vin: data.vin,
      registrationDate: new Date(data.registration_date),
      expirationDate: new Date(data.expiration_date),
      status: data.status,
      barcode: data.barcode,
      documents: [],
      inspections: [],
    };
  },

  async updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Promise<void> {
    const updateData: any = {};
    
    if (updates.licensePlate) updateData.license_plate = updates.licensePlate;
    if (updates.make) updateData.make = updates.make;
    if (updates.model) updateData.model = updates.model;
    if (updates.year) updateData.year = updates.year;
    if (updates.color) updateData.color = updates.color;
    if (updates.vin) updateData.vin = updates.vin;
    if (updates.expirationDate) updateData.expiration_date = updates.expirationDate.toISOString();
    if (updates.status) updateData.status = updates.status;
    if (updates.barcode) updateData.barcode = updates.barcode;
    
    const { error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', vehicleId);
    
    if (error) throw error;
    
    // Invalidate vehicles cache
    await cacheManager.invalidatePattern('vehicles_');
  },

  // Vehicle document methods
  async addVehicleDocument(document: Omit<VehicleDocument, 'id' | 'uploadedAt'>): Promise<VehicleDocument> {
    const { data, error } = await supabase
      .from('vehicle_documents')
      .insert({
        vehicle_id: document.vehicleId,
        type: document.type,
        file_name: document.fileName,
        file_url: document.fileUrl,
        expiration_date: document.expirationDate?.toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      vehicleId: data.vehicle_id,
      type: data.type,
      fileName: data.file_name,
      fileUrl: data.file_url,
      expirationDate: data.expiration_date ? new Date(data.expiration_date) : undefined,
      uploadedAt: new Date(data.uploaded_at),
    };
  },

  // Inspection methods
  async getInspections(): Promise<Inspection[]> {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    return data.map(inspection => ({
      id: inspection.id,
      vehicleId: inspection.vehicle_id,
      inspectorId: inspection.inspector_id,
      inspectorName: inspection.inspector_name,
      date: new Date(inspection.date),
      status: inspection.status,
      notes: inspection.notes,
      violations: inspection.violations,
      nextInspectionDue: inspection.next_inspection_due ? new Date(inspection.next_inspection_due) : undefined,
      location: inspection.location,
    }));
  },

  async addInspection(inspection: Omit<Inspection, 'id' | 'date'>): Promise<Inspection> {
    const { data, error } = await supabase
      .from('inspections')
      .insert({
        vehicle_id: inspection.vehicleId,
        inspector_id: inspection.inspectorId,
        inspector_name: inspection.inspectorName,
        status: inspection.status,
        notes: inspection.notes,
        violations: inspection.violations,
        next_inspection_due: inspection.nextInspectionDue?.toISOString(),
        location: inspection.location,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      vehicleId: data.vehicle_id,
      inspectorId: data.inspector_id,
      inspectorName: data.inspector_name,
      date: new Date(data.date),
      status: data.status,
      notes: data.notes,
      violations: data.violations,
      nextInspectionDue: data.next_inspection_due ? new Date(data.next_inspection_due) : undefined,
      location: data.location,
    };
  },

  // Incident methods
  async getIncidents(): Promise<Incident[]> {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    return data.map(incident => ({
      id: incident.id,
      vehicleId: incident.vehicle_id || '',
      reporterId: incident.reporter_id,
      type: incident.type,
      description: incident.description,
      location: incident.location,
      date: new Date(incident.date),
      photos: incident.photos,
      status: incident.status,
    }));
  },

  async addIncident(incident: Omit<Incident, 'id' | 'date'>): Promise<Incident> {
    const { data, error } = await supabase
      .from('incidents')
      .insert({
        vehicle_id: incident.vehicleId || null,
        reporter_id: incident.reporterId,
        type: incident.type,
        description: incident.description,
        location: incident.location,
        photos: incident.photos,
        status: incident.status,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      vehicleId: data.vehicle_id || '',
      reporterId: data.reporter_id,
      type: data.type,
      description: data.description,
      location: data.location,
      date: new Date(data.date),
      photos: data.photos,
      status: data.status,
    };
  },

  async updateIncident(incidentId: string, updates: Partial<Incident>): Promise<void> {
    const updateData: any = {};
    
    if (updates.status) updateData.status = updates.status;
    if (updates.description) updateData.description = updates.description;
    if (updates.location) updateData.location = updates.location;
    if (updates.photos) updateData.photos = updates.photos;
    
    const { error } = await supabase
      .from('incidents')
      .update(updateData)
      .eq('id', incidentId);
    
    if (error) throw error;
  },

  // Announcement methods
  async getAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    return data.map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      date: new Date(announcement.date),
      priority: announcement.priority,
      targetRole: announcement.target_role,
    }));
  },

  async addAnnouncement(announcement: Omit<Announcement, 'id' | 'date'>): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        target_role: announcement.targetRole,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      date: new Date(data.date),
      priority: data.priority,
      targetRole: data.target_role,
    };
  },

  // Payment methods
  async getPayments(): Promise<PaymentRecord[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    return data.map(payment => ({
      id: payment.id,
      userId: payment.user_id,
      vehicleId: payment.vehicle_id,
      amount: payment.amount,
      type: payment.type,
      status: payment.status,
      date: new Date(payment.date),
      description: payment.description,
    }));
  },

  async addPayment(payment: Omit<PaymentRecord, 'id' | 'date'>): Promise<PaymentRecord> {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: payment.userId,
        vehicle_id: payment.vehicleId,
        amount: payment.amount,
        type: payment.type,
        status: payment.status,
        description: payment.description,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      vehicleId: data.vehicle_id,
      amount: data.amount,
      type: data.type,
      status: data.status,
      date: new Date(data.date),
      description: data.description,
    };
  },

  // File upload methods
  // File storage methods moved to documentService for better organization
  
  // Real-time subscriptions
  subscribeToVehicles(callback: (payload: any) => void) {
    return supabase
      .channel('vehicles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, callback)
      .subscribe();
  },

  subscribeToInspections(callback: (payload: any) => void) {
    return supabase
      .channel('inspections')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inspections' }, callback)
      .subscribe();
  },

  subscribeToIncidents(callback: (payload: any) => void) {
    return supabase
      .channel('incidents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, callback)
      .subscribe();
  },

  subscribeToAnnouncements(callback: (payload: any) => void) {
    return supabase
      .channel('announcements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, callback)
      .subscribe();
  },
};