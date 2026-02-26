import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useGenerateUpdate, useSaveUpdate } from '@/hooks/useInvestorUpdates';
import { useSendEmail } from '@/hooks/useSendEmail';
import { useInvestorDeals } from '@/hooks/useInvestorDeals';
import { Loader2, Sparkles, Send, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface InvestorUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvestorUpdateModal({ open, onOpenChange }: InvestorUpdateModalProps) {
  const [title, setTitle] = useState('Monthly Investor Update');
  const [content, setContent] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [step, setStep] = useState<'generate' | 'edit'>('generate');
  const [isSending, setIsSending] = useState(false);

  const generateUpdate = useGenerateUpdate();
  const saveUpdate = useSaveUpdate();
  const sendEmail = useSendEmail();
  const { data: investors } = useInvestorDeals();

  const committedInvestors = investors?.filter(i => ['committed', 'closed'].includes(i.stage)) || [];

  const handleGenerate = async () => {
    const result = await generateUpdate.mutateAsync(customNotes);
    setContent(result.content);
    setStep('edit');
  };

  const handleRegenerate = async () => {
    const result = await generateUpdate.mutateAsync(customNotes);
    setContent(result.content);
  };

  const handleSaveDraft = () => {
    saveUpdate.mutate({ title, content, status: 'draft' });
  };

  const handleSendToAll = async () => {
    if (committedInvestors.length === 0) {
      toast.error('No committed investors to send to');
      return;
    }

    setIsSending(true);
    try {
      // Send to each committed investor's contact
      let sentCount = 0;
      for (const investor of committedInvestors) {
        // Look up contact email if available
        if (investor.contact_id) {
          const { data: contact } = await (await import('@/integrations/supabase/client')).supabase
            .from('contacts')
            .select('email, name')
            .eq('id', investor.contact_id)
            .maybeSingle();

          if (contact?.email) {
            try {
              await sendEmail.mutateAsync({
                to: contact.email,
                subject: title,
                body: content,
              });
              sentCount++;
            } catch {
              console.error(`Failed to send to ${contact.email}`);
            }
          }
        }
      }

      // Save as sent
      saveUpdate.mutate({ title, content, status: 'sent' });
      toast.success(`Update sent to ${sentCount} investor(s)`);
      onOpenChange(false);
      resetState();
    } catch (error) {
      toast.error('Failed to send updates');
    } finally {
      setIsSending(false);
    }
  };

  const resetState = () => {
    setStep('generate');
    setContent('');
    setCustomNotes('');
    setTitle('Monthly Investor Update');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {step === 'generate' ? 'Generate Investor Update' : 'Edit & Send Update'}
          </DialogTitle>
        </DialogHeader>

        {step === 'generate' ? (
          <div className="space-y-4">
            <div>
              <Label>Update Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5"
                placeholder="Monthly Investor Update - February 2026"
              />
            </div>
            <div>
              <Label>Additional Notes (optional)</Label>
              <Textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="mt-1.5"
                rows={4}
                placeholder="Add any specific highlights, milestones, or information you'd like included in the update..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                AI will pull real data from your fundraising metrics and combine with your notes.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">Will be sent to:</p>
              <p className="text-muted-foreground">
                {committedInvestors.length > 0
                  ? `${committedInvestors.length} committed investor(s)`
                  : 'No committed investors yet. You can still generate and save as draft.'}
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generateUpdate.isPending}
              className="w-full gradient-primary text-primary-foreground"
            >
              {generateUpdate.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generate Update with AI
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>Update Content</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={generateUpdate.isPending}
                >
                  {generateUpdate.isPending ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3 mr-1" />
                  )}
                  Regenerate
                </Button>
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-1.5 min-h-[300px] font-mono text-sm"
                placeholder="Your update content..."
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveDraft} disabled={saveUpdate.isPending} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={handleSendToAll}
                disabled={isSending || committedInvestors.length === 0}
                className="flex-1 gradient-primary text-primary-foreground"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send to {committedInvestors.length} Investor(s)
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
