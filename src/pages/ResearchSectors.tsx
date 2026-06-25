import { useState } from 'react';
import { useResearchSectors, useCreateResearchSector, useDeleteResearchSector } from '@/hooks/useResearchSectors';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Loader2 } from 'lucide-react';

export default function ResearchSectors() {
  const { data: sectors = [], isLoading } = useResearchSectors();
  const create = useCreateResearchSector();
  const del = useDeleteResearchSector();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ industry: '', sic_codes: '', thesis_problem: '', thesis_why_now: '', target_multiple: '' });

  const submit = async () => {
    if (!form.industry) return;
    await create.mutateAsync({
      industry: form.industry,
      sic_codes: form.sic_codes.split(',').map(s => s.trim()).filter(Boolean),
      thesis_problem: form.thesis_problem || null,
      thesis_why_now: form.thesis_why_now || null,
      target_multiple: form.target_multiple ? Number(form.target_multiple) : null,
      status: 'active',
    });
    setForm({ industry: '', sic_codes: '', thesis_problem: '', thesis_why_now: '', target_multiple: '' });
    setOpen(false);
  };

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Sectors"
        description="Industry-level investment theses"
        actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1.5" />Add sector</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : sectors.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground text-sm">No sectors yet. Add your first thesis.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectors.map((s) => (
            <Card key={s.id} className="hover:border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{s.industry}</h3>
                    {s.sic_codes && s.sic_codes.length > 0 && (
                      <p className="text-xs text-muted-foreground">SIC: {s.sic_codes.join(', ')}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{s.status}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => del.mutate(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
                {s.thesis_problem && <p className="text-sm mt-2"><span className="text-muted-foreground">Problem:</span> {s.thesis_problem}</p>}
                {s.thesis_why_now && <p className="text-sm mt-1"><span className="text-muted-foreground">Why now:</span> {s.thesis_why_now}</p>}
                {s.target_multiple && <p className="text-sm mt-1"><span className="text-muted-foreground">Target multiple:</span> {s.target_multiple}x</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add sector thesis</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Industry *</Label><Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="e.g. Industrial services" /></div>
            <div><Label>SIC Codes (comma separated)</Label><Input value={form.sic_codes} onChange={(e) => setForm({ ...form, sic_codes: e.target.value })} placeholder="1731, 1623" /></div>
            <div><Label>Problem</Label><Textarea rows={2} value={form.thesis_problem} onChange={(e) => setForm({ ...form, thesis_problem: e.target.value })} /></div>
            <div><Label>Why now</Label><Textarea rows={2} value={form.thesis_why_now} onChange={(e) => setForm({ ...form, thesis_why_now: e.target.value })} /></div>
            <div><Label>Target multiple</Label><Input type="number" step="0.1" value={form.target_multiple} onChange={(e) => setForm({ ...form, target_multiple: e.target.value })} placeholder="3.0" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={create.isPending || !form.industry}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
