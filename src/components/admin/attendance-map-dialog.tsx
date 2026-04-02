"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latitude?: number | null;
  longitude?: number | null;
  studentName?: string;
};

export function AttendanceMapDialog({ open, onOpenChange, latitude, longitude, studentName }: Props) {
  const hasLocation = typeof latitude === "number" && typeof longitude === "number";
  const src = hasLocation ? `https://www.google.com/maps?q=${latitude},${longitude}&z=18&output=embed` : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl border-white/10 bg-slate-950 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Lokasi Absen
            {studentName ? <Badge className="border-white/10 bg-white/10 text-slate-200 hover:bg-white/10">{studentName}</Badge> : null}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Titik ini diambil dari latitude dan longitude saat absensi.
          </DialogDescription>
        </DialogHeader>

        {!hasLocation ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">Data koordinat tidak tersedia.</div>
        ) : (
          <iframe title="Lokasi Absen" src={src} className="h-[520px] w-full rounded-2xl border border-white/10" loading="lazy" />
        )}
      </DialogContent>
    </Dialog>
  );
}
