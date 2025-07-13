import { supabaseService } from '@/utils/supabaseService';

export async function POST(request: Request) {
  try {
    const { email, password, name, role, phone, address } = await request.json();

    // Validate required fields
    if (!email || !password || !name || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create user in Supabase Auth and users table
    const authData = await supabaseService.signUp(email, password, {
      name,
      role,
      phone,
      address,
    });

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user account' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create user profile in users table
    const userProfile = await supabaseService.addUser({
      email,
      name,
      role,
      phone,
      address,
    });
    return new Response(
      JSON.stringify({ 
        message: 'User created successfully',
        user: {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          role: userProfile.role
        }
      }),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Signup error:', error);
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