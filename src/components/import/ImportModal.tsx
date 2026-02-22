import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';

type EntityType = 'companies' | 'contacts';

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  onImport: (records: any[]) => Promise<void>;
}

type Step = 'upload' | 'parsing' | 'preview' | 'importing' | 'done';

export function ImportModal({ open, onOpenChange, entityType, onImport }: ImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep('upload');
    setRecords([]);
    setSelectedRecords(new Set());
    setError(null);
    setProgress(0);
  }, []);

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const parseFile = async (file: File) => {
    setStep('parsing');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entity_type', entityType);

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-import`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: formData,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || `Upload failed (${resp.status})`);
      }

      const data = await resp.json();
      if (!data.records || data.records.length === 0) {
        throw new Error('No records found in file. Check the file format and try again.');
      }

      setRecords(data.records);
      setSelectedRecords(new Set(data.records.map((_: any, i: number) => i)));
      setStep('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse file');
      setStep('upload');
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    parseFile(files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleImportConfirm = async () => {
    const toImport = records.filter((_, i) => selectedRecords.has(i));
    if (toImport.length === 0) return;

    setStep('importing');
    setProgress(0);

    try {
      // Batch in chunks of 10
      const chunkSize = 10;
      for (let i = 0; i < toImport.length; i += chunkSize) {
        const chunk = toImport.slice(i, i + chunkSize);
        await onImport(chunk);
        setProgress(Math.round(((i + chunk.length) / toImport.length) * 100));
      }
      setStep('done');
      toast.success(`Successfully imported ${toImport.length} ${entityType}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
      setStep('preview');
    }
  };

  const toggleRecord = (index: number) => {
    const next = new Set(selectedRecords);
    next.has(index) ? next.delete(index) : next.add(index);
    setSelectedRecords(next);
  };

  const toggleAll = () => {
    if (selectedRecords.size === records.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(records.map((_, i) => i)));
    }
  };

  const columns = entityType === 'companies'
    ? ['name', 'industry', 'geography', 'revenue_band', 'company_status']
    : ['name', 'email', 'organization', 'role', 'contact_type'];

  const columnLabels: Record<string, string> = {
    name: 'Name', industry: 'Industry', geography: 'Geography',
    revenue_band: 'Revenue', company_status: 'Status',
    email: 'Email', organization: 'Organization', role: 'Role',
    contact_type: 'Type',
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import {entityType === 'companies' ? 'Companies' : 'Contacts'}
          </DialogTitle>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="flex-1">
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-base font-medium text-foreground mb-2">
                Drop your file here or click to browse
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                CSV, Excel (.xlsx), or PDF files supported
              </p>
              <div className="flex justify-center gap-2">
                <Badge variant="secondary">CSV</Badge>
                <Badge variant="secondary">XLSX</Badge>
                <Badge variant="secondary">PDF</Badge>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls,.pdf,.txt"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            {error && (
              <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              AI will automatically detect columns and map them to the correct fields. For best results, use a CSV with clear column headers.
            </p>
          </div>
        )}

        {/* Parsing Step */}
        {step === 'parsing' && (
          <div className="flex-1 flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-base font-medium text-foreground">AI is reading your file...</p>
            <p className="text-sm text-muted-foreground mt-1">Extracting and mapping fields automatically</p>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                Found <span className="font-medium text-foreground">{records.length}</span> records · 
                <span className="font-medium text-foreground"> {selectedRecords.size}</span> selected for import
              </p>
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selectedRecords.size === records.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            {error && (
              <div className="mb-3 flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            <ScrollArea className="flex-1 border border-border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={selectedRecords.size === records.length}
                        onChange={toggleAll}
                        className="rounded"
                      />
                    </TableHead>
                    {columns.map(col => (
                      <TableHead key={col}>{columnLabels[col] || col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record, i) => (
                    <TableRow key={i} className={selectedRecords.has(i) ? '' : 'opacity-40'}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedRecords.has(i)}
                          onChange={() => toggleRecord(i)}
                          className="rounded"
                        />
                      </TableCell>
                      {columns.map(col => (
                        <TableCell key={col} className="text-sm max-w-[200px] truncate">
                          {Array.isArray(record[col]) ? record[col].join(', ') : (record[col] || '—')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="flex-1 flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-base font-medium text-foreground mb-3">Importing records...</p>
            <div className="w-64">
              <Progress value={progress} className="h-2" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
          </div>
        )}

        {/* Done Step */}
        {step === 'done' && (
          <div className="flex-1 flex flex-col items-center justify-center py-16">
            <CheckCircle2 className="w-12 h-12 text-primary mb-4" />
            <p className="text-base font-medium text-foreground">Import complete!</p>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedRecords.size} {entityType} imported successfully
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button onClick={handleImportConfirm} disabled={selectedRecords.size === 0}>
                Import {selectedRecords.size} {entityType === 'companies' ? 'Companies' : 'Contacts'}
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button onClick={() => handleClose(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
