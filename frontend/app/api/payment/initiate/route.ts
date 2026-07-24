import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createClient } from '@/lib/supabase/server';

const SWICH_PWA_URL = 'https://payin-pwa.swichnow.com/';
const PRO_AMOUNT = '1500';

/**
 * POST /api/payment/initiate
 * Generates Swich PWA payment URL for Pro subscription.
 * Requires authenticated user. Body: { name, email, phone }
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

  // Check if already pro
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (profile?.plan === 'pro') {
    return NextResponse.json(
      { error: 'Already on Pro plan' },
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

  let body: { phone?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const customerTransactionId = `medigify_${user.id}_${Date.now()}`;
  const item = 'Medigify Pro Monthly Subscription';

  // Checksum formula: Swich:customerTransactionId:item:amount
  const checksumPayload = `Swich:${customerTransactionId}:${item}:${PRO_AMOUNT}`;
  const checksum = createHmac('sha256', secretKey)
    .update(checksumPayload)
    .digest('hex');

  const payeeName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    'Medigify User';

  const params = new URLSearchParams({
    clientId,
    customerTransactionId,
    item,
    amount: PRO_AMOUNT,
    channel: '0',
    description: 'Medigify Pro Monthly Subscription',
    PayeeName: payeeName,
    Email: user.email || '',
    MSISDN: body.phone || '03000000000',
    currency: 'PKR',
    checksum,
    successRedirectUrl: 'https://medigify.com/payment/success',
  });

  const paymentUrl = `${SWICH_PWA_URL}?${params.toString()}`;

  return NextResponse.json({ paymentUrl });
}
