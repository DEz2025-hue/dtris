import { supabaseService } from '@/utils/supabaseService';
import { User, Vehicle, Inspection } from '@/types';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          range: jest.fn(),
          order: jest.fn(),
        })),
        range: jest.fn(),
        order: jest.fn(),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}));

describe('SupabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should sign up a new user', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'owner' as const,
      };

      const mockAuthData = {
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      };

      require('@/lib/supabase').supabase.auth.signUp.mockResolvedValue(mockAuthData);

      const result = await supabaseService.signUp('test@example.com', 'password', mockUser);
      
      expect(result).toEqual(mockAuthData);
      expect(require('@/lib/supabase').supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        options: {
          data: mockUser,
        },
      });
    });

    it('should sign in a user', async () => {
      const mockAuthData = {
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      };

      require('@/lib/supabase').supabase.auth.signInWithPassword.mockResolvedValue(mockAuthData);

      const result = await supabaseService.signIn('test@example.com', 'password');
      
      expect(result).toEqual(mockAuthData);
      expect(require('@/lib/supabase').supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('should handle sign in errors', async () => {
      const mockError = new Error('Invalid credentials');
      require('@/lib/supabase').supabase.auth.signInWithPassword.mockRejectedValue(mockError);

      await expect(supabaseService.signIn('test@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('User Management', () => {
    it('should get current user', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'owner',
        created_at: '2024-01-01T00:00:00Z',
      };

      require('@/lib/supabase').supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      });

      require('@/lib/supabase').supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUser,
              error: null,
            }),
          })),
        })),
      });

      const result = await supabaseService.getCurrentUser();
      
      expect(result).toEqual({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'owner',
        phone: undefined,
        address: undefined,
        createdAt: new Date('2024-01-01T00:00:00Z'),
      });
    });

    it('should add a new user', async () => {
      const newUser = {
        email: 'new@example.com',
        name: 'New User',
        role: 'owner' as const,
        phone: '+1234567890',
        address: '123 Main St',
      };

      const mockDbUser = {
        id: '456',
        email: 'new@example.com',
        name: 'New User',
        role: 'owner',
        phone: '+1234567890',
        address: '123 Main St',
        created_at: '2024-01-01T00:00:00Z',
      };

      require('@/lib/supabase').supabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockDbUser,
              error: null,
            }),
          })),
        })),
      });

      const result = await supabaseService.addUser(newUser);
      
      expect(result).toEqual({
        id: '456',
        email: 'new@example.com',
        name: 'New User',
        role: 'owner',
        phone: '+1234567890',
        address: '123 Main St',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      });
    });
  });

  describe('Vehicle Management', () => {
    it('should get vehicles with pagination', async () => {
      const mockVehicles = [
        {
          id: '1',
          owner_id: '123',
          license_plate: 'ABC123',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          color: 'Blue',
          vin: 'VIN123',
          registration_date: '2024-01-01T00:00:00Z',
          expiration_date: '2025-01-01T00:00:00Z',
          status: 'active',
          barcode: 'BC123',
          created_at: '2024-01-01T00:00:00Z',
          vehicle_documents: [],
          inspections: [],
        },
      ];

      require('@/lib/supabase').supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          range: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({
              data: mockVehicles,
              error: null,
            }),
          })),
        })),
      });

      // Mock count query
      require('@/lib/supabase').supabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          count: 1,
          error: null,
        }),
      });

      const result = await supabaseService.getVehicles({ page: 1, pageSize: 20 });
      
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database connection failed');
      require('@/lib/supabase').supabase.auth.getUser.mockRejectedValue(mockError);

      await expect(supabaseService.getCurrentUser()).rejects.toThrow('Database connection failed');
    });

    it('should handle missing user profile', async () => {
      require('@/lib/supabase').supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      });

      require('@/lib/supabase').supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'User not found' },
            }),
          })),
        })),
      });

      await expect(supabaseService.getCurrentUser()).rejects.toThrow();
    });
  });
});