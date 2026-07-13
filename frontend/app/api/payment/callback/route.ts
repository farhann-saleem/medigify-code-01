import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Swich payment gateway callback handler.
 * Swich sends a GET request with query params after payment completes.
 * Docs: https://api-docs.swichnow.com/
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const status = params.get('Status');
  const transactionId = params.get('TransactionId');
  const customerTransactionId = params.get('CustomerTransactionId');
  const checksum = params.get('Checksum');
  const amount = params.get('Amount');
  const consumerNumber = params.get('ConsumerNumber');

  // Validate required params
  if (!status || !transactionId || !customerTransactionId || !checksum || !amount) {
    return NextResponse.json({ status: 'error', message: 'Missing required parameters' }, { status: 400 });
  }

  // Verify checksum
  const clientSecret = process.env.SWICH_CLIENT_SECRET;
  if (!clientSecret) {
    console.error('SWICH_CLIENT_SECRET not configured');
    return NextResponse.json({ status: 'error', message: 'Server configuration error' }, { status: 500 });
  }

  const payload = `SWCallback:${customerTransactionId}:${transactionId}:${amount}:${consumerNumber ?? ''}`;
  const expectedChecksum = createHmac('sha256', clientSecret).update(payload).digest('hex');

  if (expectedChecksum.toLowerCase() !== checksum.toLowerCase()) {
    console.error('Checksum mismatch', { expected: expectedChecksum, received: checksum });
    return NextResponse.json({ status: 'error', message: 'Invalid checksum' }, { status: 403 });
  }

  // customerTransactionId format: "pro_<userId>_<timestamp>"
  // Extract userId from it
  const parts = customerTransactionId.split('_');
  if (parts.length < 3 || parts[0] !== 'pro') {
    console.error('Invalid customerTransactionId format', { customerTransactionId });
    return NextResponse.json({ status: 'error', message: 'Invalid transaction ID format' }, { status: 400 });
  }

  const userId = parts.slice(1, -1).join('_'); // handle UUIDs with underscores

  if (status.toLowerCase() === 'success') {
    const supabase = createAdminClient();

    // Update user plan to pro
    const { error } = await supabase
      .from('profiles')
      .update({
        plan: 'pro',
        plan_updated_at: new Date().toISOString(),
        swich_transaction_id: transactionId,
      })
      .eq('id', userId);

    if (error) {
      console.error('Failed to upgrade user plan', { userId, error });
      return NextResponse.json({ status: 'error', message: 'Database update failed' }, { status: 500 });
    }

    console.log('User upgraded to pro', { userId, transactionId, amount });
  } else {
    // Payment failed/pending — log it
    console.log('Payment not successful', { userId, status, transactionId });
  }

  // Swich expects this response
  return NextResponse.json({ status: 'success' });
}
