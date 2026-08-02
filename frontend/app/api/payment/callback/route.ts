import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { ALL_MODULE_IDS, MODULE_VALIDITY_DAYS } from '@/lib/pricing';
import type { ModuleExpiry } from '@/lib/pricing';

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

  // Verify checksum
  const secretKey = process.env.SWICH_SECRET_KEY;
  if (!secretKey) {
    console.error('SWICH_SECRET_KEY not configured');
    return NextResponse.json(
      { status: 'error', message: 'Server configuration error' },
      { status: 500 },
    );
  }

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

  const supabase = createAdminClient();

  // Lookup purchase record by customer_transaction_id
  const { data: purchase, error: lookupError } = await supabase
    .from('purchases')
    .select('*')
    .eq('customer_transaction_id', customerTransactionId)
    .single();

  if (lookupError || !purchase) {
    console.error('Purchase record not found', { customerTransactionId, lookupError });
    return NextResponse.json(
      { status: 'error', message: 'Purchase record not found' },
      { status: 400 },
    );
  }

  // Verify amount matches
  if (String(purchase.total_amount) !== amount) {
    console.error('Amount mismatch', {
      expected: purchase.total_amount,
      received: amount,
    });
    return NextResponse.json(
      { status: 'error', message: 'Amount mismatch' },
      { status: 400 },
    );
  }

  if (status.toLowerCase() === 'success') {
    // Get current modules + expiry for merge
    const { data: profile } = await supabase
      .from('profiles')
      .select('purchased_modules, modules_expiry')
      .eq('id', purchase.user_id)
      .single();

    const existingModules: string[] = (profile?.purchased_modules as string[]) ?? [];
    const existingExpiry: ModuleExpiry = (profile?.modules_expiry as ModuleExpiry) ?? {};
    const newModules = purchase.modules as string[];

    // SET union for idempotency
    const mergedModules = [...new Set([...existingModules, ...newModules])];

    // Set expiry: 1 year from now for newly purchased modules
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + MODULE_VALIDITY_DAYS);
    const expiryIso = expiryDate.toISOString();

    const mergedExpiry = { ...existingExpiry };
    for (const mod of newModules) {
      mergedExpiry[mod] = expiryIso;
    }

    // Derive plan status
    const isPro = ALL_MODULE_IDS.every((id) => mergedModules.includes(id));

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        purchased_modules: mergedModules,
        modules_expiry: mergedExpiry,
        plan: isPro ? 'pro' : 'free',
        plan_updated_at: new Date().toISOString(),
        swich_order_id: orderId,
      })
      .eq('id', purchase.user_id);

    if (updateError) {
      console.error('Failed to update user profile', { userId: purchase.user_id, updateError });
      return NextResponse.json(
        { status: 'error', message: 'Database update failed' },
        { status: 500 },
      );
    }

    // Mark purchase completed
    await supabase
      .from('purchases')
      .update({
        status: 'completed',
        swich_order_id: orderId,
        completed_at: new Date().toISOString(),
      })
      .eq('id', purchase.id);

    console.log('Modules unlocked', {
      userId: purchase.user_id,
      modules: newModules,
      orderId,
      amount,
    });
  } else {
    // Mark purchase failed
    await supabase
      .from('purchases')
      .update({
        status: 'failed',
        swich_order_id: orderId,
      })
      .eq('id', purchase.id);

    console.log('Payment not successful', {
      userId: purchase.user_id,
      status,
      orderId,
    });
  }

  // Swich expects this exact response
  return NextResponse.json({ status: 'success' });
}
