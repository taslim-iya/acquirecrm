import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { AppMode } from '@/hooks/useAppMode';

const MODES: { value: AppMode; label: string }[] = [
  { value: 'fundraising', label: 'Fundraising' },
  { value: 'deal-sourcing', label: 'Deal Sourcing' },
  { value: 'research', label: 'Research' },
];

interface TeamMember {
  user_id: string;
  email: string;
  display_name: string | null;
  roles: string[];
  modes: string[];
}

export default function AdminTeam() {
  const qc = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ['admin-team'],
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase.rpc('admin_list_team_members');
      if (error) throw error;
      return (data ?? []) as TeamMember[];
    },
  });

  const toggleMode = useMutation({
    mutationFn: async ({ userId, mode, enable }: { userId: string; mode: AppMode; enable: boolean }) => {
      if (enable) {
        const { error } = await supabase
          .from('user_mode_access')
          .insert({ user_id: userId, mode });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_mode_access')
          .delete()
          .eq('user_id', userId)
          .eq('mode', mode);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-team'] });
      qc.invalidateQueries({ queryKey: ['user-mode-access'] });
      toast.success('Access updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        title="Team & Access"
        description="Manage which modes each user can access in the app"
      />

      <Card className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Roles</th>
                {MODES.map((m) => (
                  <th key={m.value} className="px-4 py-3 text-center">{m.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={2 + MODES.length} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {members?.map((m) => {
                const isAdmin = m.roles.includes('admin');
                return (
                  <tr key={m.user_id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{m.display_name || m.email}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {m.roles.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        {m.roles.map((r) => (
                          <Badge key={r} variant={r === 'admin' ? 'default' : 'secondary'}>{r}</Badge>
                        ))}
                      </div>
                    </td>
                    {MODES.map((mode) => {
                      const has = isAdmin || m.modes.includes(mode.value);
                      return (
                        <td key={mode.value} className="px-4 py-3 text-center">
                          <Switch
                            checked={has}
                            disabled={isAdmin || toggleMode.isPending}
                            onCheckedChange={(enable) =>
                              toggleMode.mutate({ userId: m.user_id, mode: mode.value, enable })
                            }
                          />
                          {isAdmin && <div className="text-[10px] text-muted-foreground mt-1">admin</div>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {members?.length === 0 && !isLoading && (
                <tr><td colSpan={2 + MODES.length} className="p-6 text-center text-muted-foreground">No team members yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground mt-4">
        Admins automatically have access to every mode. Toggle modes on for non-admin users to grant them access in the sidebar.
      </p>
    </div>
  );
}
