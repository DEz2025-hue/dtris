require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdminUser() {
  console.log('🔧 Fixing admin user profile...');
  
  try {
    // First, get the admin user from auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      return;
    }
    
    const adminUser = users.find(u => u.email === 'admin@dtris.gov.lr');
    
    if (!adminUser) {
      console.error('❌ Admin user not found in auth');
      return;
    }
    
    console.log('✅ Found admin user in auth:', adminUser.id);
    
    // Check if user profile exists in users table
    const { data: existingProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', adminUser.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error checking user profile:', profileError.message);
      return;
    }
    
    if (existingProfile) {
      console.log('✅ Admin user profile already exists');
      console.log('Profile data:', existingProfile);
      return;
    }
    
    // Create user profile in users table
    const { data: newProfile, error: createError } = await supabase
      .from('users')
      .insert({
        id: adminUser.id,
        email: adminUser.email,
        name: 'Sarah Johnson',
        role: 'admin',
        phone: '+231-999-345-678',
        address: 'Capitol Hill, Monrovia'
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating user profile:', createError.message);
      return;
    }
    
    console.log('✅ Successfully created admin user profile:');
    console.log(newProfile);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

fixAdminUser().catch(console.error); 