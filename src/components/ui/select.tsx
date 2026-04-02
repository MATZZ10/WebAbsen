"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ value, onValueChange, children }: { value?: string; onValueChange?: (value: string) => void; children: React.ReactNode; }) {
  return <div>{children}</div>;
}
export function SelectTrigger({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={cn("flex h-11 w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white", className)} {...props}>{children}</button>;
}
export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="text-slate-300">{placeholder}</span>;
}
export function SelectContent({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950 p-2">{children}</div>;
}
export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <div className="cursor-pointer rounded-xl px-3 py-2 text-sm text-white hover:bg-white/10">{children}</div>;
}
