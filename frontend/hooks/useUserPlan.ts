'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Plan } from '@/lib/plans';
import { derivePlan, hasModuleAccess } from '@/lib/plans';
import type { ModuleExpiry } from '@/lib/pricing';

interface UserPlanState {
  plan: Plan;
  isPro: boolean;
  isPremium: boolean;
  purchasedModules: string[];
  modulesExpiry: ModuleExpiry;
  isLoading: boolean;
  error: string | null;
  hasModule: (moduleId: string) => boolean;
}

export function useUserPlan(): UserPlanState {
  const [state, setState] = useState<Omit<UserPlanState, 'hasModule'>>({
    plan: 'free',
    isPro: false,
    isPremium: false,
    purchasedModules: [],
    modulesExpiry: {},
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const supabase = createClient();

    const fetchPlan = async () => {
      const isMockMode =
        process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://mock-project.supabase.co';

      if (isMockMode) {
        setState({ plan: 'free', isPro: false, isPremium: false, purchasedModules: [], modulesExpiry: {}, isLoading: false, error: null });
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setState({ plan: 'free', isPro: false, isPremium: false, purchasedModules: [], modulesExpiry: {}, isLoading: false, error: null });
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('plan, purchased_modules, modules_expiry')
          .eq('id', user.id)
          .single();

        if (error || !profile) {
          setState({
            plan: 'free',
            isPro: false,
            isPremium: false,
            purchasedModules: [],
            modulesExpiry: {},
            isLoading: false,
            error: 'Could not load your subscription status.',
          });
          return;
        }

        const modules: string[] = (profile.purchased_modules as string[]) ?? [];
        const expiry: ModuleExpiry = (profile.modules_expiry as ModuleExpiry) ?? {};
        const plan: Plan = derivePlan(modules);
        const isPro = plan === 'pro' || plan === 'premium';
        const isPremium = plan === 'premium';

        setState({ plan, isPro, isPremium, purchasedModules: modules, modulesExpiry: expiry, isLoading: false, error: null });
      } catch {
        setState({
          plan: 'free',
          isPro: false,
          isPremium: false,
          purchasedModules: [],
          modulesExpiry: {},
          isLoading: false,
          error: 'Could not load your subscription status.',
        });
      }
    };

    void fetchPlan();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void fetchPlan();
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchPlan();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const hasModule = useCallback(
    (moduleId: string) => hasModuleAccess(state.purchasedModules, moduleId),
    [state.purchasedModules],
  );

  return { ...state, hasModule };
}
