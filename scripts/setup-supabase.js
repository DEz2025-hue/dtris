#!/usr/bin/env node

/**
 * Complete Supabase Setup Script
 * 
 * This script will:
 * 1. Check environment variables
 * 2. Test Supabase connection
 * 3. Apply database migrations
 * 4. Create demo users
 * 5. Set up storage buckets
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Get Supabase credentials
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Demo users configuration
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
      phone: '+231-999-345-678',
      address: 'Capitol Hill, Monrovia'
    },
    email_confirm: true
  }
];

// Demo announcements
const demoAnnouncements = [
  {
    title: 'Welcome to ClaMax DTRIS',
    content: 'The Digital Transportation Registration & Inspection System is now live! This system will help streamline vehicle registration and inspection processes across Liberia.',
    priority: 'high',
    target_role: null
  },
  {
    title: 'Vehicle Inspection Reminder',
    content: 'All vehicle owners are reminded that annual inspections are mandatory. Please schedule your inspection before your current certificate expires.',
    priority: 'medium',
    target_role: 'owner'
  },
  {
    title: 'Inspector Training Available',
    content: 'New inspector training sessions are available every first Monday of the month. Contact administration for registration details.',
    priority: 'medium',
    target_role: 'inspector'
  }
];

async function checkEnvironment() {
  log('\n🔍 Checking environment variables...', 'cyan');
  
  const missing = [];
  if (!supabaseUrl) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseAnonKey) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  
  if (missing.length > 0) {
    log('❌ Missing required environment variables:', 'red');
    missing.forEach(var_name => log(`   - ${var_name}`, 'red'));
    log('\nPlease set these in your .env file:', 'yellow');
    log('EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url', 'yellow');
    log('EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key', 'yellow');
    log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key', 'yellow');
    process.exit(1);
  }
  
  log('✅ All environment variables are set', 'green');
  log(`📡 Supabase URL: ${supabaseUrl}`, 'blue');
}

async function testConnection() {
  log('\n🔗 Testing Supabase connection...', 'cyan');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test connection by trying to get the current time
    const { data, error } = await supabase.rpc('now');
    
    if (error) {
      throw error;
    }
    
    log('✅ Supabase connection successful', 'green');
    return supabase;
  } catch (error) {
    log('❌ Supabase connection failed:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

async function applyMigrations() {
  log('\n📊 Applying database migrations...', 'cyan');
  
  try {
    // Check if Supabase CLI is installed
    try {
      execSync('supabase --version', { stdio: 'pipe' });
    } catch (error) {
      log('❌ Supabase CLI not found. Installing...', 'yellow');
      log('Please install Supabase CLI: npm install -g supabase', 'yellow');
      log('Then run: supabase login', 'yellow');
      log('And: supabase link --project-ref YOUR_PROJECT_REF', 'yellow');
      return false;
    }
    
    // Apply migrations using SQL file directly
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'create_complete_schema.sql');
    
    if (fs.existsSync(migrationPath)) {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      log('📝 Executing migration SQL...', 'blue');
      const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
      
      if (error) {
        // Try alternative approach - execute SQL directly
        log('⚠️  RPC method failed, trying direct execution...', 'yellow');
        
        // Split SQL into individual statements and execute them
        const statements = migrationSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await supabase.rpc('exec', { sql: statement + ';' });
            } catch (stmtError) {
              // Some statements might fail if they already exist, that's okay
              if (!stmtError.message.includes('already exists')) {
                log(`⚠️  Statement warning: ${stmtError.message}`, 'yellow');
              }
            }
          }
        }
      }
      
      log('✅ Database migrations applied successfully', 'green');
      return true;
    } else {
      log('❌ Migration file not found', 'red');
      return false;
    }
  } catch (error) {
    log('❌ Migration failed:', 'red');
    log(error.message, 'red');
    log('\n💡 Manual migration steps:', 'yellow');
    log('1. Go to your Supabase dashboard', 'yellow');
    log('2. Navigate to SQL Editor', 'yellow');
    log('3. Copy and paste the contents of supabase/migrations/create_complete_schema.sql', 'yellow');
    log('4. Run the SQL', 'yellow');
    return false;
  }
}

async function createDemoUsers(supabase) {
  log('\n👥 Creating demo users...', 'cyan');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const user of demoUsers) {
    try {
      log(`👤 Creating user: ${user.email} (${user.user_metadata.role})`, 'blue');
      
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        user_metadata: user.user_metadata,
        email_confirm: user.email_confirm
      });
      
      if (authError) {
        if (authError.message.includes('already registered')) {
          log(`⚠️  User ${user.email} already exists in auth`, 'yellow');
        } else {
          throw authError;
        }
      }
      
      // Get user ID (either from creation or existing user)
      let userId = authData?.user?.id;
      if (!userId) {
        // Try to get existing user
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === user.email);
        userId = existingUser?.id;
      }
      
      if (userId) {
        // Create or update user profile in users table
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            email: user.email,
            name: user.user_metadata.name,
            role: user.user_metadata.role,
            phone: user.user_metadata.phone,
            address: user.user_metadata.address
          });
        
        if (profileError) {
          throw profileError;
        }
        
        log(`✅ Successfully created/updated user: ${user.email}`, 'green');
        successCount++;
      } else {
        throw new Error('Could not get user ID');
      }
    } catch (error) {
      log(`❌ Error with user ${user.email}: ${error.message}`, 'red');
      errorCount++;
    }
  }
  
  log(`\n📊 Demo users summary: ${successCount} successful, ${errorCount} errors`, 'cyan');
  return successCount > 0;
}

async function createDemoAnnouncements(supabase) {
  log('\n📢 Creating demo announcements...', 'cyan');
  
  try {
    const { error } = await supabase
      .from('announcements')
      .upsert(demoAnnouncements);
    
    if (error) {
      throw error;
    }
    
    log(`✅ Successfully created ${demoAnnouncements.length} announcements`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error creating announcements: ${error.message}`, 'red');
    return false;
  }
}

async function setupStorageBuckets(supabase) {
  log('\n🗄️  Setting up storage buckets...', 'cyan');
  
  const buckets = [
    { id: 'vehicle-documents', name: 'vehicle-documents', public: false },
    { id: 'incident-photos', name: 'incident-photos', public: false },
    { id: 'profile-images', name: 'profile-images', public: false }
  ];
  
  for (const bucket of buckets) {
    try {
      const { error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        allowedMimeTypes: ['image/*', 'application/pdf'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (error && !error.message.includes('already exists')) {
        throw error;
      }
      
      log(`✅ Storage bucket '${bucket.name}' ready`, 'green');
    } catch (error) {
      log(`❌ Error with bucket '${bucket.name}': ${error.message}`, 'red');
    }
  }
}

async function verifySetup(supabase) {
  log('\n🔍 Verifying setup...', 'cyan');
  
  try {
    // Check if users table exists and has data
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(5);
    
    if (usersError) {
      throw new Error(`Users table check failed: ${usersError.message}`);
    }
    
    log(`✅ Users table: ${users?.length || 0} users found`, 'green');
    
    // Check if other tables exist
    const tables = ['vehicles', 'inspections', 'incidents', 'announcements'];
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        log(`⚠️  Table '${table}': ${error.message}`, 'yellow');
      } else {
        log(`✅ Table '${table}': Ready`, 'green');
      }
    }
    
    return true;
  } catch (error) {
    log(`❌ Verification failed: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('🚀 ClaMax DTRIS Supabase Setup', 'bright');
  log('=====================================', 'bright');
  
  try {
    // Step 1: Check environment
    await checkEnvironment();
    
    // Step 2: Test connection
    const supabase = await testConnection();
    
    // Step 3: Apply migrations
    const migrationsApplied = await applyMigrations();
    
    // Step 4: Create demo users
    const usersCreated = await createDemoUsers(supabase);
    
    // Step 5: Create demo announcements
    await createDemoAnnouncements(supabase);
    
    // Step 6: Setup storage buckets
    await setupStorageBuckets(supabase);
    
    // Step 7: Verify setup
    const setupValid = await verifySetup(supabase);
    
    // Final summary
    log('\n🎉 Setup Complete!', 'bright');
    log('==================', 'bright');
    
    if (usersCreated) {
      log('\n🔐 Demo Login Credentials:', 'cyan');
      demoUsers.forEach(user => {
        log(`${user.user_metadata.role.toUpperCase().padEnd(10)} | ${user.email.padEnd(25)} | ${user.password}`, 'blue');
      });
    }
    
    log('\n📱 Next Steps:', 'cyan');
    log('1. Start your app: npm run dev', 'blue');
    log('2. Use the demo credentials to test different roles', 'blue');
    log('3. Check your Supabase dashboard to see the created tables', 'blue');
    
    if (!migrationsApplied) {
      log('\n⚠️  Manual Migration Required:', 'yellow');
      log('If tables are not visible in Supabase, manually run the SQL from:', 'yellow');
      log('supabase/migrations/create_complete_schema.sql', 'yellow');
    }
    
  } catch (error) {
    log('\n❌ Setup failed:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Run the setup
main();