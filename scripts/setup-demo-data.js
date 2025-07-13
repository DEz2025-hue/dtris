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

const demoUsers = [
  {
    email: 'john.doe@example.com',
    password: 'demo123',
    user_metadata: {
      name: 'John Doe',
      role: 'owner',
      phone: '+231-777-123-456',
      address: 'Monrovia, Liberia'
    },
    email_confirm: true
  },
  {
    email: 'inspector@dtris.gov.lr',
    password: 'demo123',
    user_metadata: {
      name: 'Moses Kargbo',
      role: 'inspector',
      phone: '+231-888-234-567',
      address: 'Paynesville, Liberia'
    },
    email_confirm: true
  },
  {
    email: 'admin@dtris.gov.lr',
    password: 'demo123',
    user_metadata: {
      name: 'Sarah Johnson',
      role: 'admin',
      phone: '+231-777-345-678',
      address: 'Capitol Hill, Monrovia'
    },
    email_confirm: true
  }
];

const demoAnnouncements = [
  {
    title: 'New Digital Inspection System Launch',
    content: 'The Ministry of Transport is pleased to announce the launch of our new digital vehicle inspection system. All vehicle owners and inspectors are encouraged to familiarize themselves with the new process.',
    priority: 'high',
    target_role: null
  },
  {
    title: 'Inspection Reminder',
    content: 'Vehicle inspections are due every 12 months. Please ensure your vehicle inspection is up to date to avoid penalties.',
    priority: 'medium',
    target_role: 'owner'
  },
  {
    title: 'Inspector Training Schedule',
    content: 'New inspector training sessions will be held every first Monday of the month. Please contact the administration for registration.',
    priority: 'medium',
    target_role: 'inspector'
  }
];

async function setupDemoData() {
  console.log('🔧 Setting up demo data for ClaMax DTRIS...');
  console.log(`📡 Connecting to: ${supabaseUrl}`);
  console.log('');
  
  let successCount = 0;
  let errorCount = 0;
  
  // Create demo users
  console.log('👥 Creating demo users...');
  for (const user of demoUsers) {
    try {
      console.log(`👤 Creating user: ${user.email} (${user.user_metadata.role})`);
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        user_metadata: user.user_metadata,
        email_confirm: user.email_confirm
      });
      
      if (authError) {
        console.error(`❌ Error creating auth user ${user.email}:`, authError.message);
        errorCount++;
        continue;
      }
      
      // Create user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: user.email,
          name: user.user_metadata.name,
          role: user.user_metadata.role,
          phone: user.user_metadata.phone,
          address: user.user_metadata.address
        });
      
      if (profileError) {
        console.error(`❌ Error creating user profile ${user.email}:`, profileError.message);
        errorCount++;
      } else {
        console.log(`✅ Successfully created user: ${user.email}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error.message);
      errorCount++;
    }
    
    console.log('');
  }
  
  // Create demo announcements
  console.log('📢 Creating demo announcements...');
  for (const announcement of demoAnnouncements) {
    try {
      const { error } = await supabase
        .from('announcements')
        .insert(announcement);
      
      if (error) {
        console.error(`❌ Error creating announcement "${announcement.title}":`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Successfully created announcement: "${announcement.title}"`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Error creating announcement "${announcement.title}":`, error.message);
      errorCount++;
    }
  }
  
  console.log('');
  console.log('📊 Summary:');
  console.log(`✅ Successfully created: ${successCount} items`);
  console.log(`❌ Errors: ${errorCount} items`);
  console.log('');
  
  if (successCount > 0) {
    console.log('🎉 Demo data setup complete!');
    console.log('You can now log in with any of the demo accounts:');
    console.log('');
    demoUsers.forEach(user => {
      console.log(`${user.user_metadata.role.toUpperCase()}: ${user.email} / ${user.password}`);
    });
  } else {
    console.log('⚠️  No data was created. Please check your credentials and try again.');
  }
}

// Run the script
setupDemoData().catch(console.error);