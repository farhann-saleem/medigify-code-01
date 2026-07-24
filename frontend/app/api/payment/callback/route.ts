import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Swich payment gateway callback handler.
 * Swich sends HTTP GET with query params after payment completes.
 * Callback params: PaymentType, Status, OrderId, CustomerTransactionId, Amount, Checksum
 * Checksum formula: SWCallback:CustomerTransactionId:OrderId:Amount:Status
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const status = params.get('Status');
  const orderId = params.get('OrderId');
  const customerTransactionId = params.get('CustomerTransactionId');
  const checksum = params.get('Checksum');
  const amount = params.get('Amount');

  if (!status || !orderId || !customerTransactionId || !checksum || !amount) {
    return NextResponse.json(
      { status: 'error', message: 'Missing required parameters' },
      { status: 400 },
    );
  }

  // Verify checksum using SecretKey (NOT client_secret)
  const secretKey = process.env.SWICH_SECRET_KEY;
  if (!secretKey) {
    console.error('SWICH_SECRET_KEY not configured');
    return NextResponse.json(
      { status: 'error', message: 'Server configuration error' },
      { status: 500 },
    );
  }

  // Formula from docs: SWCallback:CustomerTransactionId:OrderId:Amount:Status
  const payload = `SWCallback:${customerTransactionId}:${orderId}:${amount}:${status}`;
  const expectedChecksum = createHmac('sha256', secretKey)
    .update(payload)
    .digest('hex');

  if (expectedChecksum.toLowerCase() !== checksum.toLowerCase()) {
    console.error('Checksum mismatch', {
      payload,
      expected: expectedChecksum,
      received: checksum,
    });
    return NextResponse.json(
      { status: 'error', message: 'Invalid checksum' },
      { status: 403 },
    );
  }

  // customerTransactionId format: "medigify_<userId>_<timestamp>"
  const parts = customerTransactionId.split('_');
  if (parts.length < 3 || parts[0] !== 'medigify') {
    console.error('Invalid customerTransactionId format', {
      customerTransactionId,
    });
    return NextResponse.json(
      { status: 'error', message: 'Invalid transaction ID format' },
      { status: 400 },
    );
  }

  // UUID contains hyphens not underscores, so middle segment is the full UUID
  // Format: medigify_<uuid>_<timestamp>
  const timestamp = parts[parts.length - 1];
  const userId = customerTransactionId
    .replace('medigify_', '')
    .replace(`_${timestamp}`, '');

  const supabase = createAdminClient();

  if (status.toLowerCase() === 'success') {
    const { error } = await supabase
      .from('profiles')
      .update({
        plan: 'pro',
        plan_updated_at: new Date().toISOString(),
        swich_order_id: orderId,
      })
      .eq('id', userId);

    if (error) {
      console.error('Failed to upgrade user plan', { userId, error });
      return NextResponse.json(
        { status: 'error', message: 'Database update failed' },
        { status: 500 },
      );
    }

    console.log('User upgraded to pro', { userId, orderId, amount });
  } else {
    console.log('Payment not successful', { userId, status, orderId });
  }

  // Swich expects this exact response
  return NextResponse.json({ status: 'success' });
}
