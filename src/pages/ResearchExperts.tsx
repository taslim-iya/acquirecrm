import { useContacts } from '@/hooks/useContacts';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Phone } from 'lucide-react';

const EXPERT_TYPES = ['operator', 'advisor', 'river_guide'];

export default function ResearchExperts() {
  const { data: contacts = [], isLoading } = useContacts();
  const experts = contacts.filter(c => EXPERT_TYPES.includes(c.contact_type));

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Expert Network" description="Operators, advisors, and river guides for due diligence calls" />

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : experts.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">
          No experts yet. Add contacts with type "Operator", "Advisor" or "River Guide".
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {experts.map((e) => (
            <Card key={e.id} className="hover:border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{e.title || e.organization || '—'}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize">{e.contact_type.replace(/_/g, ' ')}</Badge>
                </div>
                {e.email && <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2"><Mail className="w-3 h-3" />{e.email}</p>}
                {e.phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1"><Phone className="w-3 h-3" />{e.phone}</p>}
                {e.notes && <p className="text-xs mt-2 line-clamp-2">{e.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
