import { supabaseService } from './supabaseService';
import { config } from './config';

interface TestUser {
  email: string;
  password: string;
  name: string;
  role: 'owner' | 'inspector' | 'admin';
  phone?: string;
  address?: string;
}

const testUsers: TestUser[] = [
  {
    email: 'john.doe@example.com',
    password: 'demo123',
    name: 'John Doe',
    role: 'owner',
    phone: '+231-777-123-456',
    address: 'Monrovia, Liberia'
  },
  {
    email: 'inspector@dtris.gov.lr',
    password: 'demo123',
    name: 'Moses Kargbo',
    role: 'inspector',
    phone: '+231-888-234-567',
    address: 'Paynesville, Liberia'
  },
  {
    email: 'admin@dtris.gov.lr',
    password: 'demo123',
    name: 'Sarah Johnson',
    role: 'admin',
    phone: '+231-999-345-678',
    address: 'Capitol Hill, Monrovia'
  }
];

export const createTestUsers = async (): Promise<{ success: number; errors: string[] }> => {
  // Only allow in development environment
  if (config.platform.isProduction) {
    throw new Error('Test user creation is not allowed in production environment');
  }

  let successCount = 0;
  const errors: string[] = [];

  console.log('🔧 Creating test users for role testing...');

  for (const testUser of testUsers) {
    try {
      console.log(`👤 Creating user: ${testUser.email} (${testUser.role})`);

      // First, try to sign up the user
      const authResult = await supabaseService.signUp(testUser.email, testUser.password, {
        name: testUser.name,
        role: testUser.role,
        phone: testUser.phone,
        address: testUser.address,
      });

      if (authResult.user) {
        // Create user profile in users table
        await supabaseService.addUser({
          email: testUser.email,
          name: testUser.name,
          role: testUser.role,
          phone: testUser.phone,
          address: testUser.address,
        });

        console.log(`✅ Successfully created user: ${testUser.email}`);
        successCount++;
      } else {
        const errorMsg = `Failed to create auth user for ${testUser.email}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = `Error creating user ${testUser.email}: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
      
      // If user already exists in auth, try to create profile anyway
      if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
        try {
          await supabaseService.addUser({
            email: testUser.email,
            name: testUser.name,
            role: testUser.role,
            phone: testUser.phone,
            address: testUser.address,
          });
          console.log(`✅ User profile created for existing auth user: ${testUser.email}`);
          successCount++;
        } catch (profileError: any) {
          console.error(`❌ Failed to create profile for ${testUser.email}: ${profileError.message}`);
        }
      }
    }
  }

  console.log(`📊 Summary: ${successCount} users created successfully, ${errors.length} errors`);
  return { success: successCount, errors };
};

export const getTestCredentials = (): TestUser[] => {
  return testUsers;
};

// Development-only function to clean up test users
export const cleanupTestUsers = async (): Promise<void> => {
  if (config.platform.isProduction) {
    throw new Error('Test user cleanup is not allowed in production environment');
  }

  console.log('🧹 Cleaning up test users...');
  
  for (const testUser of testUsers) {
    try {
      // Note: This would require admin privileges to delete auth users
      // For now, we'll just log what would be cleaned up
      console.log(`Would clean up user: ${testUser.email}`);
    } catch (error: any) {
      console.error(`Error cleaning up ${testUser.email}: ${error.message}`);
    }
  }
};