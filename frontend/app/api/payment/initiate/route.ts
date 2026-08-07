import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ALL_MODULE_IDS, calculateTotal } from '@/lib/pricing';

const SWICH_PWA_URL = 'https://payin-pwa.swichnow.com/';

/**
 * POST /api/payment/initiate
 * Generates Swich PWA payment URL for module purchases.
 * Body: { modules: string[], promoCode?: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 },
    );
  }

  let body: { modules?: string[]; promoCode?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const requestedModules = body.modules;
  if (!requestedModules || !Array.isArray(requestedModules) || requestedModules.length === 0) {
    return NextResponse.json(
      { error: 'No modules selected' },
      { status: 400 },
    );
  }

  // Validate module IDs
  const invalidModules = requestedModules.filter((m) => !ALL_MODULE_IDS.includes(m));
  if (invalidModules.length > 0) {
    return NextResponse.json(
      { error: `Invalid modules: ${invalidModules.join(', ')}` },
      { status: 400 },
    );
  }

  // Check already-owned modules
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, first_name, last_name, purchased_modules, phone')
    .eq('id', user.id)
    .single();

  const ownedModules: string[] = (profile?.purchased_modules as string[]) ?? [];
  const newModules = requestedModules.filter((m) => !ownedModules.includes(m));

  if (newModules.length === 0) {
    return NextResponse.json(
      { error: 'You already own all selected modules' },
      { status: 400 },
    );
  }

  const clientId = process.env.SWICH_CLIENT_ID;
  const secretKey = process.env.SWICH_SECRET_KEY;

  if (!clientId || !secretKey) {
    console.error('Swich credentials not configured');
    return NextResponse.json(
      { error: 'Payment not configured' },
      { status: 500 },
    );
  }

  const promoCode = body.promoCode?.trim() || undefined;
  const { total, pricePerModule, appliedDiscount, label } = calculateTotal(newModules.length, promoCode);

  const customerTransactionId = `medigify_${user.id}_${Date.now()}`;

  // Build concise item description for Swich URL
  const moduleNames = newModules.map((m) => m.replace(' Module', '')).join(', ');
  const item = `Medigify: ${moduleNames}`;

  const amount = String(total);

  // Checksum formula: Swich:customerTransactionId:item:amount
  const checksumPayload = `Swich:${customerTransactionId}:${item}:${amount}`;
  const checksum = createHmac('sha256', secretKey)
    .update(checksumPayload)
    .digest('hex');

  const payeeName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    'Medigify User';

  // Insert pending purchase record
  const adminClient = createAdminClient();
  const { error: insertError } = await adminClient
    .from('purchases')
    .insert({
      user_id: user.id,
      customer_transaction_id: customerTransactionId,
      modules: newModules,
      promo_code: promoCode || null,
      price_per_module: pricePerModule,
      total_amount: total,
      applied_discount: appliedDiscount,
      status: 'pending',
    });

  if (insertError) {
    console.error('Failed to create purchase record', insertError);
    return NextResponse.json(
      { error: 'Could not initiate payment' },
      { status: 500 },
    );
  }

  const params = new URLSearchParams({
    clientId,
    customerTransactionId,
    item,
    amount,
    channel: '0',
    description: `Medigify Module Purchase (${label})`,
    PayeeName: payeeName,
    Email: user.email || '',
    MSISDN: (profile?.phone as string) || '03000000000',
    currency: 'PKR',
    checksum,
    successRedirectUrl: 'https://medigify.com/api/payment/callback',
  });

  const paymentUrl = `${SWICH_PWA_URL}?${params.toString()}`;

  return NextResponse.json({ paymentUrl });
}
