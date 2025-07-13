import { supabaseService } from '@/utils/supabaseService';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const vehicleId = url.searchParams.get('vehicleId');
    const inspectorId = url.searchParams.get('inspectorId');
    const status = url.searchParams.get('status');

    // Get inspections with optional filters
    const result = await supabaseService.getInspections({
      page,
      pageSize,
      filters: {
        vehicleId,
        inspectorId,
        status,
      },
    });

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Get inspections error:', error);
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
    const inspectionData = await request.json();

    // Validate required fields
    if (!inspectionData.vehicleId || !inspectionData.inspectorId || !inspectionData.status || !inspectionData.location) {
      return new Response(
        JSON.stringify({ error: 'Missing required inspection fields' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate status
    if (!['pass', 'fail', 'conditional'].includes(inspectionData.status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid inspection status' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create inspection in Supabase
    const inspection = await supabaseService.addInspection(inspectionData);

    return new Response(
      JSON.stringify({ 
        message: 'Inspection created successfully',
        inspection
      }),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Create inspection error:', error);
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