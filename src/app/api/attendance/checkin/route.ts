import { NextResponse } from "next/server";
import { createAttendance, ensureSchema, listStudents } from "@/lib/db";

export async function POST(req: Request) {
  await ensureSchema();
  const body = await req.json();

  const studentId = body.studentId as string | undefined;
  const status = (body.status ?? "present") as "present" | "late" | "sick" | "alpa";

  if (!studentId) {
    return NextResponse.json({ message: "studentId required" }, { status: 400 });
  }

  const students = await listStudents();
  const exists = students.some((s) => s.id === studentId);
  if (!exists) {
    return NextResponse.json({ message: "Student not found" }, { status: 404 });
  }

  await createAttendance({
    studentId,
    status,
    checkedInAt: new Date().toISOString(),
    faceImageUrl: typeof body.faceImageUrl === "string" ? body.faceImageUrl : null,
    confidence: typeof body.confidence === "number" ? body.confidence : null,
    latitude: typeof body.latitude === "number" ? body.latitude : null,
    longitude: typeof body.longitude === "number" ? body.longitude : null,
    note: typeof body.note === "string" ? body.note : null,
  });

  return NextResponse.json({ ok: true });
}
