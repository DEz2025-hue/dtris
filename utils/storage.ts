// Legacy storage service - kept for reference during migration
// This file will be deprecated once all components are migrated to supabaseService

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Vehicle, Inspection, Incident, Announcement, PaymentRecord } from '@/types';

// Mock data for development/testing
const mockUsers: User[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'john.doe@example.com',
    name: 'John Doe',
    role: 'owner',
    phone: '+231-777-123-456',
    address: 'Monrovia, Liberia',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'inspector@dtris.gov.lr',
    name: 'Moses Kargbo',
    role: 'inspector',
    phone: '+231-888-234-567',
    address: 'Paynesville, Liberia',
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'admin@dtris.gov.lr',
    name: 'Sarah Johnson',
    role: 'admin',
    phone: '+231-999-345-678',
    address: 'Capitol Hill, Monrovia',
    createdAt: new Date('2024-01-05'),
  },
];

const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'New Digital Inspection System Launch',
    content: 'The Ministry of Transport is pleased to announce the launch of our new digital vehicle inspection system. All vehicle owners and inspectors are encouraged to familiarize themselves with the new process.',
    date: new Date('2024-02-01'),
    priority: 'high',
  },
  {
    id: '2',
    title: 'Inspection Reminder',
    content: 'Vehicle inspections are due every 12 months. Please ensure your vehicle inspection is up to date to avoid penalties.',
    date: new Date('2024-02-15'),
    priority: 'medium',
    targetRole: 'owner',
  },
];

export const storageService = {
  // Legacy methods - use supabaseService instead
  async initializeData(): Promise<void> {
    console.warn('storageService.initializeData is deprecated. Use supabaseService instead.');
  },

  async getUsers(): Promise<User[]> {
    console.warn('storageService.getUsers is deprecated. Use supabaseService.getUsers instead.');
    return mockUsers;
  },

  async addUser(user: User): Promise<void> {
    console.warn('storageService.addUser is deprecated. Use supabaseService.addUser instead.');
  },

  async getVehicles(): Promise<Vehicle[]> {
    console.warn('storageService.getVehicles is deprecated. Use supabaseService.getVehicles instead.');
    return [];
  },

  async addVehicle(vehicle: Vehicle): Promise<void> {
    console.warn('storageService.addVehicle is deprecated. Use supabaseService.addVehicle instead.');
  },

  async updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Promise<void> {
    console.warn('storageService.updateVehicle is deprecated. Use supabaseService.updateVehicle instead.');
  },

  async getInspections(): Promise<Inspection[]> {
    console.warn('storageService.getInspections is deprecated. Use supabaseService.getInspections instead.');
    return [];
  },

  async addInspection(inspection: Inspection): Promise<void> {
    console.warn('storageService.addInspection is deprecated. Use supabaseService.addInspection instead.');
  },

  async getIncidents(): Promise<Incident[]> {
    console.warn('storageService.getIncidents is deprecated. Use supabaseService.getIncidents instead.');
    return [];
  },

  async addIncident(incident: Incident): Promise<void> {
    console.warn('storageService.addIncident is deprecated. Use supabaseService.addIncident instead.');
  },

  async getAnnouncements(): Promise<Announcement[]> {
    console.warn('storageService.getAnnouncements is deprecated. Use supabaseService.getAnnouncements instead.');
    return mockAnnouncements;
  },

  async getPayments(): Promise<PaymentRecord[]> {
    console.warn('storageService.getPayments is deprecated. Use supabaseService.getPayments instead.');
    return [];
  },

  async addPayment(payment: PaymentRecord): Promise<void> {
    console.warn('storageService.addPayment is deprecated. Use supabaseService.addPayment instead.');
  },

  async updateItem(table: string, id: string, updates: any): Promise<void> {
    console.warn('storageService.updateItem is deprecated. Use specific supabaseService methods instead.');
  },
};