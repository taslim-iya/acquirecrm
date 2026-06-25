import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables } from '@/integrations/supabase/types';

export type Company = Tables<'companies'>;

export function useCompany(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Company | null;
    },
    enabled: !!user && !!id,
  });
}

export function useCompanyContacts(companyId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['company-contacts', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!companyId,
  });
}

export function useCompanyDocuments(companyId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['company-documents', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!companyId,
  });
}

export function useCompanyActivities(companyId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['company-activities', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      // Get contacts at this company first
      const { data: contacts } = await supabase.from('contacts').select('id').eq('company_id', companyId);
      const contactIds = (contacts || []).map((c: { id: string }) => c.id);

      if (!contactIds.length) return [] as { kind: string; id: string; created_at: string; title: string; subtitle?: string }[];
      const [activitiesRes, notesRes, tasksRes] = await Promise.all([
        supabase.from('activities').select('id, created_at, activity_type, description').in('contact_id', contactIds).order('created_at', { ascending: false }).limit(50),
        supabase.from('notes').select('id, created_at, title, content').in('contact_id', contactIds).order('created_at', { ascending: false }).limit(50),
        supabase.from('tasks').select('id, created_at, title, completed').in('contact_id', contactIds).order('created_at', { ascending: false }).limit(50),
      ]);

      const items: { kind: string; id: string; created_at: string; title: string; subtitle?: string }[] = [];
      (activitiesRes.data || []).forEach((a) => {
        items.push({ kind: 'activity', id: a.id, created_at: a.created_at, title: a.activity_type, subtitle: a.description || undefined });
      });
      (notesRes.data || []).forEach((n) => {
        items.push({ kind: 'note', id: n.id, created_at: n.created_at, title: n.title || 'Note', subtitle: n.content?.slice(0, 120) });
      });
      (tasksRes.data || []).forEach((t) => {
        items.push({ kind: 'task', id: t.id, created_at: t.created_at, title: t.title, subtitle: `Task • ${t.completed ? 'done' : 'open'}` });
      });
      return items.sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    enabled: !!user && !!companyId,
  });
}
