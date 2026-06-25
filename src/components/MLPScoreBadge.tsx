import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Target } from 'lucide-react';

interface MLPScoreBadgeProps {
  score?: number | null;
  onChange?: (score: number | null) => void;
  size?: 'sm' | 'md';
  readOnly?: boolean;
}

const scoreColor = (s: number | null | undefined) => {
  if (s == null) return 'bg-muted text-muted-foreground border-border';
  if (s >= 8) return 'bg-success/15 text-success border-success/30';
  if (s >= 5) return 'bg-warning/15 text-warning border-warning/30';
  return 'bg-destructive/10 text-destructive border-destructive/30';
};

/**
 * Manual 1-10 MLP (Most Likely to Progress) score with inline editor.
 */
export function MLPScoreBadge({ score, onChange, size = 'sm', readOnly = false }: MLPScoreBadgeProps) {
  const [open, setOpen] = useState(false);
  const display = score ?? '—';
  const cls = cn(
    'inline-flex items-center gap-1 rounded-md border font-semibold transition-colors',
    size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1',
    scoreColor(score),
    !readOnly && 'cursor-pointer hover:opacity-80'
  );

  const content = (
    <>
      <Target className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      <span>MLP {display}</span>
    </>
  );

  if (readOnly || !onChange) {
    return <span className={cls} title="MLP Score">{content}</span>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cls} onClick={(e) => e.stopPropagation()} title="Set MLP Score (1-10)">
          {content}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => { onChange(n); setOpen(false); }}
              className={cn(
                'w-7 h-7 rounded text-xs font-semibold border transition-colors',
                score === n ? scoreColor(n) : 'bg-background hover:bg-muted border-border'
              )}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            className="ml-1 text-[10px] text-muted-foreground hover:text-foreground px-2"
          >
            Clear
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 px-1">Most Likely to Progress (1–10)</p>
      </PopoverContent>
    </Popover>
  );
}
