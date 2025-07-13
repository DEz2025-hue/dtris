// Test script to check environment variables
require('dotenv').config();

console.log('🔍 Testing environment variables...');
console.log('');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📋 Environment Variables:');
console.log(`EXPO_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`EXPO_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? '✅ Set' : '❌ Missing'}`);

if (supabaseUrl) {
  console.log(`URL: ${supabaseUrl}`);
}

if (serviceRoleKey) {
  console.log(`Service Key: ${serviceRoleKey.substring(0, 20)}...`);
}

console.log('');

if (supabaseUrl && serviceRoleKey) {
  console.log('✅ All required variables are set!');
  console.log('You can now run: node scripts/add-demo-users.js');
} else {
  console.log('❌ Missing required variables.');
  console.log('Please check your .env file contains:');
  console.log('- EXPO_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
}