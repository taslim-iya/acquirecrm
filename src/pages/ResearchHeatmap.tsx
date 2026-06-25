import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCompanies } from '@/hooks/useCompanies';
import { useDeals } from '@/hooks/useDeals';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Row = {
  industry: string;
  companies: number;
  watchlist: number;
  activeDeals: number;
  avgMlp: number | null;
  topCompanyId?: string;
  topCompanyName?: string;
};

export default function ResearchHeatmap() {
  const { data: companies = [] } = useCompanies();
  const { data: deals = [] } = useDeals();

  const rows = useMemo<Row[]>(() => {
    const map = new Map<string, Row>();
    for (const c of companies) {
      const key = c.industry || 'Unclassified';
      const r = map.get(key) || { industry: key, companies: 0, watchlist: 0, activeDeals: 0, avgMlp: null, topCompanyName: c.name, topCompanyId: c.id };
      r.companies += 1;
      if (c.research_status === 'watchlist' || c.research_status === 'active_research') r.watchlist += 1;
      map.set(key, r);
    }
    const mlpByIndustry: Record<string, number[]> = {};
    for (const d of deals) {
      const key = d.companies?.industry || 'Unclassified';
      const r = map.get(key);
      if (r) {
        if (d.stage && !['won', 'lost'].includes(d.stage as string)) r.activeDeals += 1;
        if (d.mlp_score) {
          mlpByIndustry[key] = mlpByIndustry[key] || [];
          mlpByIndustry[key].push(d.mlp_score);
        }
      }
    }
    for (const [k, scores] of Object.entries(mlpByIndustry)) {
      const r = map.get(k);
      if (r) r.avgMlp = scores.reduce((a, b) => a + b, 0) / scores.length;
    }
    return Array.from(map.values()).sort((a, b) => (b.activeDeals + b.watchlist) - (a.activeDeals + a.watchlist));
  }, [companies, deals]);

  const maxHeat = Math.max(1, ...rows.map((r) => r.activeDeals + r.watchlist));

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Sector Heatmap" description="Deal volume and watchlist intensity by industry" />

      <Card className="mt-4">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b">
              <tr>
                <th className="text-left py-3 px-4">Industry</th>
                <th className="text-right py-3 px-4">Companies</th>
                <th className="text-right py-3 px-4">Watchlist</th>
                <th className="text-right py-3 px-4">Active Deals</th>
                <th className="text-right py-3 px-4">Avg MLP</th>
                <th className="text-left py-3 px-4 w-1/3">Heat</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">No company data yet</td></tr>
              ) : rows.map((r) => {
                const heat = (r.activeDeals + r.watchlist) / maxHeat;
                return (
                  <tr key={r.industry} className="border-b hover:bg-muted/40">
                    <td className="py-3 px-4 font-medium">{r.industry}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{r.companies}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{r.watchlist}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{r.activeDeals}</td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {r.avgMlp ? <Badge variant="secondary">{r.avgMlp.toFixed(1)}</Badge> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.max(4, heat * 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-3">
        Tip: set <Link to="/companies" className="underline">company industries</Link> and MLP scores on deals to make this heatmap meaningful.
      </p>
    </div>
  );
}
