export type UserRole = 'owner' | 'inspector' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
  createdAt: Date;
  status: 'active' | 'suspended';
}

export interface Vehicle {
  id: string;
  ownerId: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  vin: string;
  registrationDate: Date;
  expirationDate: Date;
  status: 'active' | 'expired' | 'suspended';
  barcode: string;
  documents: VehicleDocument[];
  inspections: Inspection[];
}

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  type: 'insurance' | 'license' | 'registration' | 'other';
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  expirationDate?: Date;
  uploadedAt: Date;
}

export interface Inspection {
  id: string;
  vehicleId: string;
  inspectorId: string;
  inspectorName: string;
  date: Date;
  status: 'pass' | 'fail' | 'conditional';
  notes?: string;
  violations: string[];
  nextInspectionDue?: Date;
  location: string;
}

export interface Incident {
  id: string;
  vehicleId: string;
  reporterId: string;
  type: 'accident' | 'violation' | 'theft' | 'other';
  description: string;
  location: string;
  date: Date;
  photos?: string[];
  status: 'reported' | 'investigating' | 'resolved';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: Date;
  priority: 'low' | 'medium' | 'high';
  targetRole?: UserRole;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  vehicleId?: string;
  amount: number;
  type: 'registration' | 'inspection' | 'insurance' | 'fine';
  status: 'pending' | 'completed' | 'failed';
  date: Date;
  description: string;
}