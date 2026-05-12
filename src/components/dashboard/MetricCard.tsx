import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  className,
}: MetricCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div
      className={cn(
        'apple-card p-5 animate-fade-in',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2.5 min-w-0">
          <p className="text-[0.8125rem] text-muted-foreground font-medium tracking-[-0.005em]">{title}</p>
          <p className="font-display text-[2rem] font-semibold text-foreground tracking-[-0.028em] leading-none tabular-nums">
            {value}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 pt-0.5">
              {isPositive && <TrendingUp className="w-3.5 h-3.5 text-success" strokeWidth={2.25} />}
              {isNegative && <TrendingDown className="w-3.5 h-3.5 text-destructive" strokeWidth={2.25} />}
              <span
                className={cn(
                  'text-[0.75rem] font-semibold tabular-nums',
                  isPositive && 'text-success',
                  isNegative && 'text-destructive',
                  !isPositive && !isNegative && 'text-muted-foreground',
                )}
              >
                {isPositive && '+'}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-[0.75rem] text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 [&_svg]:w-[18px] [&_svg]:h-[18px]">
          {icon}
        </div>
      </div>
    </div>
  );
}
