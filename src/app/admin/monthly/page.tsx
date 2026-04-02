import { auth } from "@/auth";
import { ensureSchema, getMonthRange, listAttendanceRange } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export default async function MonthlyPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "teacher") redirect("/dashboard");

  await ensureSchema();
  const { start, end } = getMonthRange(new Date());
  const data = await listAttendanceRange(start.toISOString(), end.toISOString());

  const present = data.filter((d) => d.status === "present").length;
  const late = data.filter((d) => d.status === "late").length;
  const sick = data.filter((d) => d.status === "sick").length;
  const alpa = data.filter((d) => d.status === "alpa").length;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
        <h1 className="text-2xl font-semibold text-white">Rekap Bulanan</h1>
        <p className="mt-2 text-sm text-slate-300">Ringkasan absensi bulan berjalan.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Hadir", present],
          ["Terlambat", late],
          ["Sakit", sick],
          ["Alpa", alpa],
        ].map(([label, value]) => (
          <Card key={label as string} className="border-white/10 bg-white/5 backdrop-blur-2xl">
            <CardContent className="p-5">
              <div className="text-sm text-slate-400">{label as string}</div>
              <div className="mt-1 text-3xl font-semibold text-white">{value as number}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
