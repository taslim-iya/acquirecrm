import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[96px] w-full rounded-xl border border-border/80 bg-card/70 px-3.5 py-2.5 text-[0.9375rem] text-foreground backdrop-blur-sm",
        "shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)]",
        "placeholder:text-muted-foreground/80",
        "transition-[border-color,box-shadow,background-color] duration-150 ease-apple",
        "hover:border-border",
        "focus-visible:outline-none focus-visible:border-primary/60 focus-visible:bg-card focus-visible:ring-4 focus-visible:ring-primary/15",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
