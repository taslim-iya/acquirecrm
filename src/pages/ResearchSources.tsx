import { useState } from 'react';
import { useResearchSources, useCreateResearchSource, useDeleteResearchSource } from '@/hooks/useResearchSources';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ExternalLink, Loader2 } from 'lucide-react';

const TYPES = ['article', 'report', 'podcast', 'transcript', 'video', 'book'];

export default function ResearchSources() {
  const { data: sources = [], isLoading } = useResearchSources();
  const create = useCreateResearchSource();
  const del = useDeleteResearchSource();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', source_type: 'article', themes: '', summary: '' });

  const submit = async () => {
    if (!form.title) return;
    await create.mutateAsync({
      title: form.title,
      url: form.url || null,
      source_type: form.source_type,
      themes: form.themes.split(',').map(s => s.trim()).filter(Boolean),
      summary: form.summary || null,
    });
    setForm({ title: '', url: '', source_type: 'article', themes: '', summary: '' });
    setOpen(false);
  };

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Source Library"
        description="Reports, articles, podcasts and other research material"
        actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1.5" />Add source</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : sources.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">No sources yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {sources.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{s.title}</p>
                    <Badge variant="outline" className="capitalize">{s.source_type}</Badge>
                  </div>
                  {s.summary && <p className="text-sm text-muted-foreground line-clamp-2">{s.summary}</p>}
                  {s.themes && s.themes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {s.themes.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                    </div>
                  )}
                </div>
                {s.url && <Button asChild variant="ghost" size="icon"><a href={s.url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a></Button>}
                <Button variant="ghost" size="icon" onClick={() => del.mutate(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add source</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://" /></div>
            <div>
              <Label>Type</Label>
              <Select value={form.source_type} onValueChange={(v) => setForm({ ...form, source_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Themes (comma separated)</Label><Input value={form.themes} onChange={(e) => setForm({ ...form, themes: e.target.value })} placeholder="hvac, succession, roll-up" /></div>
            <div><Label>Summary</Label><Textarea rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={create.isPending || !form.title}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
