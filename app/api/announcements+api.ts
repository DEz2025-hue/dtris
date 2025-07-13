import { supabaseService } from '@/utils/supabaseService';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const targetRole = url.searchParams.get('targetRole');
    const priority = url.searchParams.get('priority');

    // Get announcements with optional filters
    const result = await supabaseService.getAnnouncements({
      page,
      pageSize,
      filters: {
        targetRole,
        priority,
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
    console.error('Get announcements error:', error);
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
    const announcementData = await request.json();

    // Validate required fields
    if (!announcementData.title || !announcementData.content) {
      return new Response(
        JSON.stringify({ error: 'Missing required announcement fields' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate priority
    if (announcementData.priority && !['low', 'medium', 'high'].includes(announcementData.priority)) {
      return new Response(
        JSON.stringify({ error: 'Invalid priority level' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate target role
    if (announcementData.targetRole && !['owner', 'inspector', 'admin'].includes(announcementData.targetRole)) {
      return new Response(
        JSON.stringify({ error: 'Invalid target role' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Sanitize content
    announcementData.title = announcementData.title.trim();
    announcementData.content = announcementData.content.trim();

    // Create announcement in Supabase
    const announcement = await supabaseService.addAnnouncement(announcementData);

    return new Response(
      JSON.stringify({ 
        message: 'Announcement created successfully',
        announcement
      }),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Create announcement error:', error);
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