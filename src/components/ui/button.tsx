import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-2xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 disabled:pointer-events-none disabled:opacity-50";
    const variants = {
      default: "bg-white text-slate-950 hover:bg-slate-200",
      outline: "border border-white/10 bg-white/5 text-white hover:bg-white/10",
      ghost: "bg-transparent text-white hover:bg-white/10"
    }[variant];
    const sizes = { sm: "h-9 px-3", default: "h-11 px-4 py-2" }[size];
    return <button ref={ref} className={cn(base, variants, sizes, className)} {...props} />;
  }
);
Button.displayName = "Button";
