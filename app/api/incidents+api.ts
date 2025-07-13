import { supabaseService } from '@/utils/supabaseService';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const reporterId = url.searchParams.get('reporterId');
    const vehicleId = url.searchParams.get('vehicleId');
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');

    // Get incidents with optional filters
    const result = await supabaseService.getIncidents({
      page,
      pageSize,
      filters: {
        reporterId,
        vehicleId,
        status,
        type,
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
    console.error('Get incidents error:', error);
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
    const incidentData = await request.json();

    // Validate required fields
    if (!incidentData.reporterId || !incidentData.type || !incidentData.description || !incidentData.location) {
      return new Response(
        JSON.stringify({ error: 'Missing required incident fields' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate incident type
    if (!['accident', 'violation', 'theft', 'other'].includes(incidentData.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid incident type' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Sanitize description and location
    incidentData.description = incidentData.description.trim();
    incidentData.location = incidentData.location.trim();

    // Create incident in Supabase
    const incident = await supabaseService.addIncident(incidentData);

    return new Response(
      JSON.stringify({ 
        message: 'Incident reported successfully',
        incident
      }),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Create incident error:', error);
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

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const incidentId = url.searchParams.get('id');
    
    if (!incidentId) {
      return new Response(
        JSON.stringify({ error: 'Incident ID is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const updateData = await request.json();

    // Validate status if provided
    if (updateData.status && !['reported', 'investigating', 'resolved'].includes(updateData.status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid incident status' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Update incident in Supabase
    await supabaseService.updateIncident(incidentId, updateData);

    return new Response(
      JSON.stringify({ 
        message: 'Incident updated successfully'
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Update incident error:', error);
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