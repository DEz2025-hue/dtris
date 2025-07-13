import { supabase } from '@/lib/supabase';
import { User } from '@/types';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function authenticateRequest(request: Request): Promise<User | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    // Get user profile from users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      phone: profile.phone,
      address: profile.address,
      createdAt: new Date(profile.created_at),
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export function requireAuth(handler: (request: Request, user: User) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    const user = await authenticateRequest(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return handler(request, user);
  };
}

export function requireRole(roles: string[], handler: (request: Request, user: User) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    const user = await authenticateRequest(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!roles.includes(user.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return handler(request, user);
  };
}