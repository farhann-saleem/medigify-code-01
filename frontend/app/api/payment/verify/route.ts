import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MODULE_VALIDITY_DAYS } from '@/lib/pricing';
import { derivePlan } from '@/lib/plans';
import type { ModuleExpiry } from '@/lib/pricing';

/**
 * Get bearer token from Swich auth API.
 */
async function getSwichToken(): Promise<string | null> {
  const clientId = process.env.SWICH_CLIENT_ID;
  const clientSecret = process.env.SWICH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Swich auth credentials not configured');
    return null;
  }

  try {
    const res = await fetch('https://auth.swichnow.com/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!res.ok) {
      console.error('Swich token request failed', { status: res.status });
      return null;
    }

    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.error('Swich token request error', err);
    return null;
  }
}

/**
 * Inquire transaction status from Swich API.
 */
async function inquireTransaction(
  token: string,
  customerTransactionId: string,
): Promise<{ verified: boolean; status: string }> {
  try {
    const url = `https://api.swichnow.com/gateway/payin/v2.0/inquire?CustomerTransactionId=${encodeURIComponent(customerTransactionId)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.error('Swich inquire failed', { status: res.status, txn: customerTransactionId });
      return { verified: false, status: 'error' };
    }

    const data = await res.json();
    const txnStatus = data?.transaction?.transactionStatus?.toLowerCase() || data?.status?.toLowerCase() || '';

    return {
      verified: txnStatus === 'success',
      status: txnStatus,
    };
  } catch (err) {
    console.error('Swich inquire error', err);
    return { verified: false, status: 'error' };
  }
}

/**
 * POST /api/payment/verify
 * Checks pending purchases, verifies with Swich Inquire API, then unlocks modules.
 * Fallback when Swich callback fails/delays.
 */
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Find pending purchases for this user
  const { data: pendingPurchases, error: lookupError } = await admin
    .from('purchases')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (lookupError || !pendingPurchases || pendingPurchases.length === 0) {
    return NextResponse.json({ status: 'no_pending', processed: 0 });
  }

  // Only process purchases older than 30s (give callback time first)
  const eligiblePurchases = pendingPurchases.filter((p) => {
    const ageMs = Date.now() - new Date(p.created_at).getTime();
    return ageMs > 30_000;
  });

  if (eligiblePurchases.length === 0) {
    return NextResponse.json({ status: 'too_recent', processed: 0 });
  }

  // Get Swich bearer token to verify payments
  const token = await getSwichToken();
  if (!token) {
    return NextResponse.json({ error: 'Could not verify with payment provider' }, { status: 502 });
  }

  // Get current profile
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('purchased_modules, modules_expiry')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Verify: profile fetch failed', { userId: user.id, profileError });
    return NextResponse.json({ error: 'Profile not found' }, { status: 500 });
  }

  let currentModules: string[] = (profile?.purchased_modules as string[]) ?? [];
  let currentExpiry: ModuleExpiry = (profile?.modules_expiry as ModuleExpiry) ?? {};
  let processed = 0;

  for (const purchase of eligiblePurchases) {
    // Verify with Swich Inquire API
    const { verified, status: txnStatus } = await inquireTransaction(
      token,
      purchase.customer_transaction_id,
    );

    if (!verified) {
      console.log('Verify: Swich says not successful', {
        txn: purchase.customer_transaction_id,
        swichStatus: txnStatus,
      });

      // If Swich explicitly says failed, mark it
      if (txnStatus === 'failed' || txnStatus === 'terminated' || txnStatus === 'block') {
        await admin
          .from('purchases')
          .update({ status: 'failed' })
          .eq('id', purchase.id);
      }
      continue;
    }

    // Swich confirmed success — unlock modules
    const newModules = purchase.modules as string[];
    currentModules = [...new Set([...currentModules, ...newModules])];

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + MODULE_VALIDITY_DAYS);
    const expiryIso = expiryDate.toISOString();

    for (const mod of newModules) {
      currentExpiry[mod] = expiryIso;
    }

    // Mark purchase completed
    await admin
      .from('purchases')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', purchase.id);

    processed++;
  }

  if (processed === 0) {
    return NextResponse.json({ status: 'none_verified', processed: 0 });
  }

  // Update profile
  const plan = derivePlan(currentModules);

  const { error: updateError } = await admin
    .from('profiles')
    .update({
      purchased_modules: currentModules,
      modules_expiry: currentExpiry,
      plan,
      plan_updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Verify: profile update failed', { userId: user.id, updateError });
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }

  console.log('Verify: modules unlocked via Swich Inquire', {
    userId: user.id,
    modules: currentModules,
    plan,
    processed,
  });

  return NextResponse.json({ status: 'verified', processed, plan });
}
