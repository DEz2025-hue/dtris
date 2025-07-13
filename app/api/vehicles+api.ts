import { supabaseService } from '@/utils/supabaseService';

export async function GET(request: Request) {
  try {
    // Get vehicles from Supabase
    const vehicles = await supabaseService.getVehicles();

    return new Response(
      JSON.stringify({ vehicles }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Get vehicles error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const vehicleData = await request.json();

    // Validate required fields
    if (!vehicleData.licensePlate || !vehicleData.make || !vehicleData.model || !vehicleData.year) {
      return new Response(
        JSON.stringify({ error: 'Missing required vehicle fields' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create vehicle in Supabase
    const vehicle = await supabaseService.addVehicle(vehicleData);

    return new Response(
      JSON.stringify({ 
        message: 'Vehicle created successfully',
        vehicle
      }),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Create vehicle error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}