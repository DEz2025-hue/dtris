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

async function applyMigration() {
  console.log('🔧 Applying database migration...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250710203040_peaceful_frost.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executing migration SQL...');
    
    // Split SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          const { error } = await supabase.rpc('exec', { sql: statement + ';' });
          
          if (error) {
            // Some statements might fail if they already exist, that's okay
            if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
              console.log(`⚠️  Statement warning: ${error.message}`);
              errorCount++;
            } else {
              console.log(`✅ Statement executed (already exists)`);
              successCount++;
            }
          } else {
            console.log(`✅ Statement executed successfully`);
            successCount++;
          }
        } catch (stmtError) {
          // Some statements might fail if they already exist, that's okay
          if (!stmtError.message.includes('already exists') && !stmtError.message.includes('duplicate key')) {
            console.log(`❌ Statement error: ${stmtError.message}`);
            errorCount++;
          } else {
            console.log(`✅ Statement executed (already exists)`);
            successCount++;
          }
        }
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    if (successCount > 0) {
      console.log('🎉 Migration completed successfully!');
    } else {
      console.log('⚠️  No statements were executed successfully.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

applyMigration().catch(console.error); 