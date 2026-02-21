import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Deal {
  id: string;
  user_id: string;
  company_id: string | null;
  broker_id: string | null;
  name: string;
  stage: string;
  probability: number | null;
  expected_close_date: string | null;
  valuation_notes: string | null;
  structure_notes: string | null;
  next_step: string | null;
  source: string | null;
  deal_revenue: number | null;
  deal_ebitda: number | null;
  ebitda_margin: number | null;
  recurring_rev_pct: number | null;
  nwc_notes: string | null;
  customer_concentration: string | null;
  retention_proxy: string | null;
  entry_multiple: number | null;
  leverage_pct: number | null;
  interest_rate: number | null;
  exit_multiple: number | null;
  hold_period: number | null;
  ebitda_growth: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  companies?: { name: string; industry: string | null } | null;
  brokers?: { firm: string; contact_name: string } | null;
}

export function useDeals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*, companies(name, industry), brokers(firm, contact_name)')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as Deal[];
    },
    enabled: !!user,
  });
}

export function useDeal(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deal', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*, companies(name, industry), brokers(firm, contact_name)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as Deal;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (deal: Partial<Deal>) => {
      const { data, error } = await supabase
        .from('deals')
        .insert({ ...deal, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal created');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Deal> & { id: string }) => {
      const { data, error } = await supabase
        .from('deals')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal'] });
      toast.success('Deal updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('deals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateDealStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const { error } = await supabase
        .from('deals')
        .update({ stage } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export const DEAL_STAGES = [
  'screening', 'contacted', 'teaser', 'cim', 'ioi', 'loi', 'dd', 'financing', 'signing', 'closed_won', 'lost'
] as const;

export const DEAL_STAGE_LABELS: Record<string, string> = {
  screening: 'Screening',
  contacted: 'Contacted',
  teaser: 'Teaser',
  cim: 'CIM',
  ioi: 'IOI',
  loi: 'LOI',
  dd: 'Due Diligence',
  financing: 'Financing',
  signing: 'Signing',
  closed_won: 'Closed/Won',
  lost: 'Lost',
};
