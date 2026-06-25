import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export type AppSection =
  | 'dashboard' | 'deals' | 'contacts' | 'investors' | 'cap_table'
  | 'brokers' | 'target_universe' | 'documents' | 'analytics' | 'admin';

export const SECTION_OPTIONS: { value: AppSection; label: string }[] = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'deals', label: 'Deals' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'investors', label: 'Investors' },
  { value: 'cap_table', label: 'Cap Table' },
  { value: 'brokers', label: 'Brokers' },
  { value: 'target_universe', label: 'Target Universe' },
  { value: 'documents', label: 'Documents' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'admin', label: 'Admin' },
];

export function useSectionAccess() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  const { data: sections = [] } = useQuery({
    queryKey: ['user_section_access', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_section_access')
        .select('section')
        .eq('user_id', user.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.section as AppSection);
    },
    enabled: !!user,
  });

  const hasSection = (s: AppSection) => isAdmin || sections.includes(s);

  return { sections, hasSection, isAdmin };
}
