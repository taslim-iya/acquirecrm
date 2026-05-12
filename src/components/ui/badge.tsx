import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-semibold tracking-[0.01em] uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/12 text-primary hover:bg-primary/16",
        solid: "border-transparent bg-[image:var(--gradient-primary)] text-primary-foreground shadow-apple-sm",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-accent",
        destructive: "border-transparent bg-destructive/12 text-destructive hover:bg-destructive/16",
        success: "border-transparent bg-success/12 text-success hover:bg-success/16",
        warning: "border-transparent bg-warning/15 text-[hsl(var(--warning))] hover:bg-warning/20",
        outline: "border-border/70 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
