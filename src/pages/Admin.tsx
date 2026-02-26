import { PageHeader } from '@/components/ui/PageHeader';
import AdminAnalytics from './AdminAnalytics';

export default function Admin() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Admin Panel"
        description="Platform analytics and administration"
      />
      <AdminAnalytics embedded />
    </div>
  );
}
