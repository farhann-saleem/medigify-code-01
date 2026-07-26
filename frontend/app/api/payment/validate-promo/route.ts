import { NextRequest, NextResponse } from 'next/server';
import { validatePromoCode, getEffectivePrice } from '@/lib/pricing';

export async function POST(request: NextRequest) {
  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ error: 'No promo code provided' }, { status: 400 });
  }

  const result = validatePromoCode(code);
  if (!result.valid) {
    return NextResponse.json({ valid: false, error: 'Invalid promo code' });
  }

  const { price, appliedDiscount, label } = getEffectivePrice(code);

  return NextResponse.json({
    valid: true,
    pricePerModule: price,
    appliedDiscount,
    label,
  });
}
