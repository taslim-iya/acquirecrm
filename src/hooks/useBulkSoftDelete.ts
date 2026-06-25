import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type SoftDeleteTable =
  | 'contacts' | 'deals' | 'investor_deals' | 'companies'
  | 'brokers' | 'documents' | 'tasks' | 'notes';

export function useBulkSoftDelete(table: SoftDeleteTable, invalidateKeys: string[] = [table]) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (!ids.length) return 0;
      const { error } = await supabase
        // @ts-ignore - dynamic table name
        .from(table)
        .update({ deleted_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      invalidateKeys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      toast.success(`${count} item${count === 1 ? '' : 's'} deleted`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
