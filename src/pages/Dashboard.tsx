import { MetricCard } from '@/components/dashboard/MetricCard';
import { PipelinePreview } from '@/components/dashboard/PipelinePreview';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { TaskList } from '@/components/dashboard/TaskList';
import { PageHeader } from '@/components/ui/PageHeader';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useAppMode } from '@/hooks/useAppMode';
import { useDeals, DEAL_STAGE_LABELS } from '@/hooks/useDeals';
import { useBrokers } from '@/hooks/useBrokers';
import {
  Users,
  Calendar,
  FileCheck,
  Percent,
  Loader2,
  TrendingUp,
  Building2,
  Target,
  Briefcase,
  Search,
} from 'lucide-react';

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { mode } = useAppMode();
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { data: brokers = [] } = useBrokers();

  const isLoading = metricsLoading || (mode === 'deal-sourcing' && dealsLoading);

  // Fundraising pipeline
  const investorStages = metrics ? [
    { name: 'Outreach', count: metrics.investorsByStage.outreach_sent, color: 'bg-stage-cold' },
    { name: 'Follow-up', count: metrics.investorsByStage.follow_up, color: 'bg-info' },
    { name: 'Meeting', count: metrics.investorsByStage.meeting_scheduled, color: 'bg-stage-warm' },
    { name: 'Interested', count: metrics.investorsByStage.interested, color: 'bg-primary' },
    { name: 'Committed', count: metrics.investorsByStage.committed + metrics.investorsByStage.closed, color: 'bg-success' },
  ] : [];

  // Deal Sourcing pipeline
  const dsStages = [
    { name: 'Screening', count: deals.filter(d => d.stage === 'screening').length, color: 'bg-muted-foreground' },
    { name: 'CIM/Teaser', count: deals.filter(d => ['teaser', 'cim'].includes(d.stage)).length, color: 'bg-info' },
    { name: 'IOI/LOI', count: deals.filter(d => ['ioi', 'loi'].includes(d.stage)).length, color: 'bg-stage-warm' },
    { name: 'DD', count: deals.filter(d => ['dd', 'financing'].includes(d.stage)).length, color: 'bg-primary' },
    { name: 'Won', count: deals.filter(d => d.stage === 'closed_won').length, color: 'bg-success' },
  ];

  const investorTotal = investorStages.reduce((sum, s) => sum + s.count, 0) || 1;
  const dsTotal = dsStages.reduce((sum, s) => sum + s.count, 0) || 1;

  const activeDeals = deals.filter(d => d.stage !== 'lost' && d.stage !== 'closed_won').length;
  const proprietaryDeals = deals.filter(d => d.source === 'proprietary').length;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title={mode === 'fundraising' ? 'Fundraising Dashboard' : 'Deal Sourcing Dashboard'}
        description={mode === 'fundraising' ? 'Track investor outreach, meetings, and commitments' : 'Track deal pipeline, targets, and broker activity'}
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {mode === 'fundraising' ? (
          <>
            <MetricCard title="Investors Contacted" value={metrics?.investorsContacted || 0} icon={<Users className="w-5 h-5" />} />
            <MetricCard title="Response Rate" value={`${metrics?.responseRate || 0}%`} icon={<Percent className="w-5 h-5" />} />
            <MetricCard title="Meetings Booked" value={metrics?.meetingsBooked || 0} icon={<Calendar className="w-5 h-5" />} />
            <MetricCard title="Commitments" value={metrics?.commitments || 0} icon={<TrendingUp className="w-5 h-5" />} />
          </>
        ) : (
          <>
            <MetricCard title="Active Deals" value={activeDeals} icon={<Briefcase className="w-5 h-5" />} />
            <MetricCard title="Target Companies" value={metrics?.totalDeals || 0} icon={<Target className="w-5 h-5" />} />
            <MetricCard title="Proprietary Deals" value={proprietaryDeals} icon={<Search className="w-5 h-5" />} />
            <MetricCard title="Brokers" value={brokers.length} icon={<Building2 className="w-5 h-5" />} />
          </>
        )}
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {mode === 'fundraising' ? (
          <PipelinePreview title="Investor Pipeline" stages={investorStages} href="/investors" total={investorTotal} />
        ) : (
          <PipelinePreview title="Deal Pipeline" stages={dsStages} href="/ds-deals" total={dsTotal} />
        )}
        <ActivityFeed />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TaskList />
      </div>
    </div>
  );
}
