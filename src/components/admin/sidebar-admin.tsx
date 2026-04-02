"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, CalendarRange, ShieldCheck } from "lucide-react";

const navItems = [
  { href: "/admin/recap", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Data Siswa", icon: Users },
  { href: "/admin/monthly", label: "Rekap Bulanan", icon: CalendarRange },
];

export function SidebarAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.08),_transparent_25%),linear-gradient(to_bottom,_#020617,_#020617)] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-80 flex-col border-r border-white/10 bg-white/5 p-4 backdrop-blur-2xl md:flex">
          <div className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight">Teacher Panel</div>
                <div className="text-sm text-slate-400">Rekap absensi real-time</div>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200",
                    active
                      ? "border-white/20 bg-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
                      : "border-white/10 bg-white/5 hover:border-white/15 hover:bg-white/10"
                  )}
                >
                  <Icon className="h-4 w-4 text-slate-200" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            Pakai layout ini supaya navigasi tetap jelas dan nyaman di layar kecil maupun besar.
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
