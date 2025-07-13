import { supabase } from '@/lib/supabase';

export async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test 0: Check if we can connect to Supabase at all
    console.log('Testing Supabase connection...');
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ Auth error:', authError);
      return { 
        success: false, 
        error: `Authentication error: ${authError.message}` 
      };
    }
    console.log('✅ Supabase connection working');
    
    // Test 1: Check if users table exists
    console.log('Testing users table access...');
    const { data: usersTest, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Users table error:', usersError);
      
      // Check if it's a "relation does not exist" error
      if (usersError.message.includes('relation "users" does not exist')) {
        return { 
          success: false, 
          error: 'Users table does not exist! Please run the database migration first. Copy the content from database-setup.sql and paste it into your Supabase SQL Editor.' 
        };
      }
      
      return { 
        success: false, 
        error: `Users table not accessible: ${usersError.message}. Please run the database migration first.` 
      };
    }
    
    console.log('✅ Users table accessible');
    
    // Test 2: Check if we can read users
    console.log('Testing user reading...');
    const { data: users, error: readError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (readError) {
      console.error('❌ Read users error:', readError);
      return { success: false, error: `Cannot read users: ${readError.message}` };
    }
    
    console.log('✅ Can read users:', users?.length || 0, 'users found');
    
    // Test 3: Check current user
    console.log('Testing current user...');
    if (authUser) {
      console.log('✅ Current auth user:', authUser.email);
      
      // Test 4: Check if current user exists in users table
      console.log('Testing user profile...');
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (profileError) {
        console.error('❌ User profile error:', profileError);
        return { 
          success: false, 
          error: `User profile not found: ${profileError.message}. You may need to create a user profile.` 
        };
      }
      
      console.log('✅ User profile found:', userProfile.role);
      
      return { 
        success: true, 
        message: `Database working! Found ${users?.length || 0} users. Your role: ${userProfile.role}` 
      };
    } else {
      return { 
        success: false, 
        error: 'No authenticated user found. Please log in first.' 
      };
    }
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
} 