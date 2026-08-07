import { ALL_MODULE_IDS } from './pricing';

export const PLAN_LIMITS = {
  free: {
    mcqsPerSubject: 5,
    label: 'Free',
    description: '5 MCQs per subject per session',
  },
  pro: {
    mcqsPerSubject: Infinity,
    label: 'Pro',
    description: 'Unlimited MCQs in purchased modules',
  },
  premium: {
    mcqsPerSubject: Infinity,
    label: 'Premium',
    description: 'Unlimited MCQs across all modules',
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

/** Check if user has access to a specific module */
export function hasModuleAccess(purchasedModules: string[], moduleId: string): boolean {
  return purchasedModules.includes(moduleId);
}

/** Check if user owns all 5 modules */
export function hasAllModules(purchasedModules: string[]): boolean {
  return ALL_MODULE_IDS.every((id) => purchasedModules.includes(id));
}

/** Derive plan from purchased modules */
export function derivePlan(purchasedModules: string[]): Plan {
  if (hasAllModules(purchasedModules)) return 'premium';
  if (purchasedModules.length > 0) return 'pro';
  return 'free';
}

/** Get MCQ limit for a given module based on ownership */
export function getModuleLimit(purchasedModules: string[], moduleId: string): number {
  return hasModuleAccess(purchasedModules, moduleId)
    ? Infinity
    : PLAN_LIMITS.free.mcqsPerSubject;
}
