import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables, TablesInsert, Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export type DealAdviser = Tables<'deal_advisers'> & {
  contacts?: { id: string; name: string; email: string | null; organization: string | null } | null;
};
export type DealAdviserInsert = TablesInsert<'deal_advisers'>;
export type AdviserRole = Database['public']['Enums']['adviser_role'];

export const ADVISER_ROLES: { value: AdviserRole; label: string }[] = [
  { value: 'legal', label: 'Legal' },
  { value: 'financial', label: 'Financial' },
  { value: 'tax', label: 'Tax' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'other', label: 'Other' },
];

export function useDealAdvisers(dealId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['deal_advisers', dealId],
    queryFn: async () => {
      if (!dealId) return [];
      const { data, error } = await supabase
        .from('deal_advisers')
        .select('*, contacts(id, name, email, organization)')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as DealAdviser[];
    },
    enabled: !!user && !!dealId,
  });
}

export function useAddDealAdviser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Omit<DealAdviserInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('deal_advisers')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['deal_advisers', vars.deal_id] });
      toast.success('Adviser added');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveDealAdviser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; dealId: string }) => {
      const { error } = await supabase.from('deal_advisers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['deal_advisers', vars.dealId] });
      toast.success('Adviser removed');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
