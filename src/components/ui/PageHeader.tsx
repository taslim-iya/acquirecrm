import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-8">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-foreground tracking-[-0.026em] leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-[0.9375rem] text-muted-foreground tracking-[-0.011em]">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
