require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrationDirect() {
  console.log('🔧 Applying database migration directly...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250710203040_peaceful_frost.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executing migration SQL...');
    
    // Execute the entire SQL as one statement
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error.message);
      
      // Try alternative approach - execute via HTTP
      console.log('🔄 Trying alternative approach...');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: migrationSQL })
      });
      
      if (response.ok) {
        console.log('✅ Migration applied successfully via HTTP');
      } else {
        const errorText = await response.text();
        console.error('❌ HTTP approach also failed:', errorText);
      }
    } else {
      console.log('✅ Migration applied successfully!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // Manual instructions
    console.log('\n📋 Manual Migration Instructions:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of supabase/migrations/20250710203040_peaceful_frost.sql');
    console.log('4. Click "Run" to execute the migration');
    console.log('5. After migration, run: node scripts/fix-admin-user.js');
  }
}

applyMigrationDirect().catch(console.error); 