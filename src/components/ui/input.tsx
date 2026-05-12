import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-border/80 bg-card/70 px-3.5 py-2 text-[0.9375rem] text-foreground",
          "shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)] backdrop-blur-sm",
          "placeholder:text-muted-foreground/80",
          "transition-[border-color,box-shadow,background-color] duration-150 ease-apple",
          "hover:border-border",
          "focus-visible:outline-none focus-visible:border-primary/60 focus-visible:bg-card focus-visible:ring-4 focus-visible:ring-primary/15",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
