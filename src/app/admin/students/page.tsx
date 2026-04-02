import { auth } from "@/auth";
import { ensureSchema, listStudents } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export default async function StudentsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "teacher") redirect("/dashboard");

  await ensureSchema();
  const students = await listStudents();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
        <h1 className="text-2xl font-semibold text-white">Data Siswa</h1>
        <p className="mt-2 text-sm text-slate-300">Daftar siswa terdaftar dan kelas aktif.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {students.map((s) => (
          <Card key={s.id} className="border-white/10 bg-white/5 backdrop-blur-2xl">
            <CardContent className="p-5">
              <div className="font-medium text-white">{s.name}</div>
              <div className="mt-1 text-sm text-slate-400">{s.class_room_name ?? "-"}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
