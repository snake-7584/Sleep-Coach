"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-amber-500 dark:focus-visible:ring-offset-slate-900",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-slate-800 to-slate-700 text-slate-50 shadow-lg hover:from-slate-700 hover:to-slate-600 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] dark:from-amber-600 dark:to-amber-500 dark:text-slate-900 dark:hover:from-amber-500 dark:hover:to-amber-400",
        secondary:
          "bg-gradient-to-r from-slate-100 to-slate-50 text-slate-900 border border-slate-200/60 hover:from-slate-200 hover:to-slate-100 hover:shadow-md dark:from-slate-700 dark:to-slate-600 dark:text-slate-100 dark:border-slate-600/60 dark:hover:from-slate-600 dark:hover:to-slate-500",
        outline:
          "border border-slate-200/60 bg-white/60 backdrop-blur-sm hover:bg-white/80 hover:shadow-md dark:border-slate-600/60 dark:bg-slate-800/60 dark:hover:bg-slate-800/80",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4",
        lg: "h-12 rounded-xl px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
