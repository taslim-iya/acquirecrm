import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import type { AppMode } from '@/hooks/useAppMode';

const ALL_MODES: AppMode[] = ['fundraising', 'deal-sourcing', 'research'];

/**
 * Returns the list of modes the current user can access.
 * Admins always have access to every mode.
 */
export function useModeAccess() {
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  const { data, isLoading } = useQuery({
    queryKey: ['user-mode-access', user?.id],
    queryFn: async (): Promise<AppMode[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_mode_access')
        .select('mode')
        .eq('user_id', user.id);
      if (error) return [];
      return (data ?? []).map((r) => r.mode as AppMode);
    },
    enabled: !!user,
  });

  const allowedModes: AppMode[] = isAdmin ? ALL_MODES : (data ?? ['fundraising']);

  return {
    allowedModes,
    canAccess: (mode: AppMode) => allowedModes.includes(mode),
    isLoading: isLoading || roleLoading,
  };
}
