import { Link } from 'react-router-dom';
import { useCompanies } from '@/hooks/useCompanies';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CompaniesList() {
  const { data: companies = [], isLoading } = useCompanies();

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Companies" description="All companies in your CRM" />
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : companies.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">No companies yet. They are auto-created when you add contacts with an organization.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {companies.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <Link to={`/companies/${c.id}`} className="font-medium hover:underline">{c.name}</Link>
                  <p className="text-xs text-muted-foreground">{[c.industry, c.hq_location].filter(Boolean).join(' • ') || '—'}</p>
                </div>
                <Button asChild variant="ghost" size="icon"><Link to={`/companies/${c.id}`}><ArrowRight className="w-4 h-4" /></Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
