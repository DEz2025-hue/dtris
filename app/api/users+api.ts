import { supabaseService } from '@/utils/supabaseService';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const role = url.searchParams.get('role');
    const search = url.searchParams.get('search');

    // Get users with optional filters
    const result = await supabaseService.getUsers({
      page,
      pageSize,
      filters: {
        role,
        search,
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
    console.error('Get users error:', error);
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
    const userData = await request.json();

    // Validate required fields
    if (!userData.email || !userData.name || !userData.role) {
      return new Response(
        JSON.stringify({ error: 'Missing required user fields' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate role
    if (!['owner', 'inspector', 'admin'].includes(userData.role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid user role' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Sanitize input
    userData.email = userData.email.toLowerCase().trim();
    userData.name = userData.name.trim();
    if (userData.phone) userData.phone = userData.phone.trim();
    if (userData.address) userData.address = userData.address.trim();

    // Create user in Supabase
    const user = await supabaseService.addUser(userData);

    return new Response(
      JSON.stringify({ 
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Create user error:', error);
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
    const userId = url.searchParams.get('id');
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const updateData = await request.json();

    // Validate role if provided
    if (updateData.role && !['owner', 'inspector', 'admin'].includes(updateData.role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid user role' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Sanitize input
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.phone) updateData.phone = updateData.phone.trim();
    if (updateData.address) updateData.address = updateData.address.trim();

    // Update user in Supabase
    await supabaseService.updateUser(userId, updateData);

    return new Response(
      JSON.stringify({ 
        message: 'User updated successfully'
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Update user error:', error);
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