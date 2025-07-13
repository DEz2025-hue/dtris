require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if credentials are available
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please set the following environment variables:');
  console.error('- EXPO_PUBLIC_SUPABASE_URL (your Supabase project URL)');
  console.error('- SUPABASE_SERVICE_ROLE_KEY (your service role key from Supabase Dashboard)');
  console.error('');
  console.error('You can get these from your Supabase Dashboard:');
  console.error('1. Go to Settings > API');
  console.error('2. Copy the Project URL and Service Role Key');
  console.error('');
  console.error('Then run:');
  console.error('$env:EXPO_PUBLIC_SUPABASE_URL="your-url"');
  console.error('$env:SUPABASE_SERVICE_ROLE_KEY="your-service-key"');
  console.error('node scripts/add-demo-users.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const demoUsers = [
  {
    email: 'john.doe@example.com',
    password: 'demo123',
    user_metadata: {
      name: 'John Doe',
      role: 'owner'
    },
    email_confirm: true
  },
  {
    email: 'inspector@dtris.gov.lr',
    password: 'demo123',
    user_metadata: {
      name: 'Moses Kargbo',
      role: 'inspector'
    },
    email_confirm: true
  },
  {
    email: 'admin@dtris.gov.lr',
    password: 'demo123',
    user_metadata: {
      name: 'Sarah Johnson',
      role: 'admin'
    },
    email_confirm: true
  }
];

async function addDemoUsers() {
  console.log('🔧 Adding demo users to Supabase Auth...');
  console.log(`📡 Connecting to: ${supabaseUrl}`);
  console.log('');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const user of demoUsers) {
    try {
      console.log(`👤 Creating user: ${user.email} (${user.user_metadata.role})`);
      
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        user_metadata: user.user_metadata,
        email_confirm: user.email_confirm
      });
      
      if (error) {
        console.error(`❌ Error creating user ${user.email}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Successfully created user: ${user.email}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error.message);
      errorCount++;
    }
    
    console.log(''); // Add spacing between users
  }
  
  console.log('📊 Summary:');
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`❌ Errors: ${errorCount} users`);
  console.log('');
  
  if (successCount > 0) {
    console.log('🎉 Demo users setup complete!');
    console.log('You can now log in with any of the demo accounts.');
  } else {
    console.log('⚠️  No users were created. Please check your credentials and try again.');
  }
}

// Run the script
addDemoUsers().catch(console.error);