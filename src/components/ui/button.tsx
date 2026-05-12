import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
 * Apple HIG buttons:
 * - Continuous-curve corners (rounded-xl by default, full pill for compact)
 * - Filled "primary" uses a subtle vertical gradient on the system blue
 * - Tinted/secondary uses a translucent accent fill
 * - Spring easing on press, soft focus ring instead of a hard outline
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium",
    "text-[0.9375rem] leading-none tracking-[-0.011em]",
    "select-none",
    "transition-[transform,background-color,color,box-shadow,border-color] duration-150 ease-apple",
    "active:scale-[0.98] active:duration-75",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-[1.05em] [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "text-primary-foreground shadow-apple-sm hover:shadow-apple-md bg-[image:var(--gradient-primary)] hover:brightness-[1.04] active:brightness-[0.96]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-apple-sm hover:bg-destructive/95 active:bg-destructive",
        outline:
          "border border-border bg-card/70 text-foreground backdrop-blur-sm hover:bg-accent hover:border-border/80",
        secondary:
          "bg-primary/10 text-primary hover:bg-primary/15 active:bg-primary/20",
        tinted:
          "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost:
          "text-foreground hover:bg-accent/70",
        link:
          "text-primary underline-offset-4 hover:underline rounded-none",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-[0.8125rem] rounded-lg",
        lg: "h-11 px-6 text-[1rem] rounded-2xl",
        pill: "h-9 px-5 rounded-full",
        icon: "h-9 w-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
