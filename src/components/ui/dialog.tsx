"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode; }) {
  return open ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => onOpenChange(false)}>{children}</div> : null;
}
export function DialogContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("w-full rounded-3xl border border-white/10 bg-slate-950 p-5 text-white shadow-2xl", className)} onClick={(e) => e.stopPropagation()}>{children}</div>;
}
export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn("mb-4 space-y-1", className)} {...props} />; }
export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) { return <h3 className={cn("text-lg font-semibold", className)} {...props} />; }
export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) { return <p className={cn("text-sm text-slate-400", className)} {...props} />; }
