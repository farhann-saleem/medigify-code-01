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
    description: 'Unlimited MCQs across all subjects',
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

/** Check if user has access to a specific module */
export function hasModuleAccess(purchasedModules: string[], moduleId: string): boolean {
  return purchasedModules.includes(moduleId);
}

/** Check if user owns all 5 modules (equivalent to old "pro") */
export function hasAllModules(purchasedModules: string[]): boolean {
  return ALL_MODULE_IDS.every((id) => purchasedModules.includes(id));
}

/** Get MCQ limit for a given module based on ownership */
export function getModuleLimit(purchasedModules: string[], moduleId: string): number {
  return hasModuleAccess(purchasedModules, moduleId)
    ? Infinity
    : PLAN_LIMITS.free.mcqsPerSubject;
}
