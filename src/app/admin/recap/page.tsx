import { auth } from "@/auth";
import { ensureSchema, getMonthRange, getTodayRange, getTodaySummary, listAttendanceRange } from "@/lib/db";
import { redirect } from "next/navigation";
import { AttendanceTable, type AttendanceRow } from "@/components/admin/attendance-table";

export default async function RecapPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "teacher") redirect("/dashboard");

  await ensureSchema();

  const { start: monthStart, end: monthEnd } = getMonthRange(new Date());
  const { start: todayStart, end: todayEnd } = getTodayRange(new Date());

  const [rowsRaw, todaySummary] = await Promise.all([
    listAttendanceRange(monthStart.toISOString(), monthEnd.toISOString()),
    getTodaySummary(todayStart.toISOString(), todayEnd.toISOString()),
  ]);

  const rows: AttendanceRow[] = rowsRaw.map((item) => ({
    id: item.id,
    studentName: item.student_name,
    className: item.class_name,
    status: item.status,
    attendedAt: item.checked_in_at,
    faceImage: item.face_image_url,
    latitude: item.latitude,
    longitude: item.longitude,
    confidence: item.confidence,
    note: item.note,
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
        <div className="space-y-2">
          <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Dashboard Rekap Absensi</div>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Manajemen Absensi Guru</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-300">
            Pantau kehadiran siswa, verifikasi lokasi, cek foto scan wajah, dan ubah status secara manual dengan tampilan yang tenang dan jelas.
          </p>
        </div>
      </div>

      <AttendanceTable initialRows={rows} todaySummary={todaySummary} />
    </div>
  );
}
