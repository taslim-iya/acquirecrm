import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Copy, Check, UserPlus } from 'lucide-react';
import { SECTION_OPTIONS, type AppSection } from '@/hooks/useSectionAccess';
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
  sections: string[];
}

export default function AdminTeam() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

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
        const { error } = await supabase.from('user_mode_access').insert({ user_id: userId, mode });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_mode_access').delete().eq('user_id', userId).eq('mode', mode);
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

  const toggleSection = useMutation({
    mutationFn: async ({ userId, section, enable }: { userId: string; section: AppSection; enable: boolean }) => {
      if (enable) {
        const { error } = await supabase.from('user_section_access').insert({ user_id: userId, section });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_section_access').delete().eq('user_id', userId).eq('section', section);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-team'] });
      qc.invalidateQueries({ queryKey: ['user_section_access'] });
      toast.success('Section access updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto animate-fade-in">
      <PageHeader
        title="Team & Access"
        description="Add users, set their role, and control which modes and sections they can access"
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus className="w-4 h-4 mr-1" /> Add User
          </Button>
        }
      />

      <Card className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-3 sticky left-0 bg-muted/50">User</th>
                <th className="px-3 py-3">Roles</th>
                {MODES.map((m) => (
                  <th key={m.value} className="px-3 py-3 text-center whitespace-nowrap">{m.label}</th>
                ))}
                <th className="px-2 py-3 text-center text-muted-foreground">│</th>
                {SECTION_OPTIONS.map((s) => (
                  <th key={s.value} className="px-2 py-3 text-center whitespace-nowrap">{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={3 + MODES.length + SECTION_OPTIONS.length} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {members?.map((m) => {
                const isAdmin = m.roles.includes('admin');
                return (
                  <tr key={m.user_id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-3 sticky left-0 bg-card">
                      <div className="font-medium text-foreground">{m.display_name || m.email}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </td>
                    <td className="px-3 py-3">
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
                        <td key={mode.value} className="px-3 py-3 text-center">
                          <Switch
                            checked={has}
                            disabled={isAdmin || toggleMode.isPending}
                            onCheckedChange={(enable) => toggleMode.mutate({ userId: m.user_id, mode: mode.value, enable })}
                          />
                        </td>
                      );
                    })}
                    <td className="px-2 py-3 text-center text-muted-foreground">│</td>
                    {SECTION_OPTIONS.map((s) => {
                      const has = isAdmin || m.sections.includes(s.value);
                      return (
                        <td key={s.value} className="px-2 py-3 text-center">
                          <Switch
                            checked={has}
                            disabled={isAdmin || toggleSection.isPending}
                            onCheckedChange={(enable) => toggleSection.mutate({ userId: m.user_id, section: s.value, enable })}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {members?.length === 0 && !isLoading && (
                <tr><td colSpan={3 + MODES.length + SECTION_OPTIONS.length} className="p-6 text-center text-muted-foreground">No team members yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground mt-4">
        Admins automatically have access to every mode and section. Toggle to grant access to non-admins.
      </p>

      <AddUserDialog
        open={addOpen}
        onOpenChange={(o) => { setAddOpen(o); if (!o) setCreatedCreds(null); }}
        onCreated={(c) => { setCreatedCreds(c); qc.invalidateQueries({ queryKey: ['admin-team'] }); }}
        createdCreds={createdCreds}
        copied={copied}
        setCopied={setCopied}
      />
    </div>
  );
}

function AddUserDialog({
  open, onOpenChange, onCreated, createdCreds, copied, setCopied,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (c: { email: string; password: string }) => void;
  createdCreds: { email: string; password: string } | null;
  copied: boolean;
  setCopied: (b: boolean) => void;
}) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'admin' | 'member' | 'intern'>('member');
  const [modes, setModes] = useState<Record<AppMode, boolean>>({ fundraising: true, 'deal-sourcing': false, research: false });
  const [sections, setSections] = useState<Record<AppSection, boolean>>(
    Object.fromEntries(SECTION_OPTIONS.map((s) => [s.value, ['dashboard', 'contacts'].includes(s.value)])) as Record<AppSection, boolean>
  );
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setEmail(''); setDisplayName(''); setRole('member');
    setModes({ fundraising: true, 'deal-sourcing': false, research: false });
    setSections(Object.fromEntries(SECTION_OPTIONS.map((s) => [s.value, ['dashboard', 'contacts'].includes(s.value)])) as Record<AppSection, boolean>);
  };

  const handleSubmit = async () => {
    if (!email) { toast.error('Email required'); return; }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: email.trim(),
          display_name: displayName.trim() || null,
          role,
          modes: Object.entries(modes).filter(([, v]) => v).map(([k]) => k),
          sections: Object.entries(sections).filter(([, v]) => v).map(([k]) => k),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      onCreated({ email: data.email, password: data.temp_password });
      reset();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCreds = async () => {
    if (!createdCreds) return;
    await navigator.clipboard.writeText(`Email: ${createdCreds.email}\nTemporary password: ${createdCreds.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {createdCreds ? (
          <>
            <DialogHeader>
              <DialogTitle>User created</DialogTitle>
              <DialogDescription>
                Copy these credentials now — the password won't be shown again. Hand them to the user; they can change it after signing in.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 my-4">
              <div className="bg-muted rounded-md p-3 font-mono text-sm">
                <div><span className="text-muted-foreground">email:</span> {createdCreds.email}</div>
                <div><span className="text-muted-foreground">password:</span> {createdCreds.password}</div>
              </div>
              <Button variant="outline" size="sm" onClick={copyCreds} className="w-full">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied' : 'Copy credentials'}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add a user</DialogTitle>
              <DialogDescription>
                Creates the account with a temporary password. You'll see it once — copy and share it with them.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 my-2">
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
              </div>
              <div>
                <Label className="text-xs">Display name (optional)</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Jane Smith" />
              </div>
              <div>
                <Label className="text-xs">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (full access, can manage users)</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs block mb-2">Modes</Label>
                <div className="flex flex-wrap gap-3">
                  {MODES.map((m) => (
                    <label key={m.value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Switch checked={modes[m.value]} onCheckedChange={(v) => setModes({ ...modes, [m.value]: v })} />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs block mb-2">Section access</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SECTION_OPTIONS.map((s) => (
                    <label key={s.value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Switch checked={sections[s.value]} onCheckedChange={(v) => setSections({ ...sections, [s.value]: v })} />
                      {s.label}
                    </label>
                  ))}
                </div>
                {role !== 'admin' && (
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Tip: leave Cap Table and Admin off for interns.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Creating…' : 'Create user'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
