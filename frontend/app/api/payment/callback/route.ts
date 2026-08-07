import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { MODULE_VALIDITY_DAYS } from '@/lib/pricing';
import { derivePlan } from '@/lib/plans';
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medigify.com';

  if (!status || !orderId || !customerTransactionId || !checksum || !amount) {
    console.error('Payment callback missing params', { status, orderId, customerTransactionId, amount });
    return NextResponse.redirect(`${baseUrl}/payment/failed`);
  }

  // Verify checksum
  const secretKey = process.env.SWICH_SECRET_KEY;
  if (!secretKey) {
    console.error('SWICH_SECRET_KEY not configured');
    return NextResponse.redirect(`${baseUrl}/payment/failed`);
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
    return NextResponse.redirect(`${baseUrl}/payment/failed`);
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
    return NextResponse.redirect(`${baseUrl}/payment/failed`);
  }

  // Verify amount matches
  if (String(purchase.total_amount) !== amount) {
    console.error('Amount mismatch', {
      expected: purchase.total_amount,
      received: amount,
    });
    return NextResponse.redirect(`${baseUrl}/payment/failed`);
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
    const plan = derivePlan(mergedModules);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        purchased_modules: mergedModules,
        modules_expiry: mergedExpiry,
        plan,
        plan_updated_at: new Date().toISOString(),
        swich_order_id: orderId,
      })
      .eq('id', purchase.user_id);

    if (updateError) {
      console.error('Failed to update user profile', { userId: purchase.user_id, updateError });
      return NextResponse.redirect(`${baseUrl}/payment/failed`);
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

    return NextResponse.redirect(`${baseUrl}/payment/failed`);
  }

  // Redirect user to success page after processing
  return NextResponse.redirect(`${baseUrl}/payment/success`);
}
