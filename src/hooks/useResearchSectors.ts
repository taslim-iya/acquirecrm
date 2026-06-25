import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

export type ResearchSector = Tables<'research_sectors'>;

export function useResearchSectors() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['research_sectors', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('research_sectors')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ResearchSector[];
    },
    enabled: !!user,
  });
}

export function useCreateResearchSector() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: Omit<TablesInsert<'research_sectors'>, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('research_sectors')
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['research_sectors'] });
      toast({ title: 'Sector added' });
    },
    onError: (e: Error) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateResearchSector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: TablesUpdate<'research_sectors'> & { id: string }) => {
      const { data, error } = await supabase
        .from('research_sectors')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['research_sectors'] }),
  });
}

export function useDeleteResearchSector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('research_sectors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['research_sectors'] });
      toast({ title: 'Sector deleted' });
    },
  });
}
