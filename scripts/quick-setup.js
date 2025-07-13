const fs = require('fs');
const path = require('path');

console.log('🚀 ClaMax DTRIS Quick Database Setup');
console.log('=====================================');
console.log('');

console.log('📋 STEP 1: Copy the database migration');
console.log('----------------------------------------');
console.log('1. Open the file: database-setup.sql');
console.log('2. Select all content (Ctrl+A)');
console.log('3. Copy it (Ctrl+C)');
console.log('');

console.log('📋 STEP 2: Apply to Supabase');
console.log('-----------------------------');
console.log('1. Go to your Supabase Dashboard');
console.log('2. Click "SQL Editor" in the left sidebar');
console.log('3. Click "New Query"');
console.log('4. Paste the copied content (Ctrl+V)');
console.log('5. Click "Run" button');
console.log('');

console.log('📋 STEP 3: Verify Setup');
console.log('------------------------');
console.log('1. Go to "Table Editor" in Supabase');
console.log('2. You should see these tables:');
console.log('   - users');
console.log('   - vehicles');
console.log('   - vehicle_documents');
console.log('   - inspections');
console.log('   - incidents');
console.log('   - payments');
console.log('   - device_tokens');
console.log('   - announcements');
console.log('');

console.log('📋 STEP 4: Create Admin User');
console.log('----------------------------');
console.log('1. Go back to SQL Editor');
console.log('2. Run this query (replace with your email):');
console.log('');
console.log('INSERT INTO users (id, email, name, role, created_at)');
console.log('VALUES (');
console.log('  gen_random_uuid(),');
console.log('  \'your-email@example.com\',');
console.log('  \'Admin User\',');
console.log('  \'admin\',');
console.log('  now()');
console.log(');');
console.log('');

console.log('📋 STEP 5: Test in App');
console.log('----------------------');
console.log('1. Go back to your app');
console.log('2. Click "Test DB" button');
console.log('3. Try adding a user');
console.log('');

console.log('✅ That\'s it! Your database should be ready.');
console.log('');
console.log('Need help? Check the console logs for detailed error messages.'); 