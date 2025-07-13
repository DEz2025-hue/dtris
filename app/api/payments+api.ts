import { supabaseService } from '@/utils/supabaseService';
import { paymentService } from '@/utils/payments';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const userId = url.searchParams.get('userId');
    const vehicleId = url.searchParams.get('vehicleId');
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');

    // Get payments with optional filters
    const result = await supabaseService.getPayments({
      page,
      pageSize,
      filters: {
        userId,
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
    console.error('Get payments error:', error);
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
    const paymentData = await request.json();

    // Validate required fields
    if (!paymentData.userId || !paymentData.amount || !paymentData.type || !paymentData.description) {
      return new Response(
        JSON.stringify({ error: 'Missing required payment fields' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate payment type
    if (!['registration', 'inspection', 'insurance', 'fine'].includes(paymentData.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid payment type' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate amount
    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid payment amount' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Process payment through payment service
    const payment = await paymentService.processPayment(
      paymentData.userId,
      paymentData.vehicleId,
      amount,
      paymentData.type,
      paymentData.description
    );

    return new Response(
      JSON.stringify({ 
        message: 'Payment processed successfully',
        payment
      }),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Process payment error:', error);
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