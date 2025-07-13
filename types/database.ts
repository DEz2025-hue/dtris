export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'owner' | 'inspector' | 'admin'
          phone: string | null
          address: string | null
          created_at: string
          updated_at: string
          status: 'active' | 'suspended'
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: 'owner' | 'inspector' | 'admin'
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
          status?: 'active' | 'suspended'
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'owner' | 'inspector' | 'admin'
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
          status?: 'active' | 'suspended'
        }
      }
      vehicles: {
        Row: {
          id: string
          owner_id: string
          license_plate: string
          make: string
          model: string
          year: number
          color: string
          vin: string
          registration_date: string
          expiration_date: string
          status: 'active' | 'expired' | 'suspended'
          barcode: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          license_plate: string
          make: string
          model: string
          year: number
          color: string
          vin: string
          registration_date?: string
          expiration_date: string
          status?: 'active' | 'expired' | 'suspended'
          barcode: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          license_plate?: string
          make?: string
          model?: string
          year?: number
          color?: string
          vin?: string
          registration_date?: string
          expiration_date?: string
          status?: 'active' | 'expired' | 'suspended'
          barcode?: string
          created_at?: string
          updated_at?: string
        }
      }
      vehicle_documents: {
        Row: {
          id: string
          vehicle_id: string
          type: 'insurance' | 'license' | 'registration' | 'other'
          file_name: string
          file_url: string
          expiration_date: string | null
          uploaded_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          type: 'insurance' | 'license' | 'registration' | 'other'
          file_name: string
          file_url: string
          expiration_date?: string | null
          uploaded_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          type?: 'insurance' | 'license' | 'registration' | 'other'
          file_name?: string
          file_url?: string
          expiration_date?: string | null
          uploaded_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      inspections: {
        Row: {
          id: string
          vehicle_id: string
          inspector_id: string
          inspector_name: string
          date: string
          status: 'pass' | 'fail' | 'conditional'
          notes: string | null
          violations: string[]
          next_inspection_due: string | null
          location: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          inspector_id: string
          inspector_name: string
          date?: string
          status: 'pass' | 'fail' | 'conditional'
          notes?: string | null
          violations?: string[]
          next_inspection_due?: string | null
          location: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          inspector_id?: string
          inspector_name?: string
          date?: string
          status?: 'pass' | 'fail' | 'conditional'
          notes?: string | null
          violations?: string[]
          next_inspection_due?: string | null
          location?: string
          created_at?: string
          updated_at?: string
        }
      }
      incidents: {
        Row: {
          id: string
          vehicle_id: string | null
          reporter_id: string
          type: 'accident' | 'violation' | 'theft' | 'other'
          description: string
          location: string
          date: string
          photos: string[]
          status: 'reported' | 'investigating' | 'resolved'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id?: string | null
          reporter_id: string
          type: 'accident' | 'violation' | 'theft' | 'other'
          description: string
          location: string
          date?: string
          photos?: string[]
          status?: 'reported' | 'investigating' | 'resolved'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string | null
          reporter_id?: string
          type?: 'accident' | 'violation' | 'theft' | 'other'
          description?: string
          location?: string
          date?: string
          photos?: string[]
          status?: 'reported' | 'investigating' | 'resolved'
          created_at?: string
          updated_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          date: string
          priority: 'low' | 'medium' | 'high'
          target_role: 'owner' | 'inspector' | 'admin' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          date?: string
          priority?: 'low' | 'medium' | 'high'
          target_role?: 'owner' | 'inspector' | 'admin' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          date?: string
          priority?: 'low' | 'medium' | 'high'
          target_role?: 'owner' | 'inspector' | 'admin' | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          vehicle_id: string | null
          amount: number
          type: 'registration' | 'inspection' | 'insurance' | 'fine'
          status: 'pending' | 'completed' | 'failed'
          date: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vehicle_id?: string | null
          amount: number
          type: 'registration' | 'inspection' | 'insurance' | 'fine'
          status?: 'pending' | 'completed' | 'failed'
          date?: string
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          vehicle_id?: string | null
          amount?: number
          type?: 'registration' | 'inspection' | 'insurance' | 'fine'
          status?: 'pending' | 'completed' | 'failed'
          date?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'owner' | 'inspector' | 'admin'
      vehicle_status: 'active' | 'expired' | 'suspended'
      document_type: 'insurance' | 'license' | 'registration' | 'other'
      inspection_status: 'pass' | 'fail' | 'conditional'
      incident_type: 'accident' | 'violation' | 'theft' | 'other'
      incident_status: 'reported' | 'investigating' | 'resolved'
      payment_type: 'registration' | 'inspection' | 'insurance' | 'fine'
      payment_status: 'pending' | 'completed' | 'failed'
      priority_level: 'low' | 'medium' | 'high'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}