const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyUserPolicies() {
  try {
    console.log('Applying user policies...');

    // Add DELETE policy for admins
    const { error: deleteError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Admins can delete users" ON users
        FOR DELETE TO authenticated
        USING (EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        ));
      `
    });

    if (deleteError) {
      console.error('Error creating DELETE policy:', deleteError);
    } else {
      console.log('✅ DELETE policy created successfully');
    }

    // Add UPDATE policy for admins
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Admins can update users" ON users
        FOR UPDATE TO authenticated
        USING (EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        ));
      `
    });

    if (updateError) {
      console.error('Error creating UPDATE policy:', updateError);
    } else {
      console.log('✅ UPDATE policy created successfully');
    }

    console.log('✅ User policies applied successfully!');
  } catch (error) {
    console.error('Error applying user policies:', error);
  }
}

applyUserPolicies(); 