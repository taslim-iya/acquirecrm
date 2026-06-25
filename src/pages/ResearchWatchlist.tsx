import { Link } from 'react-router-dom';
import { useCompanies, useUpdateCompany } from '@/hooks/useCompanies';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Loader2 } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'watchlist', label: 'Watchlist' },
  { value: 'active_research', label: 'Active Research' },
  { value: 'promoted_to_target', label: 'Promoted to Target' },
  { value: 'passed', label: 'Passed' },
];

export default function ResearchWatchlist() {
  const { data: companies = [], isLoading } = useCompanies();
  const update = useUpdateCompany();

  const research = companies.filter(c => c.research_status && c.research_status !== 'none');

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Watchlist"
        description="Companies you're researching but haven't yet targeted"
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : research.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">
          No companies on the watchlist yet. Open any Company profile and set its Research Status.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {research.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <Link to={`/companies/${c.id}`} className="font-medium hover:underline">{c.name}</Link>
                  <p className="text-xs text-muted-foreground">{[c.industry, c.hq_location].filter(Boolean).join(' • ') || '—'}</p>
                </div>
                <Badge variant="outline">{c.research_status?.replace(/_/g, ' ')}</Badge>
                <Select value={c.research_status || 'watchlist'} onValueChange={(v) => update.mutate({ id: c.id, research_status: v })}>
                  <SelectTrigger className="w-44 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
                <Button asChild variant="ghost" size="icon"><Link to={`/companies/${c.id}`}><ArrowRight className="w-4 h-4" /></Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
