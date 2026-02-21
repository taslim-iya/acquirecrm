import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Broker {
  id: string;
  user_id: string;
  firm: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  coverage_sector: string | null;
  coverage_geo: string | null;
  responsiveness_score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useBrokers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['brokers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brokers')
        .select('*')
        .order('firm', { ascending: true });
      if (error) throw error;
      return data as Broker[];
    },
    enabled: !!user,
  });
}

export function useCreateBroker() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (broker: Partial<Broker>) => {
      const { data, error } = await supabase
        .from('brokers')
        .insert({ ...broker, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      toast.success('Broker added');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateBroker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Broker> & { id: string }) => {
      const { data, error } = await supabase
        .from('brokers')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      toast.success('Broker updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBroker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('brokers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      toast.success('Broker deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
