import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCompany, useCompanyContacts, useCompanyDocuments, useCompanyActivities, useCompanyPeers } from '@/hooks/useCompany';
import { useUpdateCompany } from '@/hooks/useCompanies';
import { useDocuments } from '@/hooks/useDocuments';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, FileText, Loader2, Trash2, Download, Users, Globe, MapPin, DollarSign, Building2, GitCompare } from 'lucide-react';

const RESEARCH_STATUS = [
  { value: 'none', label: 'None' },
  { value: 'watchlist', label: 'Watchlist' },
  { value: 'active_research', label: 'Active Research' },
  { value: 'promoted_to_target', label: 'Promoted to Target' },
  { value: 'passed', label: 'Passed' },
];

export default function CompanyProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: company, isLoading } = useCompany(id);
  const { data: contacts = [] } = useCompanyContacts(id);
  const { data: documents = [] } = useCompanyDocuments(id);
  const { data: activities = [] } = useCompanyActivities(id);
  const { data: peers = [] } = useCompanyPeers(company);
  const update = useUpdateCompany();
  const { uploadDocument, deleteDocument, downloadDocument } = useDocuments();
  const [edits, setEdits] = useState<Record<string, unknown>>({});

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }
  if (!company) {
    return (
      <div className="p-6">
        <Link to="/contacts" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <p className="mt-4">Company not found.</p>
      </div>
    );
  }

  const value = (key: keyof typeof company) => (edits[key as string] ?? company[key] ?? '') as string | number;
  const setField = (key: string, v: unknown) => setEdits({ ...edits, [key]: v });

  const save = async () => {
    if (!Object.keys(edits).length) return;
    await update.mutateAsync({ id: company.id, ...edits });
    setEdits({});
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || !id) return;
    for (const f of Array.from(files)) {
      await uploadDocument.mutateAsync({ file: f, companyId: id });
    }
  };

  return (
    <div className="p-4 md:p-6">
      <Link to="/contacts" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" /> Back</Link>
      <PageHeader
        title={company.name}
        description={[company.industry, company.hq_location].filter(Boolean).join(' • ') || 'Company profile'}
        actions={
          Object.keys(edits).length > 0 ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEdits({})}>Cancel</Button>
              <Button size="sm" onClick={save} disabled={update.isPending}>Save changes</Button>
            </div>
          ) : null
        }
      />

      <Tabs defaultValue="overview" className="mt-4">
        <TabsList>
          <TabsTrigger value="overview"><Building2 className="w-4 h-4 mr-1.5" />Overview</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="w-4 h-4 mr-1.5" />Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="contacts"><Users className="w-4 h-4 mr-1.5" />Contacts ({contacts.length})</TabsTrigger>
          <TabsTrigger value="peers"><GitCompare className="w-4 h-4 mr-1.5" />Peers ({peers.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Name"><Input value={String(value('name'))} onChange={(e) => setField('name', e.target.value)} /></Field>
              <Field label="Website" icon={Globe}><Input value={String(value('website'))} onChange={(e) => setField('website', e.target.value)} placeholder="https://" /></Field>
              <Field label="Industry"><Input value={String(value('industry'))} onChange={(e) => setField('industry', e.target.value)} /></Field>
              <Field label="HQ Location" icon={MapPin}><Input value={String(value('hq_location'))} onChange={(e) => setField('hq_location', e.target.value)} /></Field>
              <Field label="Revenue" icon={DollarSign}><Input type="number" value={String(value('revenue'))} onChange={(e) => setField('revenue', e.target.value ? Number(e.target.value) : null)} /></Field>
              <Field label="Employee Count"><Input type="number" value={String(value('employee_count'))} onChange={(e) => setField('employee_count', e.target.value ? Number(e.target.value) : null)} /></Field>
              <Field label="Founded Year"><Input type="number" value={String(value('founded_year'))} onChange={(e) => setField('founded_year', e.target.value ? Number(e.target.value) : null)} /></Field>
              <Field label="Research Status">
                <Select value={String(value('research_status') || 'none')} onValueChange={(v) => setField('research_status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RESEARCH_STATUS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="SIC Codes (comma separated)" wide>
                <Input
                  value={(edits.sic_codes as string[] ?? company.sic_codes ?? []).join(', ')}
                  onChange={(e) => setField('sic_codes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                />
              </Field>
              <Field label="Description" wide><Textarea rows={3} value={String(value('description'))} onChange={(e) => setField('description', e.target.value)} /></Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Investment Thesis</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Field label="Problem"><Textarea rows={2} value={String(value('thesis_problem'))} onChange={(e) => setField('thesis_problem', e.target.value)} /></Field>
              <Field label="Why Now"><Textarea rows={2} value={String(value('thesis_why_now'))} onChange={(e) => setField('thesis_why_now', e.target.value)} /></Field>
              <Field label="What Good Looks Like"><Textarea rows={2} value={String(value('thesis_success'))} onChange={(e) => setField('thesis_success', e.target.value)} /></Field>
              <Field label="Kill Criteria"><Textarea rows={2} value={String(value('thesis_kill_criteria'))} onChange={(e) => setField('thesis_kill_criteria', e.target.value)} /></Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <label className="block border-2 border-dashed border-border hover:border-primary/50 rounded-lg p-6 text-center cursor-pointer transition-colors">
                <input type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
                {uploadDocument.isPending ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : <Upload className="w-6 h-6 mx-auto text-muted-foreground" />}
                <p className="text-sm mt-2 font-medium">Upload documents for {company.name}</p>
                <p className="text-xs text-muted-foreground">PDF, DOCX, XLSX up to 50MB</p>
              </label>

              <div className="mt-4 space-y-2">
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No documents yet</p>
                ) : documents.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/40">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{(d.size_bytes / 1024).toFixed(1)} KB • {new Date(d.created_at).toLocaleDateString()}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => downloadDocument(d)}><Download className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteDocument.mutate(d)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="mt-4">
          <Card>
            <CardContent className="p-4 space-y-2">
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No contacts linked. Set "Organization" on a contact to link it here.</p>
              ) : contacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/40">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.role || c.email || '—'}</p>
                  </div>
                  <Badge variant="secondary">{c.contact_type}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardContent className="p-4 space-y-2">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
              ) : activities.map((a) => (
                <div key={`${a.kind}-${a.id}`} className="flex items-start gap-3 p-3 rounded-lg border">
                  <Badge variant="outline" className="capitalize">{a.kind}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{a.title}</p>
                    {a.subtitle && <p className="text-xs text-muted-foreground truncate">{a.subtitle}</p>}
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="peers" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-3">Peers share industry or SIC codes with {company.name}.</p>
              {peers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No peer companies found. Set industry or SIC codes to surface peers.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground border-b">
                      <tr>
                        <th className="text-left py-2 px-2">Company</th>
                        <th className="text-left py-2 px-2">Industry</th>
                        <th className="text-right py-2 px-2">Revenue</th>
                        <th className="text-right py-2 px-2">Employees</th>
                        <th className="text-right py-2 px-2">Founded</th>
                        <th className="text-left py-2 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {peers.map((p) => (
                        <tr key={p.id} className="border-b hover:bg-muted/40">
                          <td className="py-2 px-2 font-medium"><Link to={`/companies/${p.id}`} className="hover:underline">{p.name}</Link></td>
                          <td className="py-2 px-2 text-muted-foreground">{p.industry || '—'}</td>
                          <td className="py-2 px-2 text-right tabular-nums">{p.revenue ? `$${Number(p.revenue).toLocaleString()}` : '—'}</td>
                          <td className="py-2 px-2 text-right tabular-nums">{p.employee_count ?? '—'}</td>
                          <td className="py-2 px-2 text-right tabular-nums">{p.founded_year ?? '—'}</td>
                          <td className="py-2 px-2"><Badge variant="outline" className="capitalize">{(p.research_status || 'none').replace(/_/g, ' ')}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children, wide, icon: Icon }: { label: string; children: React.ReactNode; wide?: boolean; icon?: React.ElementType }) {
  return (
    <div className={wide ? 'md:col-span-2' : ''}>
      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </Label>
      {children}
    </div>
  );
}
