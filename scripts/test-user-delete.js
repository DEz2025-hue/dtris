const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUserDelete() {
  try {
    console.log('Testing user delete functionality...');

    // First, sign in as admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@dtris.gov.lr',
      password: 'demo123'
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('✅ Signed in as admin');

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error getting user:', userError);
      return;
    }

    console.log('Current user:', user.email);

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error getting profile:', profileError);
      return;
    }

    console.log('User role:', profile.role);

    // List all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.error('Error getting users:', usersError);
      return;
    }

    console.log('Total users:', users.length);
    console.log('Users:', users.map(u => ({ id: u.id, name: u.name, role: u.role, status: u.status })));

    // Try to delete a test user (not the current user)
    const testUser = users.find(u => u.id !== user.id);
    if (testUser) {
      console.log('Attempting to delete user:', testUser.name);
      
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', testUser.id);

      if (deleteError) {
        console.error('Delete error:', deleteError);
      } else {
        console.log('✅ User deleted successfully');
      }
    } else {
      console.log('No test user found to delete');
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

testUserDelete(); 