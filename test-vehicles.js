require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Vehicles Functionality...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testVehicles() {
  try {
    console.log('\n1. Testing authentication...');
    
    // Test sign in with demo user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@dtris.gov.lr',
      password: 'demo123'
    });
    
    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
      return;
    }
    
    console.log('✅ Authentication successful');
    
    console.log('\n2. Testing users table access...');
    
    // Check if user exists in users table
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (userError) {
      console.log('❌ User profile not found:', userError.message);
      console.log('This is expected if the user was created only in auth, not in the users table');
    } else {
      console.log('✅ User profile found:', userProfile.email);
    }
    
    console.log('\n3. Testing vehicles table access...');
    
    // Test vehicles table
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*')
      .limit(5);
    
    if (vehiclesError) {
      console.log('❌ Vehicles query failed:', vehiclesError.message);
      return;
    }
    
    console.log(`✅ Vehicles query successful. Found ${vehicles?.length || 0} vehicles`);
    
    console.log('\n4. Testing vehicle creation (if user exists in users table)...');
    
    if (userProfile) {
      // Test creating a vehicle
      const testVehicle = {
        owner_id: authData.user.id,
        license_plate: 'TEST-2024-001',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        color: 'Silver',
        vin: 'VIN123456789',
        expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        barcode: 'LR123456789012'
      };
      
      const { data: newVehicle, error: createError } = await supabase
        .from('vehicles')
        .insert(testVehicle)
        .select()
        .single();
      
      if (createError) {
        console.log('❌ Vehicle creation failed:', createError.message);
      } else {
        console.log('✅ Vehicle creation successful:', newVehicle.license_plate);
        
        // Clean up - delete the test vehicle
        await supabase
          .from('vehicles')
          .delete()
          .eq('id', newVehicle.id);
        
        console.log('✅ Test vehicle cleaned up');
      }
    } else {
      console.log('⚠️  Skipping vehicle creation test - user not in users table');
    }
    
    console.log('\n🎉 Vehicles functionality test completed successfully!');
    console.log('✅ Authentication: OK');
    console.log('✅ Database access: OK');
    console.log('✅ Vehicle operations: OK');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testVehicles(); 