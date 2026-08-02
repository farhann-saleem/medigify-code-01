export const MODULES = [
  { id: 'Cardiovascular Module', label: 'Cardiovascular' },
  { id: 'Foundation Module', label: 'Foundation' },
  { id: 'Hematopoietic and Lymphatic Module', label: 'Hematopoietic & Lymphatic' },
  { id: 'Musculoskeletal Module', label: 'Musculoskeletal' },
  { id: 'Respiratory Module', label: 'Respiratory' },
] as const;

export const ALL_MODULE_IDS: string[] = MODULES.map((m) => m.id);

export const PRICES = {
  base: 299,
  earlyBird: 199,
  promo: 249,
} as const;

export const EARLY_BIRD_DEADLINE = new Date('2026-08-15T23:59:59+05:00');
export const MODULE_VALIDITY_DAYS = 365;

const PROMO_CODES: Record<string, { discount: 'institutional' | 'ambassador'; label: string }> = {
  SHALAMAR2026: { discount: 'institutional', label: 'Shalamar Institutional' },
  AMBASSADOR: { discount: 'ambassador', label: 'Ambassador' },
};

export function isEarlyBird(): boolean {
  return new Date() < EARLY_BIRD_DEADLINE;
}

export function validatePromoCode(code: string): {
  valid: boolean;
  discount?: 'institutional' | 'ambassador';
  label?: string;
} {
  const entry = PROMO_CODES[code.trim().toUpperCase()];
  if (!entry) return { valid: false };
  return { valid: true, discount: entry.discount, label: entry.label };
}

export function getEffectivePrice(promoCode?: string): {
  price: number;
  appliedDiscount: 'early_bird' | 'promo' | 'base';
  label: string;
} {
  const earlyBird = isEarlyBird();
  const promo = promoCode ? validatePromoCode(promoCode) : null;

  // Early bird always wins if active (199 < 249)
  if (earlyBird) {
    return { price: PRICES.earlyBird, appliedDiscount: 'early_bird', label: 'Early Bird' };
  }

  if (promo?.valid) {
    return { price: PRICES.promo, appliedDiscount: 'promo', label: promo.label! };
  }

  return { price: PRICES.base, appliedDiscount: 'base', label: 'Standard' };
}

/** Expiry map: module_id -> ISO date string */
export type ModuleExpiry = Record<string, string>;

export function getDaysRemaining(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function isModuleExpired(expiresAt: string): boolean {
  return getDaysRemaining(expiresAt) <= 0;
}

export function calculateTotal(
  moduleCount: number,
  promoCode?: string,
): { total: number; pricePerModule: number; appliedDiscount: string; label: string } {
  const { price, appliedDiscount, label } = getEffectivePrice(promoCode);
  return {
    total: price * moduleCount,
    pricePerModule: price,
    appliedDiscount,
    label,
  };
}
