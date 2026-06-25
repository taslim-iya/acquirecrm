import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

export type ResearchSource = Tables<'research_sources'>;

export function useResearchSources(filters?: { companyId?: string; sectorId?: string }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['research_sources', user?.id, filters],
    queryFn: async () => {
      if (!user) return [];
      let q = supabase.from('research_sources').select('*').order('created_at', { ascending: false });
      if (filters?.companyId) q = q.eq('company_id', filters.companyId);
      if (filters?.sectorId) q = q.eq('sector_id', filters.sectorId);
      const { data, error } = await q;
      if (error) throw error;
      return data as ResearchSource[];
    },
    enabled: !!user,
  });
}

export function useCreateResearchSource() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: Omit<TablesInsert<'research_sources'>, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('research_sources')
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['research_sources'] });
      toast({ title: 'Source added' });
    },
    onError: (e: Error) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateResearchSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: TablesUpdate<'research_sources'> & { id: string }) => {
      const { data, error } = await supabase
        .from('research_sources')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['research_sources'] }),
  });
}

export function useDeleteResearchSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('research_sources').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['research_sources'] });
      toast({ title: 'Source deleted' });
    },
  });
}
